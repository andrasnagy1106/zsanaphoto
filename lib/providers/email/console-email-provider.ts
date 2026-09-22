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

/** Logs email content to the server console. Used in local development without a Resend API key. */
export class ConsoleEmailProvider implements EmailProvider {
  private log(to: string, subject: string, text: string) {
    console.log(
      `\n--- [ConsoleEmailProvider] Email to: ${to} ---\nSubject: ${subject}\n\n${text}\n--- end email ---\n`,
    );
  }

  async sendBookingCreatedEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildBookingCreatedEmail(input);
    this.log(input.customerEmail, subject, text);
  }

  async sendAdminNewBookingEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildAdminNewBookingEmail(input);
    this.log(input.adminNotificationEmail, subject, text);
  }

  async sendBookingConfirmedEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildBookingConfirmedEmail(input);
    this.log(input.customerEmail, subject, text);
  }

  async sendBookingCancelledEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildBookingCancelledEmail(input);
    this.log(input.customerEmail, subject, text);
  }

  async sendAdminBookingCancelledEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildAdminBookingCancelledEmail(input);
    this.log(input.adminNotificationEmail, subject, text);
  }

  async sendBookingRescheduledEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildBookingRescheduledEmail(input);
    this.log(input.customerEmail, subject, text);
  }

  async sendAdminBookingRescheduledEmail(input: BookingEmailInput): Promise<void> {
    const { subject, text } = buildAdminBookingRescheduledEmail(input);
    this.log(input.adminNotificationEmail, subject, text);
  }

  async sendPhotoOrderConfirmationEmail(input: PhotoOrderEmailInput): Promise<void> {
    const { subject, text } = buildPhotoOrderConfirmationEmail(input);
    this.log(input.customerEmail, subject, text);
  }

  async sendAdminPhotoOrderNotificationEmail(input: PhotoOrderEmailInput): Promise<void> {
    const { subject, text } = buildAdminPhotoOrderNotificationEmail(input);
    this.log(input.adminNotificationEmail, subject, text);
  }
}
