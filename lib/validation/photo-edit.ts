import { z } from "zod";

const focusValue = z.number().int().min(0).max(100);

export const photoFocusSchema = z.object({
  focusX: focusValue,
  focusY: focusValue,
});

export const galleryPhotoEditSchema = photoFocusSchema.extend({
  caption: z.string().trim().max(200, "A felirat legfeljebb 200 karakter lehet."),
  showCaption: z.boolean(),
});

export const eventPhotoEditSchema = photoFocusSchema.extend({
  title: z.string().trim().min(1, "A kép neve nem lehet üres.").max(200, "A kép neve legfeljebb 200 karakter lehet."),
});

export const photoMoveDirectionSchema = z.enum(["up", "down"]);

export type PhotoFocusInput = z.infer<typeof photoFocusSchema>;
export type GalleryPhotoEditInput = z.infer<typeof galleryPhotoEditSchema>;
export type EventPhotoEditInput = z.infer<typeof eventPhotoEditSchema>;
export type PhotoMoveDirection = z.infer<typeof photoMoveDirectionSchema>;
