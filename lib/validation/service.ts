import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const updateServiceSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().default(""),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  bufferMinutes: z.coerce.number().int().min(0).max(600),
  approvalMode: z.enum(["AUTO", "MANUAL"]),
  availabilityMode: z.enum(["GLOBAL", "CUSTOM"]).default("GLOBAL"),
  dateRangeStart: z
    .string()
    .trim()
    .refine((val) => val === "" || datePattern.test(val), {
      message: "Érvényes ÉÉÉÉ-HH-NN formátumot adj meg.",
    })
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val ?? null)),
  dateRangeEnd: z
    .string()
    .trim()
    .refine((val) => val === "" || datePattern.test(val), {
      message: "Érvényes ÉÉÉÉ-HH-NN formátumot adj meg.",
    })
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val ?? null)),
  requiresChildName: z.coerce.boolean().default(false),
  active: z.coerce.boolean(),
});

export type UpdateServiceForm = z.infer<typeof updateServiceSchema>;

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen.").max(200),
  slug: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  durationMinutes: z.coerce.number().int().min(5, "Minimum 5 perc.").max(600).default(60),
  bufferMinutes: z.coerce.number().int().min(0).max(600).default(0),
  approvalMode: z.enum(["AUTO", "MANUAL"]).default("AUTO"),
  availabilityMode: z.enum(["GLOBAL", "CUSTOM"]).default("GLOBAL"),
  dateRangeStart: z
    .string()
    .trim()
    .refine((val) => val === "" || datePattern.test(val), {
      message: "Érvényes ÉÉÉÉ-HH-NN formátumot adj meg.",
    })
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val ?? null)),
  dateRangeEnd: z
    .string()
    .trim()
    .refine((val) => val === "" || datePattern.test(val), {
      message: "Érvényes ÉÉÉÉ-HH-NN formátumot adj meg.",
    })
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val ?? null)),
  requiresChildName: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
});

export type CreateServiceForm = z.infer<typeof createServiceSchema>;
