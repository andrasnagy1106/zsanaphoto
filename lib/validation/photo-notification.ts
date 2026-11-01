import { z } from "zod";

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
});

export const sendPhotoReadyEmailSchema = z.object({
  bookingId: z.string().uuid(),
});
