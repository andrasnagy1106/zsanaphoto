import { and, asc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db/client";
import {
  availabilityCalendarSlots,
  availabilityCalendars,
  type AvailabilityCalendar,
  type AvailabilityCalendarSlot,
} from "@/db/schema";
import { NotFoundError } from "@/lib/utils/errors";
import { availabilityCalendarSlotBatchSchema, type AvailabilityCalendarSlotBatchInput } from "@/lib/validation/availability-calendar";

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

export function buildAvailabilityCalendarSlots(input: AvailabilityCalendarSlotBatchInput) {
  const parsed = availabilityCalendarSlotBatchSchema.parse(input);
  const [startHours, startMinutes] = parsed.startTime.split(":").map(Number);
  const [endHours, endMinutes] = parsed.endTime.split(":").map(Number);
  const rangeEnd = endHours * 60 + endMinutes;
  const slots: Pick<AvailabilityCalendarSlot, "calendarId" | "date" | "startTime" | "endTime">[] = [];

  for (let cursor = startHours * 60 + startMinutes; cursor + parsed.durationMinutes <= rangeEnd; cursor += parsed.durationMinutes) {
    const slotEnd = cursor + parsed.durationMinutes;
    slots.push({
      calendarId: parsed.calendarId,
      date: parsed.date,
      startTime: `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`,
      endTime: `${String(Math.floor(slotEnd / 60)).padStart(2, "0")}:${String(slotEnd % 60).padStart(2, "0")}`,
    });
  }
  return slots;
}

export async function createAvailabilityCalendarSlots(input: AvailabilityCalendarSlotBatchInput): Promise<number> {
  const slots = buildAvailabilityCalendarSlots(input);
  return db.transaction(async (tx) => {
    const [calendar] = await tx.select({ id: availabilityCalendars.id }).from(availabilityCalendars)
      .where(eq(availabilityCalendars.id, input.calendarId)).for("update");
    if (!calendar) throw new NotFoundError("A naptár nem található.");

    const overlapping = await tx.select({ id: availabilityCalendarSlots.id }).from(availabilityCalendarSlots)
      .where(and(
        eq(availabilityCalendarSlots.calendarId, input.calendarId),
        eq(availabilityCalendarSlots.date, input.date),
        lt(availabilityCalendarSlots.startTime, input.endTime),
        gt(availabilityCalendarSlots.endTime, input.startTime),
      )).limit(1);
    if (overlapping.length > 0) {
      throw new Error("Ebben az időszakban már van rögzített idősáv. Előbb töröld az átfedő idősávot, vagy válassz másik időszakot.");
    }

    const created = await tx.insert(availabilityCalendarSlots).values(slots).returning({ id: availabilityCalendarSlots.id });
    return created.length;
  });
}

export async function deleteAvailabilityCalendarSlot(slotId: string): Promise<boolean> {
  const deleted = await db
    .delete(availabilityCalendarSlots)
    .where(eq(availabilityCalendarSlots.id, slotId))
    .returning({ id: availabilityCalendarSlots.id });
  return deleted.length > 0;
}