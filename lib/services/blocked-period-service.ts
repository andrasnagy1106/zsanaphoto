import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { blockedPeriods, type BlockedPeriod, type NewBlockedPeriod } from "@/db/schema";
import { NotFoundError } from "@/lib/utils/errors";

export async function listBlockedPeriods(): Promise<BlockedPeriod[]> {
  return db.select().from(blockedPeriods).orderBy(asc(blockedPeriods.startAt));
}

export type CreateBlockedPeriodInput = Pick<NewBlockedPeriod, "startAt" | "endAt" | "reason">;

export async function createBlockedPeriod(input: CreateBlockedPeriodInput): Promise<BlockedPeriod> {
  const [created] = await db.insert(blockedPeriods).values(input).returning();
  return created;
}

export async function deleteBlockedPeriod(id: string): Promise<void> {
  const result = await db.delete(blockedPeriods).where(eq(blockedPeriods.id, id)).returning();
  if (result.length === 0) throw new NotFoundError("A blokkolt időszak nem található.");
}
