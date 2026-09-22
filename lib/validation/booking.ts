import { z } from "zod";

export const createBookingInputSchema = z.object({
  serviceId: z.string().min(1, "Válassz szolgáltatást."),
  startAt: z.string().min(1, "Válassz időpontot."),
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen.").max(100),
  email: z.string().trim().email("Adj meg érvényes e-mail címet.").max(200),
  phone: z.string().trim().min(6, "Adj meg érvényes telefonszámot.").max(30),
  notes: z.string().trim().max(1000).optional(),
  photoPublicationConsent: z.boolean().optional().default(false),
  // Honeypot field: real users never fill this in; bots often do.
  company: z.string().max(0, "Érvénytelen beküldés.").optional(),
});

export type CreateBookingInputForm = z.infer<typeof createBookingInputSchema>;

export const cancelBookingByCustomerSchema = z.object({
  token: z.string().min(1, "Érvénytelen azonosító."),
});

export const rescheduleBookingByCustomerSchema = z.object({
  token: z.string().min(1, "Érvénytelen azonosító."),
  startAt: z.string().min(1, "Válassz új időpontot."),
});

export type RescheduleBookingByCustomerForm = z.infer<typeof rescheduleBookingByCustomerSchema>;

export const createAdminEventUserSchema = z.object({
  serviceId: z.string().min(1, "Válassz eseményt / szolgáltatást."),
  customerName: z.string().trim().min(2, "A név legalább 2 karakter legyen.").max(100),
  customerEmail: z.string().trim().email("Adj meg érvényes e-mail címet.").max(200),
  customerPhone: z.string().trim().max(30).optional().default("+36"),
  pin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}\d{5}$/, "A PIN 2 betű és 5 számjegy legyen (pl. AB12345).")
    .optional()
    .or(z.literal("")),
  date: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED"]).optional().default("COMPLETED"),
  notes: z.string().trim().max(1000).optional(),
  sendEmail: z.boolean().optional().default(false),
});

export type CreateAdminEventUserForm = z.infer<typeof createAdminEventUserSchema>;
