import { describe, expect, it } from "vitest";
import {
  addMinutes,
  getZonedDateIso,
  getZonedDayOfWeek,
  getZonedYear,
  zonedDateTimeToUtc,
} from "./time";

describe("zonedDateTimeToUtc", () => {
  it("converts a CEST (summer) wall-clock time to the correct UTC instant", () => {
    // Budapest is UTC+2 in October (still CEST before the DST switch in late Oct 2026).
    const utc = zonedDateTimeToUtc("2026-10-12", "09:00");
    expect(utc.toISOString()).toBe("2026-10-12T07:00:00.000Z");
  });

  it("converts a CET (winter) wall-clock time to the correct UTC instant", () => {
    const utc = zonedDateTimeToUtc("2026-12-01", "09:00");
    expect(utc.toISOString()).toBe("2026-12-01T08:00:00.000Z");
  });
});

describe("getZonedDayOfWeek", () => {
  it("returns the day of week according to the business timezone", () => {
    const monday = zonedDateTimeToUtc("2026-10-12", "09:00");
    expect(getZonedDayOfWeek(monday)).toBe(1);
  });
});

describe("getZonedDateIso / getZonedYear", () => {
  it("round-trips a zoned date", () => {
    const date = zonedDateTimeToUtc("2026-10-12", "23:30");
    expect(getZonedDateIso(date)).toBe("2026-10-12");
    expect(getZonedYear(date)).toBe(2026);
  });
});

describe("addMinutes", () => {
  it("adds minutes to a date", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    expect(addMinutes(start, 90).toISOString()).toBe("2026-01-01T01:30:00.000Z");
  });
});
