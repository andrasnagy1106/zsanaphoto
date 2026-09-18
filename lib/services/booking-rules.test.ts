import { describe, expect, it } from "vitest";
import {
  canCancelBooking,
  canConfirmBooking,
  determineInitialBookingStatus,
} from "./booking-rules";

describe("determineInitialBookingStatus", () => {
  it("returns CONFIRMED for AUTO approval mode", () => {
    expect(determineInitialBookingStatus("AUTO")).toBe("CONFIRMED");
  });

  it("returns PENDING for MANUAL approval mode", () => {
    expect(determineInitialBookingStatus("MANUAL")).toBe("PENDING");
  });
});

describe("canConfirmBooking", () => {
  it("allows confirming only PENDING bookings", () => {
    expect(canConfirmBooking("PENDING")).toBe(true);
    expect(canConfirmBooking("CONFIRMED")).toBe(false);
    expect(canConfirmBooking("CANCELLED")).toBe(false);
    expect(canConfirmBooking("COMPLETED")).toBe(false);
    expect(canConfirmBooking("NO_SHOW")).toBe(false);
  });
});

describe("canCancelBooking", () => {
  it("allows cancelling PENDING and CONFIRMED bookings", () => {
    expect(canCancelBooking("PENDING")).toBe(true);
    expect(canCancelBooking("CONFIRMED")).toBe(true);
  });

  it("disallows cancelling already-terminal bookings", () => {
    expect(canCancelBooking("CANCELLED")).toBe(false);
    expect(canCancelBooking("COMPLETED")).toBe(false);
    expect(canCancelBooking("NO_SHOW")).toBe(false);
  });
});
