import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  availabilityCalendarSlots,
  availabilityDateOverrides,
  availabilityRules,
  blockedPeriods,
  bookings,
  serviceAvailabilityRules,
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
  calendarSlotsByDate: Map<string, { startTime: string; endTime: string }[]>;
  dateOverridesByDate: Map<string, { startTime: string; endTime: string }[]>;
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

  if (!service || !service.active || !service.onlineBookingEnabled) return null;

  const settings = await getSettings();

  const calendarSlotsByDate = new Map<string, { startTime: string; endTime: string }[]>();
  if (service.availabilityCalendarId) {
    const calendarSlots = await db
      .select({
        date: availabilityCalendarSlots.date,
        startTime: availabilityCalendarSlots.startTime,
        endTime: availabilityCalendarSlots.endTime,
      })
      .from(availabilityCalendarSlots)
      .where(
        and(
          eq(availabilityCalendarSlots.calendarId, service.availabilityCalendarId),
          eq(availabilityCalendarSlots.active, true),
          gte(availabilityCalendarSlots.date, getZonedDateIso(rangeStart, settings.timezone)),
          lte(availabilityCalendarSlots.date, getZonedDateIso(rangeEnd, settings.timezone)),
        ),
      );

    for (const slot of calendarSlots) {
      const slotsForDate = calendarSlotsByDate.get(slot.date) ?? [];
      slotsForDate.push({ startTime: slot.startTime, endTime: slot.endTime });
      calendarSlotsByDate.set(slot.date, slotsForDate);
    }
  }

  let rules: { dayOfWeek: number; startTime: string; endTime: string }[];

  if (service.availabilityMode === "CUSTOM") {
    rules = await db
      .select({
        dayOfWeek: serviceAvailabilityRules.dayOfWeek,
        startTime: serviceAvailabilityRules.startTime,
        endTime: serviceAvailabilityRules.endTime,
      })
      .from(serviceAvailabilityRules)
      .where(
        and(
          eq(serviceAvailabilityRules.serviceId, service.id),
          eq(serviceAvailabilityRules.active, true),
        ),
      );
  } else {
    rules = await db
      .select({
        dayOfWeek: availabilityRules.dayOfWeek,
        startTime: availabilityRules.startTime,
        endTime: availabilityRules.endTime,
      })
      .from(availabilityRules)
      .where(eq(availabilityRules.active, true));
  }

  const rangeStartDateIso = getZonedDateIso(rangeStart, settings.timezone);
  const rangeEndDateIso = getZonedDateIso(rangeEnd, settings.timezone);
  const dateOverrides = await db
    .select({
      date: availabilityDateOverrides.date,
      startTime: availabilityDateOverrides.startTime,
      endTime: availabilityDateOverrides.endTime,
    })
    .from(availabilityDateOverrides)
    .where(
      and(
        eq(availabilityDateOverrides.active, true),
        gte(availabilityDateOverrides.date, rangeStartDateIso),
        lte(availabilityDateOverrides.date, rangeEndDateIso),
      ),
    );

  const dateOverridesByDate = new Map<string, { startTime: string; endTime: string }[]>();
  for (const override of dateOverrides) {
    const listForDate = dateOverridesByDate.get(override.date) ?? [];
    listForDate.push({ startTime: override.startTime, endTime: override.endTime });
    dateOverridesByDate.set(override.date, listForDate);
  }

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
    calendarSlotsByDate,
    dateOverridesByDate,
    blockedPeriods: blocked,
    activeBookings,
    now: new Date(),
  };
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function computeSlotsForDate(dateIso: string, ctx: AvailabilityContext): TimeSlot[] {
  const {
    service,
    settings,
    rules,
    calendarSlotsByDate,
    dateOverridesByDate,
    blockedPeriods,
    activeBookings,
    now,
  } = ctx;

  const hasAvailabilityCalendar = Boolean(service.availabilityCalendarId);

  // A selected calendar is the authoritative list of dates for this service.
  if (!hasAvailabilityCalendar && service.dateRangeStart && dateIso < service.dateRangeStart) {
    return [];
  }
  if (!hasAvailabilityCalendar && service.dateRangeEnd && dateIso > service.dateRangeEnd) {
    return [];
  }

  const leadTimeCutoff = addMinutes(now, settings.minimumLeadTimeHours * 60);
  const horizonCutoff = addMinutes(now, settings.maxAdvanceDays * 24 * 60);
  const slots: TimeSlot[] = [];

  const calendarRules = service.availabilityCalendarId
    ? calendarSlotsByDate.get(dateIso) ?? []
    : null;

  if (calendarRules) {
    for (const rule of calendarRules) {
      const slotStart = zonedDateTimeToUtc(dateIso, rule.startTime, settings.timezone);
      const slotEnd = zonedDateTimeToUtc(dateIso, rule.endTime, settings.timezone);
      if (slotEnd <= slotStart) continue;
      if (slotStart < leadTimeCutoff) continue;
      if (blockedPeriods.some((period) => overlaps(slotStart, slotEnd, period.startAt, period.endAt))) continue;
      if (activeBookings.some((booking) => overlaps(slotStart, slotEnd, booking.startAt, booking.endAt))) continue;
      slots.push({ start: slotStart, end: slotEnd });
    }
    return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  const dayOfWeek = getZonedDayOfWeek(
    zonedDateTimeToUtc(dateIso, "12:00", settings.timezone),
    settings.timezone,
  );
  const overrideRules = dateOverridesByDate.get(dateIso) ?? [];
  const dayRules = overrideRules.length > 0
    ? overrideRules
    : rules.filter((rule) => rule.dayOfWeek === dayOfWeek);
  if (dayRules.length === 0) return [];

  const stepMinutes = service.durationMinutes + service.bufferMinutes;
  for (const rule of dayRules) {
    let cursor = zonedDateTimeToUtc(dateIso, rule.startTime, settings.timezone);
    const ruleEnd = zonedDateTimeToUtc(dateIso, rule.endTime, settings.timezone);

    while (true) {
      const slotEnd = addMinutes(cursor, service.durationMinutes);
      if (slotEnd > ruleEnd) break;

      const slotStart = cursor;
      cursor = addMinutes(cursor, stepMinutes);

      if (slotStart < leadTimeCutoff || slotStart > horizonCutoff) continue;
      if (blockedPeriods.some((period) => overlaps(slotStart, slotEnd, period.startAt, period.endAt))) continue;
      if (activeBookings.some((booking) => overlaps(slotStart, slotEnd, booking.startAt, booking.endAt))) continue;
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
