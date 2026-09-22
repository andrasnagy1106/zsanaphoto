import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookings,
  eventPhotos,
  photoOrders,
  serviceAvailabilityRules,
  services,
  type NewService,
  type Service,
} from "@/db/schema";
import { deleteFolderFromCloudinary } from "@/lib/providers/cloudinary/client";
import { getEmailProvider } from "@/lib/providers/email";
import { NotFoundError } from "@/lib/utils/errors";
import { slugify } from "@/lib/utils/slug";
import { getSiteSettings } from "./availability-service";

export async function listServices(): Promise<Service[]> {
  return db.select().from(services).orderBy(asc(services.sortOrder));
}

export async function listActiveServices(): Promise<Service[]> {
  return db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const [service] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return service ?? null;
}

export async function getServiceById(id: string): Promise<Service | null> {
  const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return service ?? null;
}

export type CreateServiceInput = {
  name: string;
  slug?: string;
  description?: string;
  durationMinutes?: number;
  bufferMinutes?: number;
  approvalMode?: "AUTO" | "MANUAL";
  availabilityMode?: "GLOBAL" | "CUSTOM";
  dateRangeStart?: string | null;
  dateRangeEnd?: string | null;
  active?: boolean;
};

export async function createService(input: CreateServiceInput): Promise<Service> {
  let baseSlug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  if (!baseSlug) baseSlug = "szolgaltatas";

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await getServiceBySlug(slug);
    if (!existing) break;
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const [maxOrderRow] = await db
    .select({ maxOrder: sql<number>`max(${services.sortOrder})::int` })
    .from(services);

  const nextSortOrder = (maxOrderRow?.maxOrder ?? 0) + 1;

  const [created] = await db
    .insert(services)
    .values({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() ?? "",
      durationMinutes: input.durationMinutes ?? 60,
      bufferMinutes: input.bufferMinutes ?? 0,
      approvalMode: input.approvalMode ?? "AUTO",
      availabilityMode: input.availabilityMode ?? "GLOBAL",
      dateRangeStart: input.dateRangeStart || null,
      dateRangeEnd: input.dateRangeEnd || null,
      active: input.active ?? true,
      sortOrder: nextSortOrder,
    })
    .returning();

  return created;
}

export type UpdateServiceInput = Partial<
  Pick<
    NewService,
    | "name"
    | "description"
    | "durationMinutes"
    | "bufferMinutes"
    | "approvalMode"
    | "availabilityMode"
    | "dateRangeStart"
    | "dateRangeEnd"
    | "active"
    | "sortOrder"
  >
>;

export async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  const [updated] = await db
    .update(services)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();

  if (!updated) throw new NotFoundError("A szolgáltatás nem található.");
  return updated;
}

export interface ServiceDeletionSummary {
  service: Service;
  totalBookings: number;
  futureActiveBookings: number;
  photoOrdersCount: number;
  photosCount: number;
  pinsCount: number;
}

export async function getServiceDeletionSummary(
  serviceId: string,
): Promise<ServiceDeletionSummary | null> {
  const service = await getServiceById(serviceId);
  if (!service) return null;

  const serviceBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.serviceId, serviceId));

  const now = new Date();
  const futureActiveBookings = serviceBookings.filter(
    (b) => b.startAt >= now && (b.status === "PENDING" || b.status === "CONFIRMED"),
  ).length;

  const bookingIds = serviceBookings.map((b) => b.id);
  const distinctPins = new Set(serviceBookings.map((b) => b.pin).filter(Boolean));

  let photoOrdersCount = 0;
  let photosCount = 0;

  if (bookingIds.length > 0) {
    const [ordersRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(photoOrders)
      .where(inArray(photoOrders.bookingId, bookingIds));
    photoOrdersCount = ordersRow?.count ?? 0;

    const [photosRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventPhotos)
      .where(inArray(eventPhotos.bookingId, bookingIds));
    photosCount = photosRow?.count ?? 0;
  }

  return {
    service,
    totalBookings: serviceBookings.length,
    futureActiveBookings,
    photoOrdersCount,
    photosCount,
    pinsCount: distinctPins.size,
  };
}

export interface DeleteServiceResult {
  deleted: boolean;
  cancelledBookingsNotified: number;
  deletedPhotosCount: number;
  deletedOrdersCount: number;
}

export async function deleteService(serviceId: string): Promise<DeleteServiceResult> {
  const service = await getServiceById(serviceId);
  if (!service) throw new NotFoundError("A szolgáltatás nem található.");

  const serviceBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.serviceId, serviceId));

  const bookingIds = serviceBookings.map((b) => b.id);
  const pins = Array.from(new Set(serviceBookings.map((b) => b.pin).filter((p): p is string => Boolean(p))));

  const now = new Date();
  // Only future active bookings get cancellation emails
  const futureActiveBookings = serviceBookings.filter(
    (b) => b.startAt >= now && (b.status === "PENDING" || b.status === "CONFIRMED"),
  );

  // 1. Delete all Cloudinary photo folders for all PINs belonging to this service
  for (const pin of pins) {
    try {
      await deleteFolderFromCloudinary(pin);
    } catch (err) {
      console.error(`[deleteService] Failed to delete Cloudinary folder for PIN ${pin}:`, err);
    }
  }

  // 2. Cascade delete database records in transaction
  await db.transaction(async (tx) => {
    if (bookingIds.length > 0) {
      await tx.delete(eventPhotos).where(inArray(eventPhotos.bookingId, bookingIds));
      await tx.delete(photoOrders).where(inArray(photoOrders.bookingId, bookingIds));
      await tx.delete(bookings).where(inArray(bookings.id, bookingIds));
    }
    await tx
      .delete(serviceAvailabilityRules)
      .where(eq(serviceAvailabilityRules.serviceId, serviceId));
    await tx.delete(services).where(eq(services.id, serviceId));
  });

  // 3. Send cancellation emails ONLY to future active bookings
  let notifiedCount = 0;
  if (futureActiveBookings.length > 0) {
    try {
      const settings = await getSiteSettings();
      const provider = getEmailProvider();

      for (const booking of futureActiveBookings) {
        try {
          await provider.sendBookingCancelledEmail({
            bookingNumber: booking.bookingNumber,
            serviceName: service.name,
            approvalMode: service.approvalMode,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            notes: booking.notes,
            startAt: booking.startAt,
            endAt: booking.endAt,
            adminNotificationEmail: settings.adminNotificationEmail,
          });
          notifiedCount += 1;
        } catch (mailError) {
          console.error(
            `[deleteService] Failed to send cancellation email to ${booking.customerEmail}:`,
            mailError,
          );
        }
      }
    } catch (error) {
      console.error("[deleteService] Failed during notification batch:", error);
    }
  }

  return {
    deleted: true,
    cancelledBookingsNotified: notifiedCount,
    deletedPhotosCount: 0,
    deletedOrdersCount: 0,
  };
}
