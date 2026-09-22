"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  createAdminUser,
  deleteAdminUser,
  type SafeAdminUser,
} from "@/lib/services/admin-user-service";
import { updateSettings } from "@/lib/services/settings-service";
import { createAdminUserSchema } from "@/lib/validation/admin-user";
import { settingsSchema } from "@/lib/validation/settings";
import type { AdminActionResult } from "./admin-booking-actions";

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
