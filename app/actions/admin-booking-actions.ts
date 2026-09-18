"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { cancelBooking, completeBooking, confirmBooking } from "@/lib/services/booking-service";

export interface AdminActionResult {
  success: boolean;
  error?: string;
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
