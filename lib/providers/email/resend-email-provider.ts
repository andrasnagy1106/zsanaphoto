import { Resend } from "resend";
import {
  buildAdminNewBookingEmail,
  buildBookingCancelledEmail,
  buildBookingConfirmedEmail,
  buildBookingCreatedEmail,
} from "./templates";
import type { BookingEmailInput, EmailProvider } from "./types";

/** Sends real emails via Resend. Used in production and locally when RESEND_API_KEY is set. */
export class ResendEmailProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  private async send(to: string, subject: string, text: string) {
    try {
      await this.client.emails.send({
        from: this.from,
        to,
        subject,
        text,
      });
    } catch (error) {
      // Booking persistence must not depend on email delivery succeeding.
      console.error(`[ResendEmailProvider] Failed to send email to ${to}:`, error);
    }
  }

  async sendBookingCreatedEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildBookingCreatedEmail(input);
    await this.send(input.customerEmail, subject, text);
  }

  async sendAdminNewBookingEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildAdminNewBookingEmail(input);
    await this.send(input.adminNotificationEmail, subject, text);
  }

  async sendBookingConfirmedEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildBookingConfirmedEmail(input);
    await this.send(input.customerEmail, subject, text);
  }

  async sendBookingCancelledEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildBookingCancelledEmail(input);
    await this.send(input.customerEmail, subject, text);
  }
}
