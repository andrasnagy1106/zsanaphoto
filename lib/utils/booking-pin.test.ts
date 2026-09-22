import { describe, expect, it } from "vitest";
import { generateBookingPin } from "./booking-pin";

describe("generateBookingPin", () => {
  it("generates two uppercase letters followed by five digits", () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      expect(generateBookingPin()).toMatch(/^[A-Z]{2}\d{5}$/);
    }
  });
});