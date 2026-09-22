import { describe, expect, it } from "vitest";
import {
  DEFAULT_PHOTO_PRICES,
  PHOTO_PRINT_SIZES,
  formatPrice,
  resolvePhotoPrices,
} from "./photo-order-catalog";

describe("photo-order-catalog", () => {
  it("has correct sizes configured", () => {
    expect(PHOTO_PRINT_SIZES).toEqual([
      "10x15 cm",
      "13x18 cm",
      "15x21 cm",
      "A4 21x30 cm",
    ]);
  });

  it("has specified default prices", () => {
    expect(DEFAULT_PHOTO_PRICES["10x15 cm"]).toBe(600);
    expect(DEFAULT_PHOTO_PRICES["13x18 cm"]).toBe(750);
    expect(DEFAULT_PHOTO_PRICES["15x21 cm"]).toBe(1200);
    expect(DEFAULT_PHOTO_PRICES["A4 21x30 cm"]).toBe(1900);
  });

  it("formats price with Hungarian locale and currency", () => {
    expect(formatPrice(600)).toContain("600 Ft");
    expect(formatPrice(1200)).toContain("Ft");
  });

  it("resolves default prices when custom prices are not provided", () => {
    const resolved = resolvePhotoPrices(null);
    expect(resolved).toEqual(DEFAULT_PHOTO_PRICES);
  });

  it("supports fallback prices from site settings", () => {
    const resolved = resolvePhotoPrices(null, {
      "10x15 cm": 650,
      "13x18 cm": 800,
    });
    expect(resolved["10x15 cm"]).toBe(650);
    expect(resolved["13x18 cm"]).toBe(800);
    expect(resolved["15x21 cm"]).toBe(1200); // hardcoded default fallback
    expect(resolved["A4 21x30 cm"]).toBe(1900);
  });

  it("overrides specific sizes when custom prices are provided", () => {
    const resolved = resolvePhotoPrices({
      "10x15 cm": 800,
      "A4 21x30 cm": 2500,
    });
    expect(resolved["10x15 cm"]).toBe(800);
    expect(resolved["13x18 cm"]).toBe(750); // fallback to default
    expect(resolved["15x21 cm"]).toBe(1200); // fallback to default
    expect(resolved["A4 21x30 cm"]).toBe(2500);
  });
});
