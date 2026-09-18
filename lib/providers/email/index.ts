import { ConsoleEmailProvider } from "./console-email-provider";
import { ResendEmailProvider } from "./resend-email-provider";
import type { EmailProvider } from "./types";

let cachedProvider: EmailProvider | null = null;

/** Selects the email provider based on environment configuration. UI code should never talk to Resend directly. */
export function getEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (apiKey && from) {
    cachedProvider = new ResendEmailProvider(apiKey, from);
  } else {
    cachedProvider = new ConsoleEmailProvider();
  }

  return cachedProvider;
}

export type { BookingEmailInput, EmailProvider } from "./types";
