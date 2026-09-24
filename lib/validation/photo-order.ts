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
  billingName: z.string().trim().min(2, "A számlázási név megadása kötelező.").max(150),
  billingPostalCode: z.string().trim().min(2, "Az irányítószám megadása kötelező.").max(20),
  billingCity: z.string().trim().min(2, "A település megadása kötelező.").max(100),
  billingAddress: z.string().trim().min(3, "A számlázási cím megadása kötelező.").max(250),
  notes: z.string().trim().max(1000, "A megjegyzés legfeljebb 1000 karakter lehet.").optional(),
  includesDigital: z.boolean().optional().default(false),
  items: z.array(photoOrderItemSchema).max(100).default([]),
}).superRefine(({ items, includesDigital }, context) => {
  if (!includesDigital && items.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["items"],
      message: "Válassz legalább egy papírképet, vagy jelöld be a digitális változatot.",
    });
  }

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

export const updateBookingPhotoPricesSchema = z.object({
  bookingId: z.string().uuid("Érvénytelen foglalás azonosító."),
  prices: z
    .object({
      "10x15 cm": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
      "13x18 cm": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
      "15x21 cm": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
      "A4 21x30 cm": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
      "Digitális kép": z.coerce.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
    })
    .nullable()
    .optional(),
});

export type SavePhotoOrderForm = z.infer<typeof savePhotoOrderSchema>;
export type UpdateBookingPhotoPricesForm = z.infer<typeof updateBookingPhotoPricesSchema>;