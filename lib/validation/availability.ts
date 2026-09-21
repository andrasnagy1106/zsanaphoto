import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

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

export type ServiceAvailabilityRuleForm = z.infer<typeof serviceAvailabilityRuleSchema>;
