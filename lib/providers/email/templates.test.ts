import { describe, expect, it } from "vitest";
import { buildBookingCreatedEmail, buildPhotoOrderConfirmationEmail } from "./templates";
import type { ApprovalMode, BookingEmailInput, PhotoOrderEmailInput } from "./types";

const baseInput = {
  bookingNumber: "ZS-2026-0001",
  pin: "AB12345",
  serviceName: "Intézményi fotózás",
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

  it("omits the PIN for family bookings", () => {
    const input = {
      ...baseInput,
      pin: null,
      serviceName: "Családi fotózás",
      approvalMode: "AUTO" as const,
    } satisfies BookingEmailInput;

    expect(buildBookingCreatedEmail(input).text).not.toContain("PIN:");
  });

  it.each([
    [true, "Online képmegjelenés: Hozzájárult"],
    [false, "Online képmegjelenés: Nem járult hozzá"],
  ])("includes the publication consent when it is %s", (photoPublicationConsent, expected) => {
    const input = {
      ...baseInput,
      approvalMode: "MANUAL" as const,
      photoPublicationConsent,
    } satisfies BookingEmailInput;

    expect(buildBookingCreatedEmail(input).text).toContain(expected);
  });
});

describe("buildPhotoOrderConfirmationEmail", () => {
  it("includes the order identifiers and every line item", () => {
    const input = {
      orderNumber: "ZR-2026-12345",
      bookingNumber: "ZS-2026-0001",
      customerName: "Teszt Elek",
      customerEmail: "teszt@example.com",
      serviceName: "Intézményi fotózás",
      adminNotificationEmail: "admin@example.com",
      notes: "Egy csomagba kérem.",
      isUpdate: false,
      items: [
        { photoTitle: "Családi séta", size: "10x15 cm", quantity: 2 },
        { photoTitle: "Közös játék", size: "20x30 cm", quantity: 1 },
      ],
    } satisfies PhotoOrderEmailInput;

    const email = buildPhotoOrderConfirmationEmail(input);
    expect(email.text).toContain("ZR-2026-12345");
    expect(email.text).toContain("Családi séta · 10x15 cm · 2 db");
    expect(email.text).toContain("Közös játék · 20x30 cm · 1 db");
    expect(email.text).toContain("Megjegyzés: Egy csomagba kérem.");
  });

  it("labels an updated order", () => {
    const email = buildPhotoOrderConfirmationEmail({
      orderNumber: "ZR-2026-12345",
      bookingNumber: "ZS-2026-0001",
      customerName: "Teszt Elek",
      customerEmail: "teszt@example.com",
      serviceName: "Intézményi fotózás",
      adminNotificationEmail: "admin@example.com",
      isUpdate: true,
      items: [{ photoTitle: "Családi séta", size: "10x15 cm", quantity: 3 }],
    });

    expect(email.subject).toContain("módosítva");
  });
});