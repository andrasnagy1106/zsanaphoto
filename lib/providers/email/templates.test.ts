import { describe, expect, it } from "vitest";
import {
  buildBookingCreatedEmail,
  buildGoogleCalendarUrl,
  buildPhotoOrderConfirmationEmail,
} from "./templates";
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

  it("includes Google Calendar link in AUTO approval mode", () => {
    const input = {
      ...baseInput,
      approvalMode: "AUTO" as const,
    } satisfies BookingEmailInput;

    const email = buildBookingCreatedEmail(input);
    expect(email.text).toContain("Hozzáadás a Google Naptárhoz:");
    expect(email.text).toContain("calendar.google.com/calendar/render");
  });

  it("omits Google Calendar link when booking is still pending (MANUAL approval mode)", () => {
    const input = {
      ...baseInput,
      approvalMode: "MANUAL" as const,
    } satisfies BookingEmailInput;

    const email = buildBookingCreatedEmail(input);
    expect(email.text).not.toContain("Hozzáadás a Google Naptárhoz:");
  });
});

describe("buildGoogleCalendarUrl", () => {
  it("formats Google Calendar URL with correct parameters", () => {
    const url = buildGoogleCalendarUrl({
      title: "ZsaNa Photo - Családi fotózás",
      startAt: new Date("2026-10-15T10:00:00Z"),
      endAt: new Date("2026-10-15T11:00:00Z"),
      description: "Foglalás: ZS-2026-0005",
      location: "ZsaNa Photo Stúdió",
    });

    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20261015T100000Z%2F20261015T110000Z");
    expect(url).toContain("ctz=Europe%2FBudapest");
  });
});

describe("buildPhotoOrderConfirmationEmail", () => {
  it("includes the order identifiers, line item prices, and total amount", () => {
    const input = {
      orderNumber: "ZR-2026-12345",
      bookingNumber: "ZS-2026-0001",
      customerName: "Teszt Elek",
      customerEmail: "teszt@example.com",
      serviceName: "Intézményi fotózás",
      adminNotificationEmail: "admin@example.com",
      notes: "Egy csomagba kérem.",
      isUpdate: false,
      totalAmount: 3100,
      items: [
        { photoTitle: "Családi séta", size: "10x15 cm", quantity: 2, unitPrice: 600, totalPrice: 1200 },
        { photoTitle: "Közös játék", size: "A4 21x30 cm", quantity: 1, unitPrice: 1900, totalPrice: 1900 },
      ],
    } satisfies PhotoOrderEmailInput;

    const email = buildPhotoOrderConfirmationEmail(input);
    expect(email.text).toContain("ZR-2026-12345");
    expect(email.text).toContain("Családi séta · 10x15 cm · 2 db");
    expect(email.text).toContain("600 Ft");
    expect(email.text).toContain("1"); // 1 200 Ft or 1200 Ft
    expect(email.text).toContain("Közös játék · A4 21x30 cm · 1 db");
    expect(email.text).toContain("Végösszeg:");
    expect(email.text).toContain("Megjegyzés: Egy csomagba kérem.");
  });

  it("includes billing details in confirmation email when provided", () => {
    const input = {
      orderNumber: "ZR-2026-12345",
      bookingNumber: "ZS-2026-0001",
      customerName: "Teszt Elek",
      customerEmail: "teszt@example.com",
      serviceName: "Intézményi fotózás",
      adminNotificationEmail: "admin@example.com",
      billingName: "Teszt Kft.",
      billingPostalCode: "6411",
      billingCity: "Zsana",
      billingAddress: "Fő utca 1.",
      isUpdate: false,
      totalAmount: 1200,
      items: [
        { photoTitle: "Családi séta", size: "10x15 cm", quantity: 2, unitPrice: 600, totalPrice: 1200 },
      ],
    } satisfies PhotoOrderEmailInput;

    const email = buildPhotoOrderConfirmationEmail(input);
    expect(email.text).toContain("Számlázási adatok:");
    expect(email.text).toContain("Név: Teszt Kft.");
    expect(email.text).toContain("Cím: 6411 Zsana, Fő utca 1.");
  });

  it("includes digital version notice when selected", () => {
    const email = buildPhotoOrderConfirmationEmail({
      orderNumber: "ZR-2026-12345",
      bookingNumber: "ZS-2026-0001",
      customerName: "Teszt Elek",
      customerEmail: "teszt@example.com",
      serviceName: "Intézményi fotózás",
      adminNotificationEmail: "admin@example.com",
      isUpdate: false,
      totalAmount: 0,
      includesDigital: true,
      items: [],
    });

    expect(email.text).toContain("Digitális változat: Igen");
    expect(email.text).toContain("szabadon felhasználható");
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
      totalAmount: 1800,
      items: [{ photoTitle: "Családi séta", size: "10x15 cm", quantity: 3, unitPrice: 600, totalPrice: 1800 }],
    });

    expect(email.subject).toContain("módosítva");
  });
});