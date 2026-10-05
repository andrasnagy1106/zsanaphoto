import { z } from "zod";
import type { PhotoPrintSize } from "@/lib/photo-order-catalog";

const optionalPhotoPrice = z.preprocess(
  (value) => value === "" || value === undefined || value === null ? undefined : Number(value),
  z.number().int().min(0, "Az ár nem lehet negatív.").max(100000).optional(),
);

export const photoPriceOverridesSchema = z.object({
  "10x15 cm": optionalPhotoPrice,
  "13x18 cm": optionalPhotoPrice,
  "15x21 cm": optionalPhotoPrice,
  "A4 21x30 cm": optionalPhotoPrice,
  "Digitális kép": optionalPhotoPrice,
}).transform((prices) => {
  const entries = Object.entries(prices).filter(([, price]) => price !== undefined);
  return entries.length > 0
    ? Object.fromEntries(entries) as Partial<Record<PhotoPrintSize, number>>
    : null;
});