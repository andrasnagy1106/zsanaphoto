import { Resend } from "resend";
import { sendOrQueueEmail } from "@/lib/services/email-outbox-service";
import {
  buildAdminBookingCancelledEmail,
  buildAdminBookingRescheduledEmail,
  buildAdminNewBookingEmail,
  buildBookingCancelledEmail,
  buildBookingConfirmedEmail,
  buildBookingCreatedEmail,
  buildBookingRescheduledEmail,
  buildAdminPhotoOrderNotificationEmail,
  buildPhotoOrderConfirmationEmail,
} from "./templates";
import type { BookingEmailInput, EmailProvider, PhotoOrderEmailInput } from "./types";

/** Sends real emails via Resend. Used in production and locally when RESEND_API_KEY is set. */
export class ResendEmailProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  private async send(to: string, subject: string, text: string) {
    // Resend's free tier caps daily sends; over the cap, queue for the next scheduled flush.
    await sendOrQueueEmail({
      to,
      subject,
      body: text,
      deliver: async () => {
        await this.client.emails.send({ from: this.from, to, subject, text });
      },
    });
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

  async sendAdminBookingCancelledEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildAdminBookingCancelledEmail(input);
    await this.send(input.adminNotificationEmail, subject, text);
  }

  async sendBookingRescheduledEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildBookingRescheduledEmail(input);
    await this.send(input.customerEmail, subject, text);
  }

  async sendAdminBookingRescheduledEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildAdminBookingRescheduledEmail(input);
    await this.send(input.adminNotificationEmail, subject, text);
  }

  async sendPhotoOrderConfirmationEmail(input: PhotoOrderEmailInput): Promise<void> {
    const { subject, text } = buildPhotoOrderConfirmationEmail(input);
    await this.send(input.customerEmail, subject, text);
  }

  async sendAdminPhotoOrderNotificationEmail(input: PhotoOrderEmailInput): Promise<void> {
    const { subject, text } = buildAdminPhotoOrderNotificationEmail(input);
    await this.send(input.adminNotificationEmail, subject, text);
  }
}
