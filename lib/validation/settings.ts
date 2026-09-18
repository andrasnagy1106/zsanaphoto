import { z } from "zod";

export const settingsSchema = z.object({
  timezone: z.string().min(1),
  adminNotificationEmail: z.string().trim().email("Adj meg érvényes e-mail címet."),
  siteContactEmail: z.string().trim().email("Adj meg érvényes e-mail címet."),
  minimumLeadTimeHours: z.coerce.number().int().min(0).max(168),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
});

export type SettingsForm = z.infer<typeof settingsSchema>;
