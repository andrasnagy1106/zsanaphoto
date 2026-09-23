import { describe, expect, it } from "vitest";
import type { Service, SiteSettings } from "@/db/schema";
import {
  computeSlotsForDate,
  overlaps,
  type AvailabilityContext,
} from "./availability-service";

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: "service-1",
    name: "Családi fotózás",
    slug: "csaladi-fotozas",
    description: "",
    durationMinutes: 60,
    bufferMinutes: 15,
    approvalMode: "AUTO",
    availabilityMode: "GLOBAL",
    dateRangeStart: null,
    dateRangeEnd: null,
    requiresChildName: false,
    active: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSettings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    id: "default",
    timezone: "Europe/Budapest",
    adminNotificationEmail: "admin@zsanaphoto.dev",
    siteContactEmail: "admin@zsanaphoto.dev",
    minimumLeadTimeHours: 2,
    maxAdvanceDays: 90,
    defaultPhotoPrices: null,
    aboutPhotoPublicId: null,
    aboutPhotoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// 2026-10-12 is a Monday.
const MONDAY = "2026-10-12";

function makeContext(overrides: Partial<AvailabilityContext> = {}): AvailabilityContext {
  return {
    service: makeService(),
    settings: makeSettings(),
    rules: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
    blockedPeriods: [],
    activeBookings: [],
    now: new Date("2026-10-01T00:00:00Z"),
    ...overrides,
  };
}

describe("overlaps", () => {
  it("detects overlapping intervals", () => {
    const a = new Date("2026-01-01T10:00:00Z");
    const b = new Date("2026-01-01T11:00:00Z");
    const c = new Date("2026-01-01T10:30:00Z");
    const d = new Date("2026-01-01T11:30:00Z");
    expect(overlaps(a, b, c, d)).toBe(true);
  });

  it("does not flag adjacent, non-overlapping intervals", () => {
    const a = new Date("2026-01-01T10:00:00Z");
    const b = new Date("2026-01-01T11:00:00Z");
    const c = new Date("2026-01-01T11:00:00Z");
    const d = new Date("2026-01-01T12:00:00Z");
    expect(overlaps(a, b, c, d)).toBe(false);
  });
});

describe("computeSlotsForDate - slot generation", () => {
  it("generates slots stepping by duration + buffer within the rule window", () => {
    const ctx = makeContext();
    const slots = computeSlotsForDate(MONDAY, ctx);

    // 09:00-17:00 window, 60 min duration + 15 min buffer => 75 min steps.
    // Slots: 09:00, 10:15, 11:30, 12:45, 14:00, 15:15 (16:30 would end at 17:30, excluded)
    expect(slots).toHaveLength(6);
    expect(slots[0].start.toISOString()).toBe(
      new Date("2026-10-12T07:00:00.000Z").toISOString(), // 09:00 CEST = 07:00 UTC
    );
  });

  it("returns no slots for a day without a matching availability rule", () => {
    const ctx = makeContext(); // rule only for Monday (1)
    const tuesday = "2026-10-13";
    expect(computeSlotsForDate(tuesday, ctx)).toHaveLength(0);
  });
});

describe("computeSlotsForDate - lead time", () => {
  it("excludes slots that start before the minimum lead time", () => {
    const ctx = makeContext({
      // "now" is Monday 09:30 Budapest time (07:30 UTC), lead time 2h => cutoff 11:30 Budapest
      now: new Date("2026-10-12T07:30:00Z"),
    });
    const slots = computeSlotsForDate(MONDAY, ctx);
    for (const slot of slots) {
      expect(slot.start.getTime()).toBeGreaterThanOrEqual(
        new Date("2026-10-12T09:30:00Z").getTime(),
      );
    }
    // 09:00 and 10:15 slots should be excluded (before 11:30 Budapest cutoff)
    expect(slots.find((s) => s.start.toISOString() === "2026-10-12T07:00:00.000Z")).toBeUndefined();
  });
});

describe("computeSlotsForDate - max advance window", () => {
  it("excludes dates beyond the max advance window", () => {
    const ctx = makeContext({
      now: new Date("2026-10-12T00:00:00Z"),
      settings: makeSettings({ maxAdvanceDays: 1 }),
    });
    // Requesting slots ~90 days later should be empty because "now" + 1 day horizon has passed.
    const farDate = "2027-01-12";
    expect(computeSlotsForDate(farDate, ctx)).toHaveLength(0);
  });
});

describe("computeSlotsForDate - blocked periods", () => {
  it("excludes slots overlapping a blocked period", () => {
    const ctx = makeContext({
      blockedPeriods: [
        {
          startAt: new Date("2026-10-12T07:00:00Z"),
          endAt: new Date("2026-10-12T09:00:00Z"),
        },
      ],
    });
    const slots = computeSlotsForDate(MONDAY, ctx);
    expect(slots.find((s) => s.start.toISOString() === "2026-10-12T07:00:00.000Z")).toBeUndefined();
  });
});

describe("computeSlotsForDate - existing bookings", () => {
  it("excludes slots overlapping an active booking", () => {
    const ctx = makeContext({
      activeBookings: [
        {
          startAt: new Date("2026-10-12T07:00:00Z"),
          endAt: new Date("2026-10-12T08:00:00Z"),
        },
      ],
    });
    const slots = computeSlotsForDate(MONDAY, ctx);
    expect(slots.find((s) => s.start.toISOString() === "2026-10-12T07:00:00.000Z")).toBeUndefined();
  });
});

describe("computeSlotsForDate - dateRange constraints", () => {
  it("returns no slots if date is before dateRangeStart", () => {
    const ctx = makeContext({
      service: makeService({ dateRangeStart: "2026-10-15" }),
    });
    expect(computeSlotsForDate("2026-10-12", ctx)).toHaveLength(0);
  });

  it("returns no slots if date is after dateRangeEnd", () => {
    const ctx = makeContext({
      service: makeService({ dateRangeEnd: "2026-10-10" }),
    });
    expect(computeSlotsForDate("2026-10-12", ctx)).toHaveLength(0);
  });

  it("returns slots if date is within dateRangeStart and dateRangeEnd", () => {
    const ctx = makeContext({
      service: makeService({ dateRangeStart: "2026-10-01", dateRangeEnd: "2026-10-31" }),
    });
    expect(computeSlotsForDate("2026-10-12", ctx).length).toBeGreaterThan(0);
  });
});
