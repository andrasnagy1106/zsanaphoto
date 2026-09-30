import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  availabilityDateOverrides,
  type AvailabilityDateOverride,
  type NewAvailabilityDateOverride,
} from "@/db/schema";

export interface CreateAvailabilityDateOverrideInput {
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
  active?: boolean;
}

export async function listAvailabilityDateOverrides(): Promise<AvailabilityDateOverride[]> {
  return db
    .select()
    .from(availabilityDateOverrides)
    .where(gte(availabilityDateOverrides.date, new Date().toISOString().slice(0, 10)))
    .orderBy(asc(availabilityDateOverrides.date), asc(availabilityDateOverrides.startTime));
}

export async function listAvailabilityDateOverridesInRange(
  fromIsoDate: string,
  toIsoDate: string,
): Promise<AvailabilityDateOverride[]> {
  return db
    .select()
    .from(availabilityDateOverrides)
    .where(
      and(
        eq(availabilityDateOverrides.active, true),
        gte(availabilityDateOverrides.date, fromIsoDate),
        lte(availabilityDateOverrides.date, toIsoDate),
      ),
    )
    .orderBy(asc(availabilityDateOverrides.date), asc(availabilityDateOverrides.startTime));
}

export async function createAvailabilityDateOverride(
  input: CreateAvailabilityDateOverrideInput,
): Promise<AvailabilityDateOverride> {
  const insertValues: NewAvailabilityDateOverride = {
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    note: input.note?.trim() ?? "",
    active: input.active ?? true,
  };

  const [created] = await db.insert(availabilityDateOverrides).values(insertValues).returning();
  return created;
}

export async function deleteAvailabilityDateOverride(id: string): Promise<boolean> {
  const deleted = await db
    .delete(availabilityDateOverrides)
    .where(eq(availabilityDateOverrides.id, id))
    .returning({ id: availabilityDateOverrides.id });

  return deleted.length > 0;
}
