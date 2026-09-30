"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  upsertAvailabilityRuleForDay,
  upsertServiceAvailabilityRuleForDay,
} from "@/lib/services/availability-rule-service";
import {
  createAvailabilityDateOverride,
  deleteAvailabilityDateOverride,
} from "@/lib/services/availability-date-override-service";
import {
  availabilityDateOverrideSchema,
  availabilityRuleSchema,
  serviceAvailabilityRuleSchema,
} from "@/lib/validation/availability";
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

export async function upsertServiceAvailabilityRuleAction(
  formData: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = serviceAvailabilityRuleSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Kérjük, ellenőrizd a megadott adatokat." };
  }

  try {
    await upsertServiceAvailabilityRuleForDay(parsed.data);
    revalidatePath("/admin/services");
    revalidatePath("/idopontfoglalas");
    return { success: true };
  } catch (error) {
    console.error("[upsertServiceAvailabilityRuleAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}

export async function createAvailabilityDateOverrideAction(formData: unknown): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = availabilityDateOverrideSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Kérjük, ellenőrizd a megadott adatokat." };
  }

  try {
    await createAvailabilityDateOverride(parsed.data);
    revalidatePath("/admin/availability");
    revalidatePath("/idopontfoglalas");
    return { success: true };
  } catch (error) {
    console.error("[createAvailabilityDateOverrideAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}

export async function deleteAvailabilityDateOverrideAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Hiányzó azonosító." };
  }

  try {
    const deleted = await deleteAvailabilityDateOverride(id);
    if (!deleted) {
      return { success: false, error: "A kivétel nem található." };
    }

    revalidatePath("/admin/availability");
    revalidatePath("/idopontfoglalas");
    return { success: true };
  } catch (error) {
    console.error("[deleteAvailabilityDateOverrideAction] Failed:", error);
    return { success: false, error: "Valami hiba történt. Kérjük, próbáld meg újra." };
  }
}
