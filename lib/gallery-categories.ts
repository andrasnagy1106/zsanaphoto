export const GALLERY_CATEGORIES = [
  "Családi",
  "Páros",
  "Szülinapi",
  "Baba",
  "Esküvő",
  "Rendezvények",
  "Karácsonyi",
  "Anyáknapi",
  "Bölcsi-óvoda-iskola",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

/** Fallback caption shown under a category's placeholder card until a real photo is uploaded. */
export const GALLERY_CATEGORY_DEFAULT_CAPTIONS: Record<GalleryCategory, string> = {
  "Családi": "Családi pillanatok",
  "Páros": "Közös történetek",
  "Szülinapi": "Születésnapi emlékek",
  "Baba": "Első pillanatok",
  "Esküvő": "A nagy nap",
  "Rendezvények": "Közösségi események",
  "Karácsonyi": "Ünnepi hangulat",
  "Anyáknapi": "Anyák napi emlékek",
  "Bölcsi-óvoda-iskola": "Bölcsődei, óvodai és iskolai képek",
};

export function isGalleryCategory(value: string): value is GalleryCategory {
  return (GALLERY_CATEGORIES as readonly string[]).includes(value);
}
