import { describe, expect, it } from "vitest";
import { savePhotoOrderDeadlineSchema } from "./photo-notification";
import { createServiceSchema } from "./service";

describe("savePhotoOrderDeadlineSchema", () => {
  it("accepts a valid date and permits clearing the deadline", () => {
    expect(savePhotoOrderDeadlineSchema.safeParse({
      bookingId: "e10d9f6b-ec24-4526-ae5e-2fb6aadd6b81",
      orderDeadline: "2026-11-03",
    }).success).toBe(true);
    expect(savePhotoOrderDeadlineSchema.safeParse({
      bookingId: "e10d9f6b-ec24-4526-ae5e-2fb6aadd6b81",
      orderDeadline: "",
    }).success).toBe(true);
  });

  it("rejects invalid calendar dates", () => {
    expect(savePhotoOrderDeadlineSchema.safeParse({
      bookingId: "e10d9f6b-ec24-4526-ae5e-2fb6aadd6b81",
      orderDeadline: "2026-02-30",
    }).success).toBe(false);
  });

  it.each(["", "2026-11-20"])("accepts an optional payment deadline (%s)", (paymentDeadline) => {
    const result = savePhotoOrderDeadlineSchema.parse({
      bookingId: "e10d9f6b-ec24-4526-ae5e-2fb6aadd6b81",
      orderDeadline: "2026-11-10",
      paymentDeadline,
      paymentInformation: "  Az óvoda szedi be.\nKöszönjük!  ",
    });
    expect(result.paymentDeadline).toBe(paymentDeadline);
    expect(result.paymentInformation).toBe("Az óvoda szedi be.\nKöszönjük!");
  });

  it.each(["2026-02-30", "2026-13-01", "holnap"])("rejects invalid payment dates (%s)", (paymentDeadline) => {
    expect(savePhotoOrderDeadlineSchema.safeParse({
      bookingId: "e10d9f6b-ec24-4526-ae5e-2fb6aadd6b81",
      orderDeadline: "",
      paymentDeadline,
    }).success).toBe(false);
  });

  it.each([null, ""])("supports inheriting or hiding payment text (%s)", (paymentInformation) => {
    expect(savePhotoOrderDeadlineSchema.parse({
      bookingId: "e10d9f6b-ec24-4526-ae5e-2fb6aadd6b81",
      orderDeadline: "",
      paymentInformation,
    }).paymentInformation).toBe(paymentInformation);
  });

  it.each([5000, 5001])("enforces the exact text limit in both forms (%s)", (length) => {
    const paymentInformation = "a".repeat(length);
    expect(savePhotoOrderDeadlineSchema.safeParse({
      bookingId: "e10d9f6b-ec24-4526-ae5e-2fb6aadd6b81",
      orderDeadline: "",
      paymentInformation,
    }).success).toBe(length === 5000);
    expect(createServiceSchema.safeParse({ name: "Teszt", paymentInformation }).success).toBe(length === 5000);
  });
});
