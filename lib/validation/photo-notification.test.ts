import { describe, expect, it } from "vitest";
import { savePhotoOrderDeadlineSchema } from "./photo-notification";

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
});
