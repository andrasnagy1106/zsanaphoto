import type { Booking } from "@/db/schema";

/** Pure business rule: AUTO approval confirms immediately, MANUAL requires admin approval. */
export function determineInitialBookingStatus(
  approvalMode: "AUTO" | "MANUAL",
): Booking["status"] {
  return approvalMode === "AUTO" ? "CONFIRMED" : "PENDING";
}

/** Only a PENDING booking can be confirmed by an admin. */
export function canConfirmBooking(status: Booking["status"]): boolean {
  return status === "PENDING";
}

/** PENDING and CONFIRMED bookings can be cancelled; CANCELLED/COMPLETED/NO_SHOW cannot. */
export function canCancelBooking(status: Booking["status"]): boolean {
  return status === "PENDING" || status === "CONFIRMED";
}
