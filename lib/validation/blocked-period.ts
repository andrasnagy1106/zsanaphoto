import { z } from "zod";

export const createBlockedPeriodSchema = z
  .object({
    startAt: z.string().min(1, "Add meg a kezdő időpontot."),
    endAt: z.string().min(1, "Add meg a befejező időpontot."),
    reason: z.string().trim().max(300).optional().default(""),
  })
  .refine((data) => new Date(data.startAt) < new Date(data.endAt), {
    message: "A kezdés korábban legyen, mint a befejezés.",
    path: ["endAt"],
  });

export type CreateBlockedPeriodForm = z.infer<typeof createBlockedPeriodSchema>;
