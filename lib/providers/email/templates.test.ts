import { describe, expect, it } from "vitest";
import { buildBookingCreatedEmail } from "./templates";
import type { ApprovalMode, BookingEmailInput } from "./types";

const baseInput = {
  bookingNumber: "ZS-2026-0001",
  pin: "AB12345",
  serviceName: "Családi fotózás",
  customerName: "Teszt Elek",
  customerEmail: "teszt@example.com",
  customerPhone: "+36123456789",
  startAt: new Date("2026-09-23T08:00:00Z"),
  endAt: new Date("2026-09-23T09:00:00Z"),
  adminNotificationEmail: "admin@example.com",
};

describe("buildBookingCreatedEmail", () => {
  it.each<ApprovalMode>(["AUTO", "MANUAL"])("includes the PIN in %s mode", (approvalMode) => {
    const input = { ...baseInput, approvalMode } satisfies BookingEmailInput;

    expect(buildBookingCreatedEmail(input).text).toContain("PIN: AB12345");
  });
});