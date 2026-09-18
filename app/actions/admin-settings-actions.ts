"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { updateSettings } from "@/lib/services/settings-service";
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
