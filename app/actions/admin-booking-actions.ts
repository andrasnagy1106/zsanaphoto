"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  createAdminEventUser,
  updateBookingPhotoPrices,
} from "@/lib/services/booking-service";
import { updateBookingPhotoPricesSchema } from "@/lib/validation/photo-order";
import { createAdminEventUserSchema } from "@/lib/validation/booking";
import { zonedDateTimeToUtc } from "@/lib/utils/time";

export interface AdminActionResult {
  success: boolean;
  error?: string;
  pin?: string;
  bookingId?: string;
}

export async function confirmBookingAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    await confirmBooking(id);
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[confirmBookingAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Valami hiba történt." };
  }
}

export async function cancelBookingAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    await cancelBooking(id);
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[cancelBookingAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Valami hiba történt." };
  }
}

export async function completeBookingAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    await completeBooking(id);
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[completeBookingAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Valami hiba történt." };
  }
}

export async function updateBookingPhotoPricesAction(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = updateBookingPhotoPricesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok." };
  }
  try {
    await updateBookingPhotoPrices(parsed.data.bookingId, parsed.data.prices ?? null);
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${parsed.data.bookingId}`);
    revalidatePath("/admin/photo-orders");
    return { success: true };
  } catch (error) {
    console.error("[updateBookingPhotoPricesAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Valami hiba történt." };
  }
}

export async function createAdminEventUserAction(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = createAdminEventUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok." };
  }

  try {
    const startAt = parsed.data.date
      ? zonedDateTimeToUtc(parsed.data.date, "10:00")
      : new Date();

    const created = await createAdminEventUser({
      serviceId: parsed.data.serviceId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone || "-",
      pin: parsed.data.pin || undefined,
      startAt,
      status: parsed.data.status,
      notes: parsed.data.notes,
      sendEmail: parsed.data.sendEmail,
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/photo-orders");

    return {
      success: true,
      pin: created.pin ?? undefined,
      bookingId: created.id,
    };
  } catch (error) {
    console.error("[createAdminEventUserAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "A létrehozás nem sikerült." };
  }
}
