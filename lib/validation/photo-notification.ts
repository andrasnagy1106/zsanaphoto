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
});
