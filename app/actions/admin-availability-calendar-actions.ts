"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  createAvailabilityCalendar,
  createAvailabilityCalendarSlot,
  deleteAvailabilityCalendar,
  deleteAvailabilityCalendarSlot,
} from "@/lib/services/availability-calendar-service";
import {
  availabilityCalendarSchema,
  availabilityCalendarSlotSchema,
} from "@/lib/validation/availability-calendar";
import type { AdminActionResult } from "./admin-booking-actions";

function revalidateCalendarViews() {
  revalidatePath("/admin/services");
  revalidatePath("/idopontfoglalas");
}

export async function createAvailabilityCalendarAction(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = availabilityCalendarSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen naptárnév." };
  }

  try {
    await createAvailabilityCalendar(parsed.data.name);
    revalidateCalendarViews();
    return { success: true };
  } catch (error) {
    console.error("[createAvailabilityCalendarAction] Failed:", error);
    return { success: false, error: "A naptár létrehozása nem sikerült. Lehet, hogy ez a név már foglalt." };
  }
}

export async function deleteAvailabilityCalendarAction(calendarId: string): Promise<AdminActionResult> {
  await requireAdmin();
  if (!calendarId) return { success: false, error: "Hiányzó naptárazonosító." };

  try {
    const deleted = await deleteAvailabilityCalendar(calendarId);
    if (!deleted) return { success: false, error: "A naptár nem található." };
    revalidateCalendarViews();
    return { success: true };
  } catch (error) {
    console.error("[deleteAvailabilityCalendarAction] Failed:", error);
    return { success: false, error: "A naptár törlése nem sikerült." };
  }
}

export async function createAvailabilityCalendarSlotAction(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = availabilityCalendarSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen időpont." };
  }

  try {
    await createAvailabilityCalendarSlot(parsed.data);
    revalidateCalendarViews();
    return { success: true };
  } catch (error) {
    console.error("[createAvailabilityCalendarSlotAction] Failed:", error);
    return { success: false, error: "Az idősáv mentése nem sikerült. Lehet, hogy már rögzítve van." };
  }
}

export async function deleteAvailabilityCalendarSlotAction(slotId: string): Promise<AdminActionResult> {
  await requireAdmin();
  if (!slotId) return { success: false, error: "Hiányzó idősávazonosító." };

  try {
    const deleted = await deleteAvailabilityCalendarSlot(slotId);
    if (!deleted) return { success: false, error: "Az idősáv nem található." };
    revalidateCalendarViews();
    return { success: true };
  } catch (error) {
    console.error("[deleteAvailabilityCalendarSlotAction] Failed:", error);
    return { success: false, error: "Az idősáv törlése nem sikerült." };
  }
}