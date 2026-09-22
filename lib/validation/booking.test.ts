import { describe, expect, it } from "vitest";
import { createAdminEventUserSchema, createBookingInputSchema } from "./booking";

const validBookingInput = {
  serviceId: "service-id",
  startAt: "2026-09-23T08:00:00.000Z",
  name: "Teszt Elek",
  email: "teszt@example.com",
  phone: "+36123456789",
};

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