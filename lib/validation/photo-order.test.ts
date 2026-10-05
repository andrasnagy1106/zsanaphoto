import { describe, expect, it } from "vitest";
import {
  savePhotoOrderSchema,
  verifyPhotoOrderPinSchema,
} from "./photo-order";
import { photoPriceOverridesSchema } from "./photo-pricing";

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
  const validBilling = {
    billingName: "Kovács Anna",
    billingPostalCode: "6411",
    billingCity: "Zsana",
    billingAddress: "Kossuth Lajos u. 12.",
  };

  it("accepts valid photo order lines including A4 21x30 cm", () => {
    expect(
      savePhotoOrderSchema.safeParse({
        accessToken,
        ...validBilling,
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
        ...validBilling,
        includesDigital: true,
        items: [],
      }).success,
    ).toBe(true);
  });

  it("rejects an order with no items and no digital version", () => {
    expect(
      savePhotoOrderSchema.safeParse({
        accessToken,
        ...validBilling,
        includesDigital: false,
        items: [],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate photo and size lines", () => {
    const item = { photoId: "family-meadow", size: "10x15 cm", quantity: 1 };
    expect(savePhotoOrderSchema.safeParse({ accessToken, ...validBilling, items: [item, item] }).success).toBe(false);
  });

  it("rejects missing billing information", () => {
    expect(
      savePhotoOrderSchema.safeParse({
        accessToken,
        billingName: "",
        billingPostalCode: "6411",
        billingCity: "Zsana",
        billingAddress: "Fő u. 1",
        includesDigital: true,
        items: [],
      }).success,
    ).toBe(false);

    expect(
      savePhotoOrderSchema.safeParse({
        accessToken,
        billingName: "Kovács Anna",
        billingPostalCode: "",
        billingCity: "Zsana",
        billingAddress: "Fő u. 1",
        includesDigital: true,
        items: [],
      }).success,
    ).toBe(false);
  });
});

describe("photoPriceOverridesSchema", () => {
  it("keeps service-specific print and digital prices", () => {
    expect(photoPriceOverridesSchema.parse({
      "10x15 cm": "700",
      "Digitális kép": "2500",
    })).toEqual({
      "10x15 cm": 700,
      "Digitális kép": 2500,
    });
  });

  it("uses global defaults when all overrides are empty", () => {
    expect(photoPriceOverridesSchema.parse({
      "10x15 cm": "",
      "13x18 cm": "",
      "15x21 cm": "",
      "A4 21x30 cm": "",
      "Digitális kép": "",
    })).toBeNull();
  });

  it("rejects negative prices", () => {
    expect(photoPriceOverridesSchema.safeParse({ "10x15 cm": "-100" }).success).toBe(false);
  });
});