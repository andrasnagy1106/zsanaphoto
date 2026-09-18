import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  availabilityRules,
  blockedPeriods,
  bookings,
  services,
  type Service,
  type SiteSettings,
} from "@/db/schema";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import {
  addMinutes,
  getZonedDateIso,
  getZonedDayOfWeek,
  zonedDateTimeToUtc,
} from "@/lib/utils/time";
import { getSettings } from "./settings-service";

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface AvailabilityContext {
  service: Service;
  settings: SiteSettings;
  rules: { dayOfWeek: number; startTime: string; endTime: string }[];
  blockedPeriods: { startAt: Date; endAt: Date }[];
  activeBookings: { startAt: Date; endAt: Date }[];
  now: Date;
}

async function loadAvailabilityContext(
  serviceId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<AvailabilityContext | null> {
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service || !service.active) return null;

  const settings = await getSettings();

  const rules = await db
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.active, true));

  const blocked = await db
    .select()
    .from(blockedPeriods)
    .where(
      and(
        lte(blockedPeriods.startAt, rangeEnd),
        gte(blockedPeriods.endAt, rangeStart),
      ),
    );

  const activeBookings = await db
    .select({ startAt: bookings.startAt, endAt: bookings.endAt })
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
        lte(bookings.startAt, rangeEnd),
        gte(bookings.endAt, rangeStart),
      ),
    );

  return {
    service,
    settings,
    rules,
    blockedPeriods: blocked,
    activeBookings,
    now: new Date(),
  };
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function computeSlotsForDate(dateIso: string, ctx: AvailabilityContext): TimeSlot[] {
  const { service, settings, rules, blockedPeriods, activeBookings, now } = ctx;
  const dayOfWeek = getZonedDayOfWeek(
    zonedDateTimeToUtc(dateIso, "12:00", settings.timezone),
    settings.timezone,
  );

  const dayRules = rules.filter((rule) => rule.dayOfWeek === dayOfWeek);
  if (dayRules.length === 0) return [];

  const stepMinutes = service.durationMinutes + service.bufferMinutes;
  const leadTimeCutoff = addMinutes(now, settings.minimumLeadTimeHours * 60);
  const horizonCutoff = addMinutes(now, settings.maxAdvanceDays * 24 * 60);

  const slots: TimeSlot[] = [];

  for (const rule of dayRules) {
    let cursor = zonedDateTimeToUtc(dateIso, rule.startTime, settings.timezone);
    const ruleEnd = zonedDateTimeToUtc(dateIso, rule.endTime, settings.timezone);

    while (true) {
      const slotEnd = addMinutes(cursor, service.durationMinutes);
      if (slotEnd > ruleEnd) break;

      const slotStart = cursor;
      cursor = addMinutes(cursor, stepMinutes);

      if (slotStart < leadTimeCutoff) continue;
      if (slotStart > horizonCutoff) continue;

      const blockedByPeriod = blockedPeriods.some((period) =>
        overlaps(slotStart, slotEnd, period.startAt, period.endAt),
      );
      if (blockedByPeriod) continue;

      const blockedByBooking = activeBookings.some((booking) =>
        overlaps(slotStart, slotEnd, booking.startAt, booking.endAt),
      );
      if (blockedByBooking) continue;

      slots.push({ start: slotStart, end: slotEnd });
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function getAvailableSlotsForDate(
  serviceId: string,
  dateIso: string,
): Promise<TimeSlot[]> {
  const dayStart = zonedDateTimeToUtc(dateIso, "00:00");
  const dayEnd = addMinutes(dayStart, 24 * 60);
  // Widen the query window to tolerate DST shifts and cross-midnight slots.
  const rangeStart = addMinutes(dayStart, -6 * 60);
  const rangeEnd = addMinutes(dayEnd, 6 * 60);

  const ctx = await loadAvailabilityContext(serviceId, rangeStart, rangeEnd);
  if (!ctx) return [];

  return computeSlotsForDate(dateIso, ctx);
}

export async function getAvailableDatesInRange(
  serviceId: string,
  fromIso: string,
  toIso: string,
): Promise<string[]> {
  const rangeStart = addMinutes(zonedDateTimeToUtc(fromIso, "00:00"), -6 * 60);
  const rangeEnd = addMinutes(zonedDateTimeToUtc(toIso, "00:00"), 30 * 60);

  const ctx = await loadAvailabilityContext(serviceId, rangeStart, rangeEnd);
  if (!ctx) return [];

  const availableDates: string[] = [];
  let cursor = zonedDateTimeToUtc(fromIso, "12:00", ctx.settings.timezone);
  const end = zonedDateTimeToUtc(toIso, "12:00", ctx.settings.timezone);

  while (cursor <= end) {
    const dateIso = getZonedDateIso(cursor, ctx.settings.timezone);
    if (computeSlotsForDate(dateIso, ctx).length > 0) {
      availableDates.push(dateIso);
    }
    cursor = addMinutes(cursor, 24 * 60);
  }

  return availableDates;
}

export async function isSlotAvailable(
  serviceId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  const dateIso = getZonedDateIso(start);
  const slots = await getAvailableSlotsForDate(serviceId, dateIso);
  return slots.some(
    (slot) => slot.start.getTime() === start.getTime() && slot.end.getTime() === end.getTime(),
  );
}

export { getSettings as getSiteSettings } from "./settings-service";
