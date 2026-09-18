import { z } from "zod";

export const createInquirySchema = z.object({
  institutionName: z.string().trim().min(2, "Add meg az intézmény nevét.").max(200),
  contactName: z.string().trim().min(2, "Add meg a kapcsolattartó nevét.").max(200),
  email: z.string().trim().email("Adj meg érvényes e-mail címet.").max(200),
  phone: z.string().trim().min(6, "Adj meg érvényes telefonszámot.").max(30),
  estimatedParticipantCount: z.string().trim().max(50).optional(),
  preferredPeriod: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
  company: z.string().max(0, "Érvénytelen beküldés.").optional(),
});

export type CreateInquiryForm = z.infer<typeof createInquirySchema>;
