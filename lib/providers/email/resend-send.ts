import type { Resend } from "resend";
import { sleep } from "@/lib/utils/sleep";

/** Waits before each retry after a Resend 429; the attempt fails once these are exhausted. */
export const RESEND_RATE_LIMIT_RETRY_DELAYS_MS = [1000, 2000];

type ResendSendPayload = Parameters<Resend["emails"]["send"]>[0];

/** Sends via Resend, retrying rate-limited (429) requests and throwing on every other error. */
export async function sendWithRateLimitRetry(
  client: Pick<Resend, "emails">,
  payload: ResendSendPayload,
): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    const { error } = await client.emails.send(payload);
    if (!error) return;

    const rateLimited = error.name === "rate_limit_exceeded" || error.statusCode === 429;
    const delay = RESEND_RATE_LIMIT_RETRY_DELAYS_MS[attempt];
    if (!rateLimited || delay === undefined) throw new Error(error.message);

    console.warn(`[resend] Rate limited, retrying in ${delay} ms (attempt ${attempt + 2}).`);
    await sleep(delay);
  }
}
