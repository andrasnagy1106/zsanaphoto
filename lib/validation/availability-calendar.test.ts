import { describe, expect, it } from "vitest";
import { availabilityCalendarSlotSchema } from "./availability-calendar";

describe("availabilityCalendarSlotSchema", () => {
  it("accepts an exact date and time interval", () => {
    expect(availabilityCalendarSlotSchema.safeParse({
      calendarId: "calendar-1",
      date: "2026-10-17",
      startTime: "14:00",
      endTime: "14:30",
    }).success).toBe(true);
  });

  it("rejects invalid dates and intervals that end before they start", () => {
    expect(availabilityCalendarSlotSchema.safeParse({
      calendarId: "calendar-1",
      date: "2026-02-30",
      startTime: "14:00",
      endTime: "14:30",
    }).success).toBe(false);
    expect(availabilityCalendarSlotSchema.safeParse({
      calendarId: "calendar-1",
      date: "2026-10-17",
      startTime: "18:30",
      endTime: "14:30",
    }).success).toBe(false);
  });
});