import { z } from "zod";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const availabilityCalendarSchema = z.object({
  name: z.string().trim().min(2, "A naptár neve legalább 2 karakter legyen.").max(100),
});

export const availabilityCalendarSlotSchema = z.object({
  calendarId: z.string().min(1),
  date: z.iso.date("Érvényes dátumot adj meg."),
  startTime: z.string().regex(timePattern, "Érvényes kezdési időt adj meg."),
  endTime: z.string().regex(timePattern, "Érvényes záró időt adj meg."),
}).refine((slot) => slot.startTime < slot.endTime, {
  message: "A záró időpontnak későbbinek kell lennie a kezdésnél.",
  path: ["endTime"],
});

export const availabilityCalendarSlotBatchSchema = availabilityCalendarSlotSchema.safeExtend({
  durationMinutes: z.coerce.number().int().min(1, "Az időpont hossza legalább 1 perc legyen.").max(1440),
}).superRefine((input, context) => {
  const [startHours, startMinutes] = input.startTime.split(":").map(Number);
  const [endHours, endMinutes] = input.endTime.split(":").map(Number);
  const totalMinutes = (endHours - startHours) * 60 + endMinutes - startMinutes;
  if (totalMinutes < input.durationMinutes || totalMinutes % input.durationMinutes !== 0) {
    context.addIssue({
      code: "custom",
      message: "Az időszaknak egész számú, teljes hosszúságú időpontokra kell oszthatónak lennie.",
      path: ["durationMinutes"],
    });
  }
});

export type AvailabilityCalendarSlotBatchInput = z.output<typeof availabilityCalendarSlotBatchSchema>;