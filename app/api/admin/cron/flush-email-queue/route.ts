import { NextResponse } from "next/server";
import { Resend } from "resend";
import { EMAIL_FROM_ADDRESS, EMAIL_REPLY_TO_ADDRESS } from "@/lib/constants";
import { flushQueuedEmails } from "@/lib/services/email-outbox-service";

export const dynamic = "force-dynamic";

/**
 * Scheduled endpoint (see vercel.json) that sends out emails queued the previous day once the
 * Resend daily send cap has reset. Safe to invoke more than once — it only sends emails still
 * marked QUEUED and stops again once the daily cap is reached.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || EMAIL_FROM_ADDRESS;

  if (!apiKey) {
    // No real email provider configured (dev/console mode) — nothing to flush.
    return NextResponse.json({ sent: 0, remaining: 0, skipped: true });
  }

  const client = new Resend(apiKey);
  const result = await flushQueuedEmails(async (to, subject, text) => {
    await client.emails.send({ from, to, subject, text, replyTo: EMAIL_REPLY_TO_ADDRESS });
  });

  return NextResponse.json(result);
}
