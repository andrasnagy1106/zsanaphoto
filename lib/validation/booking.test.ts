import { describe, expect, it } from "vitest";
import { createBookingInputSchema } from "./booking";

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