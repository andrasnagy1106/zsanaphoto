"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  updateBookingCustomerPhotoViewMode,
  updateBookingShowPhotoTitles,
} from "@/lib/services/booking-service";
import {
  deleteMultiplePhotosByIds,
  deletePhotoById,
  getSignedEventPhotoUpload,
  moveEventPhoto,
  registerUploadedPhotoForPin,
  updateEventPhotoDetails,
} from "@/lib/services/photo-storage-service";
import { eventPhotoEditSchema, photoMoveDirectionSchema } from "@/lib/validation/photo-edit";
import type { Booking } from "@/db/schema";
import { z } from "zod";

export interface AdminPhotoActionResult {
  success: boolean;
  count?: number;
  error?: string;
}

const EVENT_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const directPhotoUploadSchema = z.object({
  pin: z.string().trim().toUpperCase().regex(/^[A-Z]{2}\d{5}$/),
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  mimeType: z.string().refine((value) => EVENT_PHOTO_MIME_TYPES.has(value), "Nem támogatott képformátum."),
});

const uploadedPhotoRegistrationSchema = z.object({
  pin: z.string().trim().toUpperCase().regex(/^[A-Z]{2}\d{5}$/),
  fileName: z.string().trim().min(1).max(255),
  publicId: z.string().min(1).max(500),
  version: z.number().int().positive(),
  signature: z.string().min(20).max(200),
});

export async function createEventPhotoUploadSignatureAction(input: unknown): Promise<
  AdminPhotoActionResult & { upload?: Awaited<ReturnType<typeof getSignedEventPhotoUpload>> }
> {
  await requireAdmin();
  const parsed = directPhotoUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen fájladatok." };
  }

  try {
    const upload = await getSignedEventPhotoUpload(parsed.data.pin);
    return { success: true, upload };
  } catch (error) {
    console.error("[createEventPhotoUploadSignatureAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A feltöltés engedélyezése sikertelen volt.",
    };
  }
}

export async function registerUploadedEventPhotoAction(input: unknown): Promise<AdminPhotoActionResult> {
  await requireAdmin();
  const parsed = uploadedPhotoRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen feltöltési válasz." };
  }

  try {
    await registerUploadedPhotoForPin({
      pin: parsed.data.pin,
      filename: parsed.data.fileName,
      publicId: parsed.data.publicId,
      version: parsed.data.version,
      signature: parsed.data.signature,
    });
    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/bookings");
    return { success: true, count: 1 };
  } catch (error) {
    console.error("[registerUploadedEventPhotoAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A feltöltött kép regisztrálása sikertelen volt.",
    };
  }
}

export async function deleteEventPhotoAction(
  photoId: string,
): Promise<AdminPhotoActionResult> {
  await requireAdmin();

  try {
    if (!photoId || typeof photoId !== "string") {
      return { success: false, error: "Érvénytelen fotó azonosító." };
    }

    const deleted = await deletePhotoById(photoId);
    if (!deleted) {
      return { success: false, error: "A fotó nem található vagy már törölve lett." };
    }

    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (error) {
    console.error("[deleteEventPhotoAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A fotó törlése nem sikerült.",
    };
  }
}

export async function deleteMultipleEventPhotosAction(
  photoIds: string[],
): Promise<AdminPhotoActionResult> {
  await requireAdmin();

  try {
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return { success: false, error: "Nincs kijelölve törlendő fotó." };
    }

    const count = await deleteMultiplePhotosByIds(photoIds);
    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/bookings");
    return { success: true, count };
  } catch (error) {
    console.error("[deleteMultipleEventPhotosAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A fotók törlése nem sikerült.",
    };
  }
}

export async function updateCustomerPhotoViewModeAction(
  bookingId: string,
  mode: Booking["customerPhotoViewMode"],
): Promise<AdminPhotoActionResult> {
  await requireAdmin();

  try {
    if (!bookingId) {
      return { success: false, error: "Hiányzó foglalás azonosító." };
    }
    if (mode !== "ORDER_ONLY" && mode !== "GALLERY_ONLY") {
      return { success: false, error: "Érvénytelen nézet mód." };
    }

    await updateBookingCustomerPhotoViewMode(bookingId, mode);
    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("[updateCustomerPhotoViewModeAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A nézet módosítása nem sikerült.",
    };
  }
}

export async function updateShowPhotoTitlesAction(
  bookingId: string,
  showPhotoTitles: boolean,
): Promise<AdminPhotoActionResult> {
  await requireAdmin();

  if (!bookingId || typeof showPhotoTitles !== "boolean") {
    return { success: false, error: "Érvénytelen adatok." };
  }

  try {
    await updateBookingShowPhotoTitles(bookingId, showPhotoTitles);
    revalidatePath("/admin/event-photos");
    return { success: true };
  } catch (error) {
    console.error("[updateShowPhotoTitlesAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A beállítás mentése nem sikerült.",
    };
  }
}

export async function updateEventPhotoAction(photoId: string, input: unknown): Promise<AdminPhotoActionResult> {
  await requireAdmin();

  const parsed = eventPhotoEditSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok." };
  }

  try {
    const updated = await updateEventPhotoDetails(photoId, parsed.data);
    if (!updated) return { success: false, error: "A fotó nem található." };

    revalidatePath("/admin/event-photos");
    return { success: true };
  } catch (error) {
    console.error("[updateEventPhotoAction] Failed:", error);
    return { success: false, error: "A fotó mentése nem sikerült." };
  }
}

export async function moveEventPhotoAction(photoId: string, direction: unknown): Promise<AdminPhotoActionResult> {
  await requireAdmin();

  const parsedDirection = photoMoveDirectionSchema.safeParse(direction);
  if (!parsedDirection.success) return { success: false, error: "Érvénytelen irány." };

  try {
    const moved = await moveEventPhoto(photoId, parsedDirection.data);
    if (!moved) return { success: false, error: "A fotó nem mozgatható ebbe az irányba." };

    revalidatePath("/admin/event-photos");
    return { success: true };
  } catch (error) {
    console.error("[moveEventPhotoAction] Failed:", error);
    return { success: false, error: "A sorrend módosítása nem sikerült." };
  }
}
