import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const availabilityRuleSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(timePattern, "Érvénytelen időformátum (ÓÓ:PP)."),
    endTime: z.string().regex(timePattern, "Érvénytelen időformátum (ÓÓ:PP)."),
    active: z.coerce.boolean(),
  })
  .refine((data) => !data.active || data.startTime < data.endTime, {
    message: "A kezdés időpontja korábban legyen, mint a befejezés.",
    path: ["endTime"],
  });

export const serviceAvailabilityRuleSchema = z
  .object({
    serviceId: z.string().min(1),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(timePattern, "Érvénytelen időformátum (ÓÓ:PP)."),
    endTime: z.string().regex(timePattern, "Érvénytelen időformátum (ÓÓ:PP)."),
    active: z.coerce.boolean(),
  })
  .refine((data) => !data.active || data.startTime < data.endTime, {
    message: "A kezdés időpontja korábban legyen, mint a befejezés.",
    path: ["endTime"],
  });

export const availabilityDateOverrideSchema = z
  .object({
    date: z.string().regex(datePattern, "Érvénytelen dátum formátum (ÉÉÉÉ-HH-NN)."),
    startTime: z.string().regex(timePattern, "Érvénytelen időformátum (ÓÓ:PP)."),
    endTime: z.string().regex(timePattern, "Érvénytelen időformátum (ÓÓ:PP)."),
    note: z.string().trim().max(140, "Az emlékeztető legfeljebb 140 karakter lehet.").optional().default(""),
    active: z.coerce.boolean().optional().default(true),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "A kezdés időpontja korábban legyen, mint a befejezés.",
    path: ["endTime"],
  });

export type ServiceAvailabilityRuleForm = z.infer<typeof serviceAvailabilityRuleSchema>;
