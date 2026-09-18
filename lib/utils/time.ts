import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";
import { hu } from "date-fns/locale";

export const BUSINESS_TIMEZONE = "Europe/Budapest";

/** Combines a "yyyy-MM-dd" date and "HH:mm" time, interpreted in the given timezone, into a UTC instant. */
export function zonedDateTimeToUtc(
  dateIso: string,
  time: string,
  timeZone: string = BUSINESS_TIMEZONE,
): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const wallClock = `${dateIso}T${String(hours).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")}:00`;
  return fromZonedTime(wallClock, timeZone);
}

/** Returns the day of week (0=Sunday..6=Saturday) for a UTC instant, evaluated in the given timezone. */
export function getZonedDayOfWeek(
  date: Date,
  timeZone: string = BUSINESS_TIMEZONE,
): number {
  return toZonedTime(date, timeZone).getDay();
}

/** Returns the "yyyy-MM-dd" calendar date for a UTC instant, evaluated in the given timezone. */
export function getZonedDateIso(
  date: Date,
  timeZone: string = BUSINESS_TIMEZONE,
): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

/** Returns the calendar year for a UTC instant, evaluated in the given timezone. */
export function getZonedYear(
  date: Date,
  timeZone: string = BUSINESS_TIMEZONE,
): number {
  return Number(formatInTimeZone(date, timeZone, "yyyy"));
}

/** Formats a UTC instant as "HH:mm" in the given timezone. */
export function formatZonedTime(
  date: Date,
  timeZone: string = BUSINESS_TIMEZONE,
): string {
  return formatInTimeZone(date, timeZone, "HH:mm");
}

/** Formats a UTC instant as a human-readable Hungarian date, e.g. "2026. október 12." */
export function formatZonedHungarianDate(
  date: Date,
  timeZone: string = BUSINESS_TIMEZONE,
): string {
  return formatInTimeZone(date, timeZone, "yyyy. MMMM d.", { locale: hu });
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function startOfUtcDay(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00.000Z`);
}
