import { describe, expect, it } from "vitest";
import { createAdminEventUserSchema, createBookingInputSchema, updateCustomerEmailSchema } from "./booking";

const validBookingInput = {
  serviceId: "service-id",
  startAt: "2026-09-23T08:00:00.000Z",
  name: "Teszt Elek",
  email: "teszt@example.com",
  phone: "+36123456789",
};

const validEmailUpdate = {
  bookingId: "00000000-0000-4000-8000-000000000001",
  currentEmail: "old@example.com",
  email: "new@example.com",
  confirmEmail: "new@example.com",
};

describe("updateCustomerEmailSchema", () => {
  it("normalizes both new addresses and the current address", () => {
    expect(updateCustomerEmailSchema.parse({
      ...validEmailUpdate,
      currentEmail: " OLD@Example.com ",
      email: " NEW@Example.com ",
      confirmEmail: "new@example.com",
    })).toEqual(validEmailUpdate);
  });

  it("reports mismatching addresses on the confirmation field", () => {
    const result = updateCustomerEmailSchema.safeParse({
      ...validEmailUpdate, confirmEmail: "other@example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ["confirmEmail"], message: "A két e-mail cím nem egyezik.",
      }));
    }
  });

  it.each(["bookingId", "currentEmail", "email", "confirmEmail"])("rejects invalid %s", (field) => {
    expect(updateCustomerEmailSchema.safeParse({ ...validEmailUpdate, [field]: "invalid" }).success).toBe(false);
    expect(updateCustomerEmailSchema.safeParse({ ...validEmailUpdate, [field]: "" }).success).toBe(false);
  });

  it("rejects an unchanged address ignoring casing and whitespace", () => {
    expect(updateCustomerEmailSchema.safeParse({
      ...validEmailUpdate, email: " OLD@example.com ", confirmEmail: "old@example.com",
    }).success).toBe(false);
  });

  it("rejects addresses longer than 200 characters", () => {
    const email = `${"a".repeat(190)}@example.com`;
    expect(updateCustomerEmailSchema.safeParse({ ...validEmailUpdate, email, confirmEmail: email }).success).toBe(false);
  });
});

describe("createBookingInputSchema", () => {
  it("defaults missing photo publication consent to false", () => {
    expect(createBookingInputSchema.parse(validBookingInput).photoPublicationConsent).toBe(false);
  });

  it("preserves explicit photo publication consent", () => {
    expect(
      createBookingInputSchema.parse({
        ...validBookingInput,
        photoPublicationConsent: true,
      }).photoPublicationConsent,
    ).toBe(true);
  });
});

describe("createAdminEventUserSchema", () => {
  it("accepts valid admin event user input with PIN", () => {
    const parsed = createAdminEventUserSchema.parse({
      serviceId: "service-123",
      customerName: "Szülő Anna",
      customerEmail: "anna@example.com",
      pin: "ab12345",
    });
    expect(parsed.pin).toBe("AB12345");
    expect(parsed.status).toBe("COMPLETED");
  });

  it("accepts empty PIN for automatic generation", () => {
    const parsed = createAdminEventUserSchema.parse({
      serviceId: "service-123",
      customerName: "Szülő Anna",
      customerEmail: "anna@example.com",
      pin: "",
    });
    expect(parsed.pin).toBe("");
  });

  it("rejects invalid PIN format", () => {
    expect(
      createAdminEventUserSchema.safeParse({
        serviceId: "service-123",
        customerName: "Szülő Anna",
        customerEmail: "anna@example.com",
        pin: "invalid-pin",
      }).success,
    ).toBe(false);
  });
});