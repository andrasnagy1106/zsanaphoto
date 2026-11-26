import { z } from "zod";
import { MAX_PAYMENT_INFORMATION_LENGTH } from "@/lib/payment-information";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const savePhotoOrderDeadlineSchema = z.object({
  bookingId: z.string().uuid(),
  orderDeadline: z
    .string()
    .trim()
    .refine((value) => value === "" || (datePattern.test(value) && validDate(value)), {
      message: "Adj meg érvényes rendelési határidőt.",
    }),
  paymentDeadline: z.string().trim().refine(
    (value) => value === "" || (datePattern.test(value) && validDate(value)),
    { message: "Adj meg érvényes fizetési határidőt." },
  ).optional().default(""),
  paymentInformation: z.string().trim().max(
    MAX_PAYMENT_INFORMATION_LENGTH,
    "A fizetési tájékoztató legfeljebb 5000 karakter lehet.",
  ).nullable().optional().default(null),
});

export const sendPhotoReadyEmailSchema = z.object({
  bookingId: z.string().uuid(),
  mode: z.enum(["UNSENT", "ALL"]).optional().default("UNSENT"),
});

export const sendPhotoReadyEmailToBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

const emailSchema = z.string().trim().toLowerCase().email("Adj meg érvényes e-mail címet.").max(200);

export const resendPhotoReadyEmailSchema = z.object({
  bookingId: z.string().uuid(),
  currentEmail: z.string().trim().toLowerCase().max(200),
  email: emailSchema,
  confirmEmail: emailSchema,
}).refine(({ email, confirmEmail }) => email === confirmEmail, {
  message: "A két e-mail cím nem egyezik.",
  path: ["confirmEmail"],
});

export type ResendPhotoReadyEmailInput = z.infer<typeof resendPhotoReadyEmailSchema>;
export type PhotoReadyEmailMode = z.infer<typeof sendPhotoReadyEmailSchema>["mode"];
