import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Adj meg érvényes e-mail címet."),
  password: z.string().min(1, "Add meg a jelszót."),
});

export type LoginForm = z.infer<typeof loginSchema>;
