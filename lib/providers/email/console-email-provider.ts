import {
  buildAdminNewBookingEmail,
  buildBookingCancelledEmail,
  buildBookingConfirmedEmail,
  buildBookingCreatedEmail,
} from "./templates";
import type { BookingEmailInput, EmailProvider } from "./types";

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
}
