export type ApprovalMode = "AUTO" | "MANUAL";

export interface BookingEmailInput {
  bookingNumber: string;
  pin?: string | null;
  serviceName: string;
  approvalMode: ApprovalMode;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  photoPublicationConsent?: boolean | null;
  notes?: string | null;
  startAt: Date;
  endAt: Date;
  adminNotificationEmail: string;
  manageUrl?: string;
}

export interface PhotoOrderEmailInput {
  orderNumber: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  adminNotificationEmail: string;
  notes?: string | null;
  isUpdate: boolean;
  totalAmount: number;
  items: Array<{
    photoTitle: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface EmailProvider {
  sendBookingCreatedEmail(input: BookingEmailInput): Promise<void>;
  sendAdminNewBookingEmail(input: BookingEmailInput): Promise<void>;
  sendBookingConfirmedEmail(input: BookingEmailInput): Promise<void>;
  sendBookingCancelledEmail(input: BookingEmailInput): Promise<void>;
  sendAdminBookingCancelledEmail(input: BookingEmailInput): Promise<void>;
  sendBookingRescheduledEmail(input: BookingEmailInput): Promise<void>;
  sendAdminBookingRescheduledEmail(input: BookingEmailInput): Promise<void>;
  sendPhotoOrderConfirmationEmail(input: PhotoOrderEmailInput): Promise<void>;
  sendAdminPhotoOrderNotificationEmail(input: PhotoOrderEmailInput): Promise<void>;
}
