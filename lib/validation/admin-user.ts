import { z } from "zod";

export const createAdminUserSchema = z.object({
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen.").max(100),
  email: z.string().trim().email("Adj meg érvényes e-mail címet.").max(200),
  password: z.string().min(8, "A jelszó legalább 8 karakter hosszú legyen.").max(100),
});

export type CreateAdminUserForm = z.infer<typeof createAdminUserSchema>;
