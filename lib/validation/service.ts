import { z } from "zod";

export const updateServiceSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().default(""),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  bufferMinutes: z.coerce.number().int().min(0).max(600),
  approvalMode: z.enum(["AUTO", "MANUAL"]),
  active: z.coerce.boolean(),
});

export type UpdateServiceForm = z.infer<typeof updateServiceSchema>;
