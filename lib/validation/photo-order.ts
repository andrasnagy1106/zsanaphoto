import { z } from "zod";
import { PHOTO_PRINT_SIZES } from "@/lib/photo-order-catalog";

export const verifyPhotoOrderPinSchema = z.object({
  pin: z.string().trim().toUpperCase().regex(/^[A-Z]{2}\d{5}$/, "Érvénytelen PIN formátum."),
});

export const photoOrderItemSchema = z.object({
  photoId: z.string().min(1).max(100),
  size: z.enum(PHOTO_PRINT_SIZES),
  quantity: z.number().int().min(1).max(99),
});

export const savePhotoOrderSchema = z.object({
  accessToken: z.string().uuid("Érvénytelen hozzáférés."),
  notes: z.string().trim().max(1000, "A megjegyzés legfeljebb 1000 karakter lehet.").optional(),
  items: z.array(photoOrderItemSchema).min(1, "Válassz legalább egy képet.").max(100),
}).superRefine(({ items }, context) => {
  const itemKeys = items.map((item) => `${item.photoId}:${item.size}`);
  if (new Set(itemKeys).size !== itemKeys.length) {
    context.addIssue({ code: "custom", path: ["items"], message: "Egy kép és méret csak egyszer szerepelhet." });
  }

  if (items.reduce((sum, item) => sum + item.quantity, 0) > 500) {
    context.addIssue({ code: "custom", path: ["items"], message: "Legfeljebb 500 példány rendelhető." });
  }
});

export const updatePhotoOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["NEW", "PROCESSING", "COMPLETED", "CANCELLED"]),
});

export type SavePhotoOrderForm = z.infer<typeof savePhotoOrderSchema>;