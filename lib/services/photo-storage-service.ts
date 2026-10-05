import { asc, desc, eq, inArray, isNotNull, max, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookings,
  eventPhotos,
  services,
  type Booking,
  type EventPhoto,
} from "@/db/schema";
import {
  buildWatermarkedUrl,
  configureCloudinary,
  createSignedEventPhotoUpload,
  deleteFolderFromCloudinary,
  deleteMultiplePhotosFromCloudinary,
  deletePhotoFromCloudinary,
  getCloudinaryFolderForPin,
  verifyCloudinaryUploadResponseSignature,
  type WatermarkOptions,
  type SignedEventPhotoUpload,
} from "@/lib/providers/cloudinary/client";
import { NotFoundError } from "@/lib/utils/errors";
import { reorderIdsByMove } from "@/lib/utils/photo-layout";
import type { EventPhotoEditInput, PhotoMoveDirection } from "@/lib/validation/photo-edit";

const MAX_EVENT_PHOTO_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EVENT_PHOTO_FORMATS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

export async function getSignedEventPhotoUpload(pin: string): Promise<SignedEventPhotoUpload> {
  const normalizedPin = pin.trim().toUpperCase();
  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.pin, normalizedPin))
    .limit(1);

  if (!booking) throw new NotFoundError("Nem található foglalás a megadott PIN kóddal.");
  return createSignedEventPhotoUpload(normalizedPin);
}

export async function registerUploadedPhotoForPin(input: {
  pin: string;
  filename: string;
  publicId: string;
  version: number;
  signature: string;
}): Promise<EventPhoto> {
  const normalizedPin = input.pin.trim().toUpperCase();
  const expectedFolderPrefix = `${getCloudinaryFolderForPin(normalizedPin)}/`;
  if (!input.publicId.startsWith(expectedFolderPrefix)) {
    throw new NotFoundError("A feltöltött kép nem ehhez az eseményhez tartozik.");
  }
  if (!verifyCloudinaryUploadResponseSignature(input.publicId, input.version, input.signature)) {
    throw new Error("A Cloudinary feltöltés hitelesítése sikertelen.");
  }

  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.pin, normalizedPin))
    .limit(1);
  if (!booking) throw new NotFoundError("Nem található foglalás a megadott PIN kóddal.");

  const [existing] = await db
    .select()
    .from(eventPhotos)
    .where(eq(eventPhotos.publicId, input.publicId))
    .limit(1);
  if (existing) {
    if (existing.bookingId === booking.id) return existing;
    throw new NotFoundError("A feltöltött kép már másik eseményhez tartozik.");
  }

  const cloudinary = configureCloudinary();
  const resource = await cloudinary.api.resource(input.publicId, {
    resource_type: "image",
    type: "upload",
  });
  const format = String(resource.format ?? "").toLowerCase();
  const bytes = Number(resource.bytes);
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  if (
    resource.public_id !== input.publicId ||
    !tags.includes(normalizedPin) ||
    !ALLOWED_EVENT_PHOTO_FORMATS.has(format) ||
    !Number.isFinite(bytes) ||
    bytes <= 0 ||
    bytes > MAX_EVENT_PHOTO_SIZE_BYTES ||
    typeof resource.secure_url !== "string"
  ) {
    throw new Error("A Cloudinary által visszaadott kép adatai érvénytelenek.");
  }

  const filename = input.filename.trim().slice(0, 255);
  const title = filename.replace(/\.[^/.]+$/, "").slice(0, 200) || "Fotó";
  const [maxOrderRow] = await db
    .select({ maxSortOrder: max(eventPhotos.sortOrder) })
    .from(eventPhotos)
    .where(eq(eventPhotos.bookingId, booking.id));

  try {
    const [created] = await db
      .insert(eventPhotos)
      .values({
        bookingId: booking.id,
        pin: normalizedPin,
        publicId: input.publicId,
        secureUrl: resource.secure_url,
        watermarkedUrl: buildWatermarkedUrl(input.publicId),
        originalFilename: String(resource.original_filename ?? filename),
        title,
        width: Number(resource.width) || null,
        height: Number(resource.height) || null,
        bytes,
        format,
        sortOrder: (maxOrderRow?.maxSortOrder ?? -1) + 1,
      })
      .returning();
    return created;
  } catch (error) {
    const [concurrentInsert] = await db
      .select()
      .from(eventPhotos)
      .where(eq(eventPhotos.publicId, input.publicId))
      .limit(1);
    if (concurrentInsert?.bookingId === booking.id) return concurrentInsert;
    throw error;
  }
}

/**
 * Returns a single photo by its database ID.
 */
export async function getPhotoById(photoId: string): Promise<EventPhoto | null> {
  const [photo] = await db
    .select()
    .from(eventPhotos)
    .where(eq(eventPhotos.id, photoId))
    .limit(1);

  return photo ?? null;
}

/**
 * Returns all stored photos for a given PIN, sorted by sortOrder ascending and createdAt.
 */
export async function listPhotosByPin(pin: string): Promise<EventPhoto[]> {
  const normalizedPin = pin.trim().toUpperCase();
  return db
    .select()
    .from(eventPhotos)
    .where(eq(eventPhotos.pin, normalizedPin))
    .orderBy(asc(eventPhotos.sortOrder), asc(eventPhotos.createdAt));
}

/**
 * Returns all stored photos for a given booking ID.
 */
export async function listPhotosByBookingId(bookingId: string): Promise<EventPhoto[]> {
  return db
    .select()
    .from(eventPhotos)
    .where(eq(eventPhotos.bookingId, bookingId))
    .orderBy(asc(eventPhotos.sortOrder), asc(eventPhotos.createdAt));
}

export interface EventWithPinOption {
  bookingId: string;
  bookingNumber: string;
  manageToken: string;
  pin: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  startAt: Date;
  status: Booking["status"];
  customerPhotoViewMode: Booking["customerPhotoViewMode"];
  showPhotoTitles: boolean;
  photoCount: number;
}

/**
 * Returns all bookings that have an assigned PIN code along with their photo counts.
 */
export async function listEventsWithPin(): Promise<EventWithPinOption[]> {
  const rows = await db
    .select({
      booking: bookings,
      service: services,
      photoCount: sql<number>`count(${eventPhotos.id})::int`,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(eventPhotos, eq(bookings.id, eventPhotos.bookingId))
    .where(isNotNull(bookings.pin))
    .groupBy(bookings.id, services.id)
    .orderBy(desc(bookings.startAt));

  return rows.map((row) => ({
    bookingId: row.booking.id,
    bookingNumber: row.booking.bookingNumber,
    manageToken: row.booking.manageToken,
    pin: row.booking.pin!,
    customerName: row.booking.customerName,
    customerEmail: row.booking.customerEmail,
    customerPhone: row.booking.customerPhone,
    serviceId: row.service.id,
    serviceName: row.service.name,
    serviceSlug: row.service.slug,
    startAt: row.booking.startAt,
    status: row.booking.status,
    customerPhotoViewMode: row.booking.customerPhotoViewMode,
    showPhotoTitles: row.booking.showPhotoTitles,
    photoCount: row.photoCount,
  }));
}

export async function updateEventPhotoDetails(photoId: string, input: EventPhotoEditInput): Promise<boolean> {
  const updated = await db
    .update(eventPhotos)
    .set({ title: input.title, focusX: input.focusX, focusY: input.focusY, updatedAt: new Date() })
    .where(eq(eventPhotos.id, photoId))
    .returning({ id: eventPhotos.id });

  return updated.length > 0;
}

/** Moves a photo one position within its booking's photo list and renumbers the sort order. */
export async function moveEventPhoto(photoId: string, direction: PhotoMoveDirection): Promise<boolean> {
  const photo = await getPhotoById(photoId);
  if (!photo) return false;

  const siblings = await listPhotosByBookingId(photo.bookingId);
  const reorderedIds = reorderIdsByMove(siblings.map((sibling) => sibling.id), photoId, direction);
  if (!reorderedIds) return false;

  await db.transaction(async (tx) => {
    for (const [index, id] of reorderedIds.entries()) {
      await tx.update(eventPhotos).set({ sortOrder: index }).where(eq(eventPhotos.id, id));
    }
  });
  return true;
}

/**
 * Deletes a single photo from Cloudinary and deletes the record from the database.
 */
export async function deletePhotoById(photoId: string): Promise<boolean> {
  const photo = await getPhotoById(photoId);
  if (!photo) return false;

  await deletePhotoFromCloudinary(photo.publicId);
  await db.delete(eventPhotos).where(eq(eventPhotos.id, photoId));
  return true;
}

/**
 * Deletes multiple photos by database IDs from Cloudinary and removes them from the database.
 */
export async function deleteMultiplePhotosByIds(photoIds: string[]): Promise<number> {
  if (photoIds.length === 0) return 0;

  const photos = await db
    .select()
    .from(eventPhotos)
    .where(inArray(eventPhotos.id, photoIds));

  if (photos.length === 0) return 0;

  await deleteMultiplePhotosFromCloudinary(photos.map((p) => p.publicId));
  const deleted = await db
    .delete(eventPhotos)
    .where(inArray(eventPhotos.id, photoIds))
    .returning();

  return deleted.length;
}

/**
 * Deletes all photos associated with a PIN from Cloudinary (including folder) and removes them from DB.
 */
export async function deleteAllPhotosByPin(pin: string): Promise<number> {
  const normalizedPin = pin.trim().toUpperCase();
  const photos = await listPhotosByPin(normalizedPin);

  if (photos.length === 0) return 0;

  await deleteFolderFromCloudinary(normalizedPin);
  const deleted = await db
    .delete(eventPhotos)
    .where(eq(eventPhotos.pin, normalizedPin))
    .returning();

  return deleted.length;
}

/**
 * Dynamically generates a watermarked URL with custom options for any given Cloudinary publicId.
 */
export function getWatermarkedPhotoUrl(
  publicId: string,
  options?: WatermarkOptions,
): string {
  return buildWatermarkedUrl(publicId, options);
}
