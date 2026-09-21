import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  availabilityRules,
  serviceAvailabilityRules,
  type AvailabilityRule,
  type ServiceAvailabilityRule,
} from "@/db/schema";

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

export async function listServiceAvailabilityRules(
  serviceId: string,
): Promise<ServiceAvailabilityRule[]> {
  return db
    .select()
    .from(serviceAvailabilityRules)
    .where(eq(serviceAvailabilityRules.serviceId, serviceId))
    .orderBy(asc(serviceAvailabilityRules.dayOfWeek));
}

export interface UpsertServiceAvailabilityRuleInput {
  serviceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export async function upsertServiceAvailabilityRuleForDay(
  input: UpsertServiceAvailabilityRuleInput,
): Promise<ServiceAvailabilityRule> {
  const [existing] = await db
    .select()
    .from(serviceAvailabilityRules)
    .where(
      and(
        eq(serviceAvailabilityRules.serviceId, input.serviceId),
        eq(serviceAvailabilityRules.dayOfWeek, input.dayOfWeek),
      ),
    )
    .limit(1);

  if (!existing) {
    const [created] = await db.insert(serviceAvailabilityRules).values(input).returning();
    return created;
  }

  const [updated] = await db
    .update(serviceAvailabilityRules)
    .set({
      startTime: input.startTime,
      endTime: input.endTime,
      active: input.active,
      updatedAt: new Date(),
    })
    .where(eq(serviceAvailabilityRules.id, existing.id))
    .returning();

  return updated;
}
