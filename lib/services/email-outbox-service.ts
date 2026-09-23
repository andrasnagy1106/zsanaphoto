import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { emailOutbox } from "@/db/schema";
import { addMinutes, getZonedDateIso, zonedDateTimeToUtc } from "@/lib/utils/time";

/** Resend's free-tier daily sending cap; emails beyond this are queued for the next flush. */
export const DAILY_EMAIL_SEND_LIMIT = 99;

function getBudapestDayBounds(date: Date): { start: Date; end: Date } {
  const dateIso = getZonedDateIso(date);
  const start = zonedDateTimeToUtc(dateIso, "00:00");
  return { start, end: addMinutes(start, 24 * 60) };
}

async function countSentEmailsToday(now: Date): Promise<number> {
  const { start, end } = getBudapestDayBounds(now);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailOutbox)
    .where(and(eq(emailOutbox.status, "SENT"), gte(emailOutbox.sentAt, start), lt(emailOutbox.sentAt, end)));

  return row?.count ?? 0;
}

export interface SendOrQueueEmailInput {
  to: string;
  subject: string;
  body: string;
  deliver: () => Promise<void>;
}

/**
 * Delivers an email immediately if today's Resend send count is still under the daily cap;
 * otherwise queues it in `email_outbox` for the next scheduled flush.
 */
export async function sendOrQueueEmail(input: SendOrQueueEmailInput): Promise<void> {
  const now = new Date();
  const sentToday = await countSentEmailsToday(now);

  if (sentToday >= DAILY_EMAIL_SEND_LIMIT) {
    await db.insert(emailOutbox).values({
      toAddress: input.to,
      subject: input.subject,
      body: input.body,
      status: "QUEUED",
    });
    return;
  }

  try {
    await input.deliver();
  } catch (error) {
    console.error(`[email-outbox] Failed to deliver email to ${input.to}:`, error);
    return;
  }

  await db.insert(emailOutbox).values({
    toAddress: input.to,
    subject: input.subject,
    body: input.body,
    status: "SENT",
    sentAt: now,
  });
}

export interface FlushQueuedEmailsResult {
  sent: number;
  remaining: number;
}

/**
 * Sends queued emails (oldest first) up to the remaining daily allowance. Intended to run
 * once per day (e.g. 02:00 Europe/Budapest) via a scheduled job, after the previous day's
 * cap has reset.
 */
export async function flushQueuedEmails(
  deliver: (to: string, subject: string, body: string) => Promise<void>,
): Promise<FlushQueuedEmailsResult> {
  const now = new Date();
  let sentToday = await countSentEmailsToday(now);

  const queued = await db
    .select()
    .from(emailOutbox)
    .where(eq(emailOutbox.status, "QUEUED"))
    .orderBy(asc(emailOutbox.createdAt));

  let sentCount = 0;

  for (const email of queued) {
    if (sentToday >= DAILY_EMAIL_SEND_LIMIT) break;

    try {
      await deliver(email.toAddress, email.subject, email.body);
    } catch (error) {
      console.error(`[email-outbox] Failed to deliver queued email to ${email.toAddress}:`, error);
      continue;
    }

    await db
      .update(emailOutbox)
      .set({ status: "SENT", sentAt: new Date(), updatedAt: new Date() })
      .where(eq(emailOutbox.id, email.id));

    sentToday += 1;
    sentCount += 1;
  }

  return { sent: sentCount, remaining: queued.length - sentCount };
}
