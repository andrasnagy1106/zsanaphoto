import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  availabilityCalendarSlots,
  availabilityCalendars,
  type AvailabilityCalendar,
  type AvailabilityCalendarSlot,
} from "@/db/schema";

export interface AvailabilityCalendarWithSlots {
  calendar: AvailabilityCalendar;
  slots: AvailabilityCalendarSlot[];
}

export async function listAvailabilityCalendars(): Promise<AvailabilityCalendarWithSlots[]> {
  const calendars = await db
    .select()
    .from(availabilityCalendars)
    .orderBy(asc(availabilityCalendars.name));
  const slots = await db
    .select()
    .from(availabilityCalendarSlots)
    .orderBy(asc(availabilityCalendarSlots.date), asc(availabilityCalendarSlots.startTime));

  return calendars.map((calendar) => ({
    calendar,
    slots: slots.filter((slot) => slot.calendarId === calendar.id),
  }));
}

export async function createAvailabilityCalendar(name: string): Promise<AvailabilityCalendar> {
  const [calendar] = await db
    .insert(availabilityCalendars)
    .values({ name: name.trim() })
    .returning();
  return calendar;
}

export async function deleteAvailabilityCalendar(calendarId: string): Promise<boolean> {
  const deleted = await db
    .delete(availabilityCalendars)
    .where(eq(availabilityCalendars.id, calendarId))
    .returning({ id: availabilityCalendars.id });
  return deleted.length > 0;
}

export async function createAvailabilityCalendarSlot(
  input: Pick<AvailabilityCalendarSlot, "calendarId" | "date" | "startTime" | "endTime">,
): Promise<AvailabilityCalendarSlot> {
  const [slot] = await db
    .insert(availabilityCalendarSlots)
    .values(input)
    .returning();
  return slot;
}

export async function deleteAvailabilityCalendarSlot(slotId: string): Promise<boolean> {
  const deleted = await db
    .delete(availabilityCalendarSlots)
    .where(eq(availabilityCalendarSlots.id, slotId))
    .returning({ id: availabilityCalendarSlots.id });
  return deleted.length > 0;
}