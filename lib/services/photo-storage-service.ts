import { asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookings,
  eventPhotos,
  services,
  type Booking,
  type EventPhoto,
  type NewEventPhoto,
} from "@/db/schema";
import {
  buildWatermarkedUrl,
  deleteFolderFromCloudinary,
  deleteMultiplePhotosFromCloudinary,
  deletePhotoFromCloudinary,
  uploadPhotoToCloudinary,
  type WatermarkOptions,
} from "@/lib/providers/cloudinary/client";
import { NotFoundError } from "@/lib/utils/errors";

export interface UploadPhotoInput {
  pin: string;
  file: Buffer | string;
  filename?: string;
  title?: string;
  sortOrder?: number;
  watermarkOptions?: WatermarkOptions;
}

export interface UploadMultiplePhotosInput {
  pin: string;
  items: Array<{
    file: Buffer | string;
    filename?: string;
    title?: string;
    sortOrder?: number;
  }>;
  watermarkOptions?: WatermarkOptions;
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
    photoCount: row.photoCount,
  }));
}

/**
 * Uploads a single photo to Cloudinary under the PIN folder, generates its watermarked URL,
 * and saves the metadata record in the database linked to the booking.
 */
export async function uploadPhotoForPin(input: UploadPhotoInput): Promise<EventPhoto> {
  const normalizedPin = input.pin.trim().toUpperCase();

  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.pin, normalizedPin))
    .limit(1);

  if (!booking) {
    throw new NotFoundError(`Nem található foglalás a megadott PIN kóddal (${normalizedPin}).`);
  }

  const uploadResult = await uploadPhotoToCloudinary({
    file: input.file,
    pin: normalizedPin,
    filename: input.filename,
    watermarkOptions: input.watermarkOptions,
  });

  const photoTitle =
    input.title?.trim() ||
    input.filename?.replace(/\.[^/.]+$/, "") ||
    "Fotó";

  const [created] = await db
    .insert(eventPhotos)
    .values({
      bookingId: booking.id,
      pin: normalizedPin,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      watermarkedUrl: uploadResult.watermarkedUrl,
      originalFilename: uploadResult.originalFilename ?? null,
      title: photoTitle,
      width: uploadResult.width ?? null,
      height: uploadResult.height ?? null,
      bytes: uploadResult.bytes ?? null,
      format: uploadResult.format ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  return created;
}

/**
 * Uploads multiple photos to Cloudinary under the PIN folder and saves their records in the database.
 */
export async function uploadMultiplePhotosForPin(
  input: UploadMultiplePhotosInput,
): Promise<EventPhoto[]> {
  const normalizedPin = input.pin.trim().toUpperCase();

  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.pin, normalizedPin))
    .limit(1);

  if (!booking) {
    throw new NotFoundError(`Nem található foglalás a megadott PIN kóddal (${normalizedPin}).`);
  }

  const uploadedRecords: NewEventPhoto[] = [];

  for (let i = 0; i < input.items.length; i += 1) {
    const item = input.items[i];
    const uploadResult = await uploadPhotoToCloudinary({
      file: item.file,
      pin: normalizedPin,
      filename: item.filename,
      watermarkOptions: input.watermarkOptions,
    });

    const photoTitle =
      item.title?.trim() ||
      item.filename?.replace(/\.[^/.]+$/, "") ||
      `Fotó ${i + 1}`;

    uploadedRecords.push({
      bookingId: booking.id,
      pin: normalizedPin,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      watermarkedUrl: uploadResult.watermarkedUrl,
      originalFilename: uploadResult.originalFilename ?? null,
      title: photoTitle,
      width: uploadResult.width ?? null,
      height: uploadResult.height ?? null,
      bytes: uploadResult.bytes ?? null,
      format: uploadResult.format ?? null,
      sortOrder: item.sortOrder ?? i,
    });
  }

  if (uploadedRecords.length === 0) return [];

  return db.insert(eventPhotos).values(uploadedRecords).returning();
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
