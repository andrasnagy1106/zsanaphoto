import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, services, type Booking, type Service } from "@/db/schema";
import { ACTIVE_BOOKING_STATUSES, BOOKING_NUMBER_PREFIX } from "@/lib/constants";
import { getEmailProvider } from "@/lib/providers/email";
import { BookingConflictError, NotFoundError } from "@/lib/utils/errors";
import { addMinutes, getZonedYear, zonedDateTimeToUtc } from "@/lib/utils/time";
import { getSiteSettings, isSlotAvailable } from "./availability-service";
import { canCancelBooking, canConfirmBooking, determineInitialBookingStatus } from "./booking-rules";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface CreateBookingInput {
  serviceId: string;
  start: Date;
  end: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
}

const EXCLUSION_VIOLATION = "23P01";
const UNIQUE_VIOLATION = "23505";

function isPgErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

async function generateBookingNumber(tx: Tx, year: number): Promise<string> {
  const [{ count }] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(sql`extract(year from ${bookings.startAt}) = ${year}`);

  const sequence = count + 1;
  return `${BOOKING_NUMBER_PREFIX}-${year}-${String(sequence).padStart(4, "0")}`;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, input.serviceId))
    .limit(1);

  if (!service || !service.active) {
    throw new NotFoundError("A kiválasztott szolgáltatás nem érhető el.");
  }

  const available = await isSlotAvailable(input.serviceId, input.start, input.end);
  if (!available) {
    throw new BookingConflictError();
  }

  const status = determineInitialBookingStatus(service.approvalMode);
  const year = getZonedYear(input.start);

  let created: Booking;

  try {
    created = await db.transaction(async (tx) => {
      const conflicting = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
            lte(bookings.startAt, input.end),
            gte(bookings.endAt, input.start),
          ),
        )
        .limit(1);

      if (conflicting.length > 0) {
        throw new BookingConflictError();
      }

      let bookingNumber = await generateBookingNumber(tx, year);
      const now = new Date();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const [row] = await tx
            .insert(bookings)
            .values({
              bookingNumber,
              serviceId: input.serviceId,
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              customerPhone: input.customerPhone,
              startAt: input.start,
              endAt: input.end,
              status,
              notes: input.notes ?? null,
              confirmedAt: status === "CONFIRMED" ? now : null,
            })
            .returning();
          return row;
        } catch (error) {
          if (isPgErrorCode(error, UNIQUE_VIOLATION) && attempt < 4) {
            bookingNumber = `${bookingNumber}-${attempt + 1}`;
            continue;
          }
          throw error;
        }
      }

      throw new Error("Nem sikerült foglalási azonosítót generálni.");
    });
  } catch (error) {
    if (isPgErrorCode(error, EXCLUSION_VIOLATION)) {
      throw new BookingConflictError();
    }
    throw error;
  }

  await sendBookingCreatedEmails(created, service.name, service.approvalMode);

  return created;
}

async function sendBookingCreatedEmails(
  booking: Booking,
  serviceName: string,
  approvalMode: "AUTO" | "MANUAL",
) {
  const settings = await getSiteSettings();
  const provider = getEmailProvider();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zsanaphoto.vercel.app";
  const manageUrl = `${siteUrl}/foglalas-kezeles?token=${booking.manageToken}`;

  const emailInput = {
    bookingNumber: booking.bookingNumber,
    serviceName,
    approvalMode,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    notes: booking.notes,
    startAt: booking.startAt,
    endAt: booking.endAt,
    adminNotificationEmail: settings.adminNotificationEmail,
    manageUrl,
  };

  try {
    await Promise.all([
      provider.sendBookingCreatedEmail(emailInput),
      provider.sendAdminNewBookingEmail(emailInput),
    ]);
  } catch (error) {
    console.error(`[booking-service] Failed to send booking created emails for ${booking.bookingNumber}:`, error);
  }
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return booking ?? null;
}

export type BookingSortOption =
  | "startAt-desc"
  | "startAt-asc"
  | "createdAt-desc"
  | "customerName-asc"
  | "customerName-desc";

export interface ListBookingsFilters {
  status?: Booking["status"];
  serviceId?: string;
  fromDate?: Date | string;
  toDate?: Date | string;
  sortBy?: BookingSortOption | string;
}

export async function listBookings(filters: ListBookingsFilters = {}) {
  const conditions = [];
  if (filters.status) conditions.push(eq(bookings.status, filters.status));
  if (filters.serviceId) conditions.push(eq(bookings.serviceId, filters.serviceId));

  if (filters.fromDate) {
    const fromInstant =
      typeof filters.fromDate === "string"
        ? zonedDateTimeToUtc(filters.fromDate, "00:00")
        : filters.fromDate;
    conditions.push(gte(bookings.startAt, fromInstant));
  }

  if (filters.toDate) {
    const toInstant =
      typeof filters.toDate === "string"
        ? addMinutes(zonedDateTimeToUtc(filters.toDate, "00:00"), 24 * 60)
        : filters.toDate;
    conditions.push(lte(bookings.startAt, toInstant));
  }

  let orderByClause = desc(bookings.startAt);
  if (filters.sortBy === "startAt-asc") {
    orderByClause = asc(bookings.startAt);
  } else if (filters.sortBy === "createdAt-desc") {
    orderByClause = desc(bookings.createdAt);
  } else if (filters.sortBy === "customerName-asc") {
    orderByClause = asc(bookings.customerName);
  } else if (filters.sortBy === "customerName-desc") {
    orderByClause = desc(bookings.customerName);
  }

  const query = db.select().from(bookings);
  const rows =
    conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(orderByClause)
      : await query.orderBy(orderByClause);

  return rows;
}

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
  const next7End = new Date(todayStart);
  next7End.setUTCDate(next7End.getUTCDate() + 7);

  const all = await db.select().from(bookings);

  const todayCount = all.filter(
    (b) => b.startAt >= todayStart && b.startAt < todayEnd && b.status !== "CANCELLED",
  ).length;
  const pendingCount = all.filter((b) => b.status === "PENDING").length;
  const confirmedCount = all.filter((b) => b.status === "CONFIRMED").length;
  const next7Count = all.filter(
    (b) => b.startAt >= todayStart && b.startAt < next7End && b.status !== "CANCELLED",
  ).length;
  const cancelledCount = all.filter((b) => b.status === "CANCELLED").length;

  return {
    todayCount,
    pendingCount,
    confirmedCount,
    next7Count,
    cancelledCount,
  };
}

export async function confirmBooking(id: string): Promise<Booking> {
  const booking = await getBookingById(id);
  if (!booking) throw new NotFoundError("A foglalás nem található.");
  if (!canConfirmBooking(booking.status)) {
    throw new Error("Csak függőben lévő foglalás hagyható jóvá.");
  }

  const [service] = await db.select().from(services).where(eq(services.id, booking.serviceId)).limit(1);

  const [updated] = await db
    .update(bookings)
    .set({ status: "CONFIRMED", confirmedAt: new Date(), updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  const settings = await getSiteSettings();
  const provider = getEmailProvider();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zsanaphoto.vercel.app";
  const manageUrl = `${siteUrl}/foglalas-kezeles?token=${updated.manageToken}`;

  try {
    await provider.sendBookingConfirmedEmail({
      bookingNumber: updated.bookingNumber,
      serviceName: service?.name ?? "",
      approvalMode: service?.approvalMode ?? "MANUAL",
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      notes: updated.notes,
      startAt: updated.startAt,
      endAt: updated.endAt,
      adminNotificationEmail: settings.adminNotificationEmail,
      manageUrl,
    });
  } catch (error) {
    console.error(`[booking-service] Failed to send confirmation email for ${updated.bookingNumber}:`, error);
  }

  return updated;
}

export async function cancelBooking(id: string): Promise<Booking> {
  const booking = await getBookingById(id);
  if (!booking) throw new NotFoundError("A foglalás nem található.");
  if (!canCancelBooking(booking.status)) return booking;

  const [service] = await db.select().from(services).where(eq(services.id, booking.serviceId)).limit(1);

  const [updated] = await db
    .update(bookings)
    .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  const settings = await getSiteSettings();
  const provider = getEmailProvider();
  try {
    await provider.sendBookingCancelledEmail({
      bookingNumber: updated.bookingNumber,
      serviceName: service?.name ?? "",
      approvalMode: service?.approvalMode ?? "MANUAL",
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      notes: updated.notes,
      startAt: updated.startAt,
      endAt: updated.endAt,
      adminNotificationEmail: settings.adminNotificationEmail,
    });
  } catch (error) {
    console.error(`[booking-service] Failed to send cancellation email for ${updated.bookingNumber}:`, error);
  }

  return updated;
}

export async function completeBooking(id: string): Promise<Booking> {
  const booking = await getBookingById(id);
  if (!booking) throw new NotFoundError("A foglalás nem található.");

  const [updated] = await db
    .update(bookings)
    .set({ status: "COMPLETED", updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  return updated;
}

export async function getBookingByManageToken(
  token: string,
): Promise<(Booking & { service: Service }) | null> {
  const [row] = await db
    .select({
      booking: bookings,
      service: services,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.manageToken, token))
    .limit(1);

  if (!row) return null;
  return { ...row.booking, service: row.service };
}

export async function cancelBookingByCustomer(token: string): Promise<Booking> {
  const bookingWithService = await getBookingByManageToken(token);
  if (!bookingWithService) throw new NotFoundError("A foglalás nem található.");
  if (!canCancelBooking(bookingWithService.status)) {
    throw new Error("Ez a foglalás már nem mondható le.");
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(bookings.id, bookingWithService.id))
    .returning();

  const settings = await getSiteSettings();
  const provider = getEmailProvider();
  const emailInput = {
    bookingNumber: updated.bookingNumber,
    serviceName: bookingWithService.service.name,
    approvalMode: bookingWithService.service.approvalMode,
    customerName: updated.customerName,
    customerEmail: updated.customerEmail,
    customerPhone: updated.customerPhone,
    notes: updated.notes,
    startAt: updated.startAt,
    endAt: updated.endAt,
    adminNotificationEmail: settings.adminNotificationEmail,
  };

  try {
    await Promise.all([
      provider.sendBookingCancelledEmail(emailInput),
      provider.sendAdminBookingCancelledEmail(emailInput),
    ]);
  } catch (error) {
    console.error(`[booking-service] Failed to send cancellation emails for ${updated.bookingNumber}:`, error);
  }

  return updated;
}

export interface RescheduleBookingInput {
  token: string;
  newStart: Date;
}

export async function rescheduleBookingByCustomer(input: RescheduleBookingInput): Promise<Booking> {
  const bookingWithService = await getBookingByManageToken(input.token);
  if (!bookingWithService) throw new NotFoundError("A foglalás nem található.");
  if (!canCancelBooking(bookingWithService.status)) {
    throw new Error("Csak aktív (függőben lévő vagy visszaigazolt) foglalás módosítható.");
  }

  const service = bookingWithService.service;
  const newEnd = addMinutes(input.newStart, service.durationMinutes);

  const available = await isSlotAvailable(service.id, input.newStart, newEnd);
  if (!available) {
    throw new BookingConflictError();
  }

  let updated: Booking;
  try {
    updated = await db.transaction(async (tx) => {
      const conflicting = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            ne(bookings.id, bookingWithService.id),
            inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
            lte(bookings.startAt, newEnd),
            gte(bookings.endAt, input.newStart),
          ),
        )
        .limit(1);

      if (conflicting.length > 0) {
        throw new BookingConflictError();
      }

      const [row] = await tx
        .update(bookings)
        .set({
          startAt: input.newStart,
          endAt: newEnd,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingWithService.id))
        .returning();

      return row;
    });
  } catch (error) {
    if (isPgErrorCode(error, EXCLUSION_VIOLATION)) {
      throw new BookingConflictError();
    }
    throw error;
  }

  const settings = await getSiteSettings();
  const provider = getEmailProvider();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zsanaphoto.vercel.app";
  const manageUrl = `${siteUrl}/foglalas-kezeles?token=${updated.manageToken}`;

  const emailInput = {
    bookingNumber: updated.bookingNumber,
    serviceName: service.name,
    approvalMode: service.approvalMode,
    customerName: updated.customerName,
    customerEmail: updated.customerEmail,
    customerPhone: updated.customerPhone,
    notes: updated.notes,
    startAt: updated.startAt,
    endAt: updated.endAt,
    adminNotificationEmail: settings.adminNotificationEmail,
    manageUrl,
  };

  try {
    await Promise.all([
      provider.sendBookingRescheduledEmail(emailInput),
      provider.sendAdminBookingRescheduledEmail(emailInput),
    ]);
  } catch (error) {
    console.error(`[booking-service] Failed to send reschedule emails for ${updated.bookingNumber}:`, error);
  }

  return updated;
}
