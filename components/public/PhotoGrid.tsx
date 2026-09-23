import { PhotoCard } from "./PhotoCard";

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

const REFERENCE_PHOTOS: { caption: string; category: GalleryCategory }[] = [
  { caption: "Családi pillanatok", category: "Családi" },
  { caption: "Közös történetek", category: "Páros" },
  { caption: "Születésnapi emlékek", category: "Szülinapi" },
  { caption: "Első pillanatok", category: "Baba" },
  { caption: "A nagy nap", category: "Esküvő" },
  { caption: "Közösségi események", category: "Rendezvények" },
  { caption: "Ünnepi hangulat", category: "Karácsonyi" },
  { caption: "Anyák napi emlékek", category: "Anyáknapi" },
  { caption: "Bölcsődei, óvodai és iskolai képek", category: "Bölcsi-óvoda-iskola" },
];

interface PhotoGridProps {
  limit?: number;
  category?: GalleryCategory;
}

/** Returns the first photo of each of the first `categoryCount` gallery categories, in order. */
export function getFeaturedGalleryPhotos(categoryCount: number) {
  return GALLERY_CATEGORIES.slice(0, categoryCount)
    .map((category) => REFERENCE_PHOTOS.find((photo) => photo.category === category))
    .filter((photo): photo is (typeof REFERENCE_PHOTOS)[number] => photo !== undefined);
}

export function PhotoGrid({ limit, category }: PhotoGridProps) {
  const matchingPhotos = category
    ? REFERENCE_PHOTOS.filter((photo) => photo.category === category)
    : REFERENCE_PHOTOS;
  const photos = limit ? matchingPhotos.slice(0, limit) : matchingPhotos;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.category}
          caption={photo.caption}
          index={GALLERY_CATEGORIES.indexOf(photo.category)}
          aspect={index % 3 === 0 ? "landscape" : "portrait"}
        />
      ))}
    </div>
  );
}
