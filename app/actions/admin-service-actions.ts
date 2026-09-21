"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { updateService, type UpdateServiceInput } from "@/lib/services/service-service";
import { updateServiceSchema } from "@/lib/validation/service";
import type { AdminActionResult } from "./admin-booking-actions";

export async function updateServiceAction(formData: unknown): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = updateServiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Kérjük, ellenőrizd a megadott adatokat." };
  }

  const input: UpdateServiceInput = {
    name: parsed.data.name,
    description: parsed.data.description,
    durationMinutes: parsed.data.durationMinutes,
    bufferMinutes: parsed.data.bufferMinutes,
    approvalMode: parsed.data.approvalMode,
    availabilityMode: parsed.data.availabilityMode,
    dateRangeStart: parsed.data.dateRangeStart,
    dateRangeEnd: parsed.data.dateRangeEnd,
    active: parsed.data.active,
  };

  try {
    await updateService(parsed.data.id, input);
    revalidatePath("/admin/services");
    revalidatePath("/idopontfoglalas");
    return { success: true };
  } catch (error) {
    console.error("[updateServiceAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}
