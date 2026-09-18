export type ApprovalMode = "AUTO" | "MANUAL";

export interface BookingEmailInput {
  bookingNumber: string;
  serviceName: string;
  approvalMode: ApprovalMode;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string | null;
  startAt: Date;
  endAt: Date;
  adminNotificationEmail: string;
}

export interface EmailProvider {
  sendBookingCreatedEmail(input: BookingEmailInput): Promise<void>;
  sendAdminNewBookingEmail(input: BookingEmailInput): Promise<void>;
  sendBookingConfirmedEmail(input: BookingEmailInput): Promise<void>;
  sendBookingCancelledEmail(input: BookingEmailInput): Promise<void>;
}
