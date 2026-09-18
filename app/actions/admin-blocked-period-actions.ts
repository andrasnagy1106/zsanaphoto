"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { createBlockedPeriod, deleteBlockedPeriod } from "@/lib/services/blocked-period-service";
import { createBlockedPeriodSchema } from "@/lib/validation/blocked-period";
import type { AdminActionResult } from "./admin-booking-actions";

export async function createBlockedPeriodAction(formData: unknown): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = createBlockedPeriodSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Kérjük, ellenőrizd a megadott adatokat." };
  }

  try {
    await createBlockedPeriod({
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      reason: parsed.data.reason,
    });
    revalidatePath("/admin/blocked-periods");
    return { success: true };
  } catch (error) {
    console.error("[createBlockedPeriodAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}

export async function deleteBlockedPeriodAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();

  try {
    await deleteBlockedPeriod(id);
    revalidatePath("/admin/blocked-periods");
    return { success: true };
  } catch (error) {
    console.error("[deleteBlockedPeriodAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}
