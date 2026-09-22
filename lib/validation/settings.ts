import { z } from "zod";

export const settingsSchema = z.object({
  timezone: z.string().min(1),
  adminNotificationEmail: z.string().trim().email("Adj meg érvényes e-mail címet."),
  siteContactEmail: z.string().trim().email("Adj meg érvényes e-mail címet."),
  minimumLeadTimeHours: z.coerce.number().int().min(0).max(168),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
  defaultPhotoPrices: z
    .object({
      "10x15 cm": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
      "13x18 cm": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
      "15x21 cm": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
      "A4 21x30 cm": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
      "Digitális változat": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
    })
    .nullable()
    .optional(),
});

export type SettingsForm = z.infer<typeof settingsSchema>;
