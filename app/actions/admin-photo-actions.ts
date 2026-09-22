"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  deleteMultiplePhotosByIds,
  deletePhotoById,
  uploadMultiplePhotosForPin,
} from "@/lib/services/photo-storage-service";

export interface AdminPhotoActionResult {
  success: boolean;
  count?: number;
  error?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function uploadEventPhotosAction(
  formData: FormData,
): Promise<AdminPhotoActionResult> {
  await requireAdmin();

  try {
    const pin = formData.get("pin");
    if (!pin || typeof pin !== "string") {
      return { success: false, error: "A PIN kód megadása kötelező." };
    }

    const normalizedPin = pin.trim().toUpperCase();
    const rawFiles = formData.getAll("files");
    const validFiles: File[] = [];

    for (const item of rawFiles) {
      if (item instanceof File && item.size > 0) {
        if (!ALLOWED_MIME_TYPES.has(item.type)) {
          return {
            success: false,
            error: `Nem támogatott fájlformátum: ${item.name} (${item.type}). Csak JPG, PNG, WEBP és AVIF képek tölthetők fel.`,
          };
        }
        if (item.size > MAX_FILE_SIZE_BYTES) {
          return {
            success: false,
            error: `A fájl túl nagy: ${item.name} (max 25 MB megengedett).`,
          };
        }
        validFiles.push(item);
      }
    }

    if (validFiles.length === 0) {
      return { success: false, error: "Legalább egy képfájl kiválasztása szükséges." };
    }

    const items = await Promise.all(
      validFiles.map(async (file, index) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
          file: buffer,
          filename: file.name,
          title: file.name.replace(/\.[^/.]+$/, ""),
          sortOrder: index,
        };
      }),
    );

    const uploaded = await uploadMultiplePhotosForPin({
      pin: normalizedPin,
      items,
    });

    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/bookings");
    return { success: true, count: uploaded.length };
  } catch (error) {
    console.error("[uploadEventPhotosAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A képek feltöltése sikertelen volt.",
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
