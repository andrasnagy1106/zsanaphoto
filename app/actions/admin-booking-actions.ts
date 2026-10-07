"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  createAdminEventUser,
  deleteBookingsWithoutNotification,
  deleteBookingWithoutNotification,
} from "@/lib/services/booking-service";
import { bulkDeleteBookingsSchema, createAdminEventUserSchema } from "@/lib/validation/booking";
import { zonedDateTimeToUtc } from "@/lib/utils/time";

export interface AdminActionResult {
  success: boolean;
  error?: string;
  pin?: string;
  bookingId?: string;
  deletedCount?: number;
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

export async function deleteBookingAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id.trim()) {
    return { success: false, error: "Érvénytelen foglalási azonosító." };
  }
  try {
    await deleteBookingWithoutNotification(id);
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/photo-orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[deleteBookingAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "A foglalás törlése nem sikerült." };
  }
}

export async function bulkDeleteBookingsAction(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = bulkDeleteBookingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Érvénytelen foglaláskijelölés." };
  }

  try {
    const deletedCount = await deleteBookingsWithoutNotification(parsed.data.bookingIds);
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/event-photos");
    revalidatePath("/admin/photo-orders");
    revalidatePath("/admin");
    return { success: true, deletedCount };
  } catch (error) {
    console.error("[bulkDeleteBookingsAction] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "A kijelölt foglalások törlése nem sikerült." };
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
