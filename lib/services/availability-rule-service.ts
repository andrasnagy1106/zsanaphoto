import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { availabilityRules, type AvailabilityRule } from "@/db/schema";

export async function listAvailabilityRules(): Promise<AvailabilityRule[]> {
  return db.select().from(availabilityRules).orderBy(asc(availabilityRules.dayOfWeek));
}

export interface UpsertAvailabilityRuleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export async function upsertAvailabilityRuleForDay(
  input: UpsertAvailabilityRuleInput,
): Promise<AvailabilityRule> {
  const [existing] = await db
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.dayOfWeek, input.dayOfWeek))
    .limit(1);

  if (!existing) {
    const [created] = await db.insert(availabilityRules).values(input).returning();
    return created;
  }

  const [updated] = await db
    .update(availabilityRules)
    .set({
      startTime: input.startTime,
      endTime: input.endTime,
      active: input.active,
      updatedAt: new Date(),
    })
    .where(eq(availabilityRules.id, existing.id))
    .returning();

  return updated;
}
