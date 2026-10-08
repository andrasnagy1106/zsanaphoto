/**
 * Photo collections shown on the individual service presentation pages. Stored in the
 * `gallery_photos` table with `category` = key, so they get the same edit/order features.
 */
export const SERVICE_PAGE_PHOTO_COLLECTIONS = [
  { key: "oldal:csaladi-fotozas", label: "Családi fotózás", href: "/csaladi-fotozas" },
  { key: "oldal:intezmenyi-fotozas", label: "Portré fotózás", href: "/portre-fotozas" },
  { key: "oldal:bolcsodei-es-ovodai-fotozas", label: "Bölcsődei & óvodai fotózás", href: "/bolcsodei-es-ovodai-fotozas" },
  { key: "oldal:iskolai-fotozas", label: "Iskolai fotózás", href: "/iskolai-fotozas" },
  { key: "oldal:szezonalis-fotozas", label: "Szezonális fotózás", href: "/szezonalis-fotozas" },
] as const;

export const ABOUT_PAGE_PHOTO_COLLECTION = {
  key: "oldal:rolam",
  label: "Rólam",
  href: "/rolam",
} as const;

export const PAGE_PHOTO_COLLECTIONS = [
  ...SERVICE_PAGE_PHOTO_COLLECTIONS,
  ABOUT_PAGE_PHOTO_COLLECTION,
] as const;

export type ServicePagePhotoKey = (typeof SERVICE_PAGE_PHOTO_COLLECTIONS)[number]["key"];
export type PagePhotoKey = (typeof PAGE_PHOTO_COLLECTIONS)[number]["key"];

export function isServicePagePhotoKey(value: string): value is ServicePagePhotoKey {
  return SERVICE_PAGE_PHOTO_COLLECTIONS.some((collection) => collection.key === value);
}

export function isPagePhotoKey(value: string): value is PagePhotoKey {
  return PAGE_PHOTO_COLLECTIONS.some((collection) => collection.key === value);
}
