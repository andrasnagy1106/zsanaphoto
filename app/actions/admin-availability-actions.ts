"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { upsertAvailabilityRuleForDay } from "@/lib/services/availability-rule-service";
import { availabilityRuleSchema } from "@/lib/validation/availability";
import type { AdminActionResult } from "./admin-booking-actions";

export async function upsertAvailabilityRuleAction(formData: unknown): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = availabilityRuleSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Kérjük, ellenőrizd a megadott adatokat." };
  }

  try {
    await upsertAvailabilityRuleForDay(parsed.data);
    revalidatePath("/admin/availability");
    return { success: true };
  } catch (error) {
    console.error("[upsertAvailabilityRuleAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}
