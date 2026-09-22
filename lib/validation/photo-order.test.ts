import { describe, expect, it } from "vitest";
import {
  savePhotoOrderSchema,
  updateBookingPhotoPricesSchema,
  verifyPhotoOrderPinSchema,
} from "./photo-order";

describe("verifyPhotoOrderPinSchema", () => {
  it("normalizes a valid PIN", () => {
    expect(verifyPhotoOrderPinSchema.parse({ pin: "ab12345" }).pin).toBe("AB12345");
  });

  it("rejects an invalid PIN", () => {
    expect(verifyPhotoOrderPinSchema.safeParse({ pin: "A123" }).success).toBe(false);
  });
});

describe("savePhotoOrderSchema", () => {
  const accessToken = "c6d64d12-8018-4c7c-8079-4841e2017892";

  it("accepts valid photo order lines including A4 21x30 cm", () => {
    expect(
      savePhotoOrderSchema.safeParse({
        accessToken,
        items: [
          { photoId: "family-meadow", size: "10x15 cm", quantity: 2 },
          { photoId: "children-playing", size: "A4 21x30 cm", quantity: 1 },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts an order with digital version only and empty items", () => {
    expect(
      savePhotoOrderSchema.safeParse({
        accessToken,
        includesDigital: true,
        items: [],
      }).success,
    ).toBe(true);
  });

  it("rejects an order with no items and no digital version", () => {
    expect(
      savePhotoOrderSchema.safeParse({
        accessToken,
        includesDigital: false,
        items: [],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate photo and size lines", () => {
    const item = { photoId: "family-meadow", size: "10x15 cm", quantity: 1 };
    expect(savePhotoOrderSchema.safeParse({ accessToken, items: [item, item] }).success).toBe(false);
  });
});

describe("updateBookingPhotoPricesSchema", () => {
  const bookingId = "c6d64d12-8018-4c7c-8079-4841e2017892";

  it("accepts valid custom prices", () => {
    expect(
      updateBookingPhotoPricesSchema.safeParse({
        bookingId,
        prices: {
          "10x15 cm": 700,
          "13x18 cm": 850,
          "15x21 cm": 1300,
          "A4 21x30 cm": 2000,
          "Digitális változat": 2500,
        },
      }).success,
    ).toBe(true);
  });

  it("accepts null prices to reset to default", () => {
    expect(
      updateBookingPhotoPricesSchema.safeParse({
        bookingId,
        prices: null,
      }).success,
    ).toBe(true);
  });

  it("rejects negative prices", () => {
    expect(
      updateBookingPhotoPricesSchema.safeParse({
        bookingId,
        prices: {
          "10x15 cm": -100,
        },
      }).success,
    ).toBe(false);
  });
});