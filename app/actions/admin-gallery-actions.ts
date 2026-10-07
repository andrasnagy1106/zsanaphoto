"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  deleteGalleryPhotoById,
  moveGalleryPhoto,
  updateGalleryPhotoDetails,
  uploadGalleryPhoto,
} from "@/lib/services/gallery-service";
import { isGalleryCategory } from "@/lib/gallery-categories";
import { isPagePhotoKey } from "@/lib/service-page-photos";
import { galleryPhotoEditSchema, photoMoveDirectionSchema } from "@/lib/validation/photo-edit";

export interface AdminGalleryActionResult {
  success: boolean;
  error?: string;
}

/** Gallery photos appear on the homepage, /galeria and the service pages, so refresh the whole public site. */
function revalidateGalleryPaths() {
  revalidatePath("/", "layout");
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function uploadGalleryPhotoAction(formData: FormData): Promise<AdminGalleryActionResult> {
  await requireAdmin();

  try {
    const category = formData.get("category");
    if (
      !category ||
      typeof category !== "string" ||
      !(isGalleryCategory(category) || isPagePhotoKey(category))
    ) {
      return { success: false, error: "Válassz érvényes galéria kategóriát." };
    }

    const caption = formData.get("caption");
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Válassz ki egy képfájlt." };
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return {
        success: false,
        error: `Nem támogatott fájlformátum: ${file.name} (${file.type}). Csak JPG, PNG, WEBP és AVIF képek tölthetők fel.`,
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: `A fájl túl nagy: ${file.name} (max 25 MB megengedett).` };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadGalleryPhoto({
      category,
      file: buffer,
      filename: file.name,
      caption: typeof caption === "string" ? caption : undefined,
    });

    revalidateGalleryPaths();
    return { success: true };
  } catch (error) {
    console.error("[uploadGalleryPhotoAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A kép feltöltése sikertelen volt.",
    };
  }
}

export async function deleteGalleryPhotoAction(photoId: string): Promise<AdminGalleryActionResult> {
  await requireAdmin();

  try {
    const deleted = await deleteGalleryPhotoById(photoId);
    if (!deleted) {
      return { success: false, error: "A fotó nem található vagy már törölve lett." };
    }

    revalidateGalleryPaths();
    return { success: true };
  } catch (error) {
    console.error("[deleteGalleryPhotoAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A fotó törlése nem sikerült.",
    };
  }
}

export async function updateGalleryPhotoAction(
  photoId: string,
  input: unknown,
): Promise<AdminGalleryActionResult> {
  await requireAdmin();

  const parsed = galleryPhotoEditSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok." };
  }

  try {
    const updated = await updateGalleryPhotoDetails(photoId, parsed.data);
    if (!updated) return { success: false, error: "A fotó nem található." };

    revalidateGalleryPaths();
    return { success: true };
  } catch (error) {
    console.error("[updateGalleryPhotoAction] Failed:", error);
    return { success: false, error: "A fotó mentése nem sikerült." };
  }
}

export async function moveGalleryPhotoAction(
  photoId: string,
  direction: unknown,
): Promise<AdminGalleryActionResult> {
  await requireAdmin();

  const parsedDirection = photoMoveDirectionSchema.safeParse(direction);
  if (!parsedDirection.success) return { success: false, error: "Érvénytelen irány." };

  try {
    const moved = await moveGalleryPhoto(photoId, parsedDirection.data);
    if (!moved) return { success: false, error: "A fotó nem mozgatható ebbe az irányba." };

    revalidateGalleryPaths();
    return { success: true };
  } catch (error) {
    console.error("[moveGalleryPhotoAction] Failed:", error);
    return { success: false, error: "A sorrend módosítása nem sikerült." };
  }
}
