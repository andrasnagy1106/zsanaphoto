import { randomInt } from "node:crypto";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookings,
  photoOrderItems,
  photoOrders,
  services,
  type Booking,
  type PhotoOrder,
  type PhotoOrderItem,
  type Service,
} from "@/db/schema";
import {
  STOCK_PHOTOS,
  resolvePhotoPrices,
  type PhotoPrintSize,
} from "@/lib/photo-order-catalog";
import { INSTITUTION_SERVICE_SLUG } from "@/lib/constants";
import { getEmailProvider } from "@/lib/providers/email";
import { NotFoundError } from "@/lib/utils/errors";
import { getSiteSettings } from "./availability-service";
import { listPhotosByBookingId } from "./photo-storage-service";

const PHOTO_ORDER_ACCESS_STATUSES: Booking["status"][] = ["CONFIRMED", "COMPLETED"];
const ACTIVE_PHOTO_ORDER_STATUSES: PhotoOrder["status"][] = ["NEW", "PROCESSING"];

export interface PhotoOrderAccess {
  booking: Booking;
  service: Service;
}

export interface SavePhotoOrderInput {
  accessToken: string;
  notes?: string;
  items: Array<{
    photoId: string;
    size: PhotoPrintSize;
    quantity: number;
  }>;
}

export interface PhotoOrderWithDetails {
  order: PhotoOrder;
  booking: Booking;
  service: Service;
  items: PhotoOrderItem[];
}

export interface SavedPhotoOrder extends PhotoOrderWithDetails {
  wasUpdated: boolean;
}

export async function getPhotoOrderAccessByPin(pin: string): Promise<PhotoOrderAccess | null> {
  const [row] = await db
    .select({ booking: bookings, service: services })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.pin, pin),
        eq(services.slug, INSTITUTION_SERVICE_SLUG),
        inArray(bookings.status, PHOTO_ORDER_ACCESS_STATUSES),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getPhotoOrderAccessByToken(accessToken: string): Promise<PhotoOrderAccess | null> {
  const [row] = await db
    .select({ booking: bookings, service: services })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.manageToken, accessToken),
        isNotNull(bookings.pin),
        eq(services.slug, INSTITUTION_SERVICE_SLUG),
        inArray(bookings.status, PHOTO_ORDER_ACCESS_STATUSES),
      ),
    )
    .limit(1);

  return row ?? null;
}

function generatePhotoOrderNumber(): string {
  return `ZR-${new Date().getUTCFullYear()}-${String(randomInt(100_000)).padStart(5, "0")}`;
}

export async function getActivePhotoOrderForBooking(
  bookingId: string,
): Promise<Pick<PhotoOrderWithDetails, "order" | "items"> | null> {
  const [order] = await db
    .select()
    .from(photoOrders)
    .where(
      and(
        eq(photoOrders.bookingId, bookingId),
        inArray(photoOrders.status, ACTIVE_PHOTO_ORDER_STATUSES),
      ),
    )
    .limit(1);

  if (!order) return null;
  const items = await db
    .select()
    .from(photoOrderItems)
    .where(eq(photoOrderItems.orderId, order.id));
  return { order, items };
}

export async function savePhotoOrder(input: SavePhotoOrderInput): Promise<SavedPhotoOrder> {
  const access = await getPhotoOrderAccessByToken(input.accessToken);
  if (!access) throw new NotFoundError("A fotók nem érhetők el ezzel a hozzáféréssel.");

  const [settings, eventPhotosList] = await Promise.all([
    getSiteSettings(),
    listPhotosByBookingId(access.booking.id),
  ]);

  const photoLookup = new Map<string, { title: string }>();
  for (const photo of STOCK_PHOTOS) {
    photoLookup.set(photo.id, { title: photo.title });
  }
  for (const photo of eventPhotosList) {
    photoLookup.set(photo.id, { title: photo.title });
  }

  const prices = resolvePhotoPrices(
    access.booking.customPhotoPrices,
    settings.defaultPhotoPrices,
  );
  const trustedItems = input.items.map((item) => {
    const photo = photoLookup.get(item.photoId);
    if (!photo) throw new NotFoundError("A kiválasztott fotó nem található.");
    const unitPrice = prices[item.size] ?? 0;
    const totalPrice = unitPrice * item.quantity;
    return { ...item, photoTitle: photo.title, unitPrice, totalPrice };
  });

  const totalAmount = trustedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const saved = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT ${bookings.id} FROM ${bookings} WHERE ${bookings.id} = ${access.booking.id} FOR UPDATE`,
    );

    const [activeOrder] = await tx
      .select()
      .from(photoOrders)
      .where(
        and(
          eq(photoOrders.bookingId, access.booking.id),
          inArray(photoOrders.status, ACTIVE_PHOTO_ORDER_STATUSES),
        ),
      )
      .limit(1);

    let savedOrder: PhotoOrder | undefined;
    const wasUpdated = Boolean(activeOrder);

    if (activeOrder) {
      [savedOrder] = await tx
        .update(photoOrders)
        .set({
          totalAmount,
          notes: input.notes?.trim() || null,
          status: "NEW",
          updatedAt: new Date(),
        })
        .where(eq(photoOrders.id, activeOrder.id))
        .returning();
      await tx.delete(photoOrderItems).where(eq(photoOrderItems.orderId, activeOrder.id));
    }

    for (let attempt = 0; attempt < 5 && !savedOrder; attempt += 1) {
      [savedOrder] = await tx
        .insert(photoOrders)
        .values({
          orderNumber: generatePhotoOrderNumber(),
          bookingId: access.booking.id,
          totalAmount,
          notes: input.notes?.trim() || null,
        })
        .onConflictDoNothing({ target: photoOrders.orderNumber })
        .returning();
    }

    if (!savedOrder) throw new Error("Nem sikerült rendelési azonosítót generálni.");

    const createdItems = await tx
      .insert(photoOrderItems)
      .values(
        trustedItems.map((item) => ({
          orderId: savedOrder.id,
          photoId: item.photoId,
          photoTitle: item.photoTitle,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      )
      .returning();

    return {
      order: savedOrder,
      booking: access.booking,
      service: access.service,
      items: createdItems,
      wasUpdated,
    };
  });

  try {
    const settings = await getSiteSettings();
    const emailInput = {
      orderNumber: saved.order.orderNumber,
      bookingNumber: saved.booking.bookingNumber,
      customerName: saved.booking.customerName,
      customerEmail: saved.booking.customerEmail,
      serviceName: saved.service.name,
      adminNotificationEmail: settings.adminNotificationEmail,
      notes: saved.order.notes,
      isUpdate: saved.wasUpdated,
      totalAmount: saved.order.totalAmount,
      items: saved.items.map((item) => ({
        photoTitle: item.photoTitle,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    };
    const provider = getEmailProvider();
    await Promise.all([
      provider.sendPhotoOrderConfirmationEmail(emailInput),
      provider.sendAdminPhotoOrderNotificationEmail(emailInput),
    ]);
  } catch (error) {
    console.error(`[photo-order-service] Failed to send emails for ${saved.order.orderNumber}:`, error);
  }

  return saved;
}

export async function getPhotoOrdersForBooking(bookingId: string): Promise<PhotoOrderWithDetails[]> {
  const rows = await db
    .select({ order: photoOrders, booking: bookings, service: services })
    .from(photoOrders)
    .innerJoin(bookings, eq(photoOrders.bookingId, bookings.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(photoOrders.bookingId, bookingId))
    .orderBy(desc(photoOrders.createdAt));

  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(photoOrderItems)
    .where(inArray(photoOrderItems.orderId, rows.map((row) => row.order.id)));
  const itemsByOrderId = Map.groupBy(items, (item) => item.orderId);

  return rows.map((row) => ({ ...row, items: itemsByOrderId.get(row.order.id) ?? [] }));
}

export async function listPhotoOrders(): Promise<PhotoOrderWithDetails[]> {
  const rows = await db
    .select({ order: photoOrders, booking: bookings, service: services })
    .from(photoOrders)
    .innerJoin(bookings, eq(photoOrders.bookingId, bookings.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .orderBy(desc(photoOrders.createdAt));

  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(photoOrderItems)
    .where(inArray(photoOrderItems.orderId, rows.map((row) => row.order.id)));
  const itemsByOrderId = Map.groupBy(items, (item) => item.orderId);

  return rows.map((row) => ({ ...row, items: itemsByOrderId.get(row.order.id) ?? [] }));
}

export async function updatePhotoOrderStatus(
  orderId: string,
  status: PhotoOrder["status"],
): Promise<PhotoOrder> {
  const [updated] = await db
    .update(photoOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(photoOrders.id, orderId))
    .returning();

  if (!updated) throw new NotFoundError("A rendelés nem található.");
  return updated;
}