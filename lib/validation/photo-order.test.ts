import { describe, expect, it } from "vitest";
import { savePhotoOrderSchema, verifyPhotoOrderPinSchema } from "./photo-order";

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

  it("accepts valid photo order lines", () => {
    expect(savePhotoOrderSchema.safeParse({
      accessToken,
      items: [{ photoId: "family-meadow", size: "10x15 cm", quantity: 2 }],
    }).success).toBe(true);
  });

  it("rejects duplicate photo and size lines", () => {
    const item = { photoId: "family-meadow", size: "10x15 cm", quantity: 1 };
    expect(savePhotoOrderSchema.safeParse({ accessToken, items: [item, item] }).success).toBe(false);
  });
});