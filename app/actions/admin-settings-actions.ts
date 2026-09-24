"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  createAdminUser,
  deleteAdminUser,
  type SafeAdminUser,
} from "@/lib/services/admin-user-service";
import { updateAboutPhoto, updateSettings } from "@/lib/services/settings-service";
import { uploadSitePhoto } from "@/lib/services/site-photo-service";
import { isHomeServiceCardKey } from "@/lib/home-service-cards";
import { createAdminUserSchema } from "@/lib/validation/admin-user";
import { settingsSchema } from "@/lib/validation/settings";
import type { AdminActionResult } from "./admin-booking-actions";

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"]);
const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function updateSettingsAction(formData: unknown): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Kérjük, ellenőrizd a megadott adatokat." };
  }

  try {
    await updateSettings(parsed.data);
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[updateSettingsAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}

export async function uploadAboutPhotoAction(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();

  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Válassz ki egy képfájlt." };
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      return { success: false, error: `Nem támogatott fájlformátum: ${file.name} (${file.type}).` };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: `A fájl túl nagy: ${file.name} (max 25 MB megengedett).` };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await updateAboutPhoto(buffer, file.name);

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[uploadAboutPhotoAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A kép feltöltése sikertelen volt.",
    };
  }
}

export async function uploadHeroPhotoAction(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();

  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Válassz ki egy képfájlt." };
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      return { success: false, error: `Nem támogatott fájlformátum: ${file.name} (${file.type}).` };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: `A fájl túl nagy: ${file.name} (max 25 MB megengedett).` };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadSitePhoto("hero", buffer, file.name);

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[uploadHeroPhotoAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A kép feltöltése sikertelen volt.",
    };
  }
}

export async function uploadHomeServiceCardPhotoAction(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();

  try {
    const key = formData.get("key");
    if (!key || typeof key !== "string" || !isHomeServiceCardKey(key)) {
      return { success: false, error: "Érvénytelen kártya azonosító." };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Válassz ki egy képfájlt." };
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      return { success: false, error: `Nem támogatott fájlformátum: ${file.name} (${file.type}).` };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: `A fájl túl nagy: ${file.name} (max 25 MB megengedett).` };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadSitePhoto(key, buffer, file.name);

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[uploadHomeServiceCardPhotoAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "A kép feltöltése sikertelen volt.",
    };
  }
}

export async function createAdminUserAction(
  formData: unknown,
): Promise<AdminActionResult & { user?: SafeAdminUser }> {
  await requireAdmin();

  const parsed = createAdminUserSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Kérjük, ellenőrizd a megadott adatokat.",
    };
  }

  try {
    const created = await createAdminUser(parsed.data);
    revalidatePath("/admin/settings");
    return { success: true, user: created };
  } catch (error) {
    console.error("[createAdminUserAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Az adminisztrátor létrehozása sikertelen.",
    };
  }
}

export async function deleteAdminUserAction(userId: string): Promise<AdminActionResult> {
  const currentAdmin = await requireAdmin();

  try {
    await deleteAdminUser(userId, currentAdmin.id);
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[deleteAdminUserAction] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Az adminisztrátor törlése sikertelen.",
    };
  }
}
