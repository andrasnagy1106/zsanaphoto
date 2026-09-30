import type { Metadata } from "next";
import { GalleryBrowser } from "@/components/public/GalleryBrowser";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GALLERY_CATEGORIES, type GalleryCategory } from "@/lib/gallery-categories";
import {
  listAllGalleryPhotos,
  toGalleryPhotoDisplay,
  type GalleryPhotoDisplay,
} from "@/lib/services/gallery-service";

export const metadata: Metadata = {
  title: "Fotógaléria - családi és intézményi képek",
  description: "Tekintsd meg a ZsaNa Photo családi, páros, ünnepi és intézményi fotógalériáját. Fotózás Sárbogárdon és környékén.",
  alternates: { canonical: "/galeria" },
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const allPhotos = await listAllGalleryPhotos();

  const photosByCategory = Object.fromEntries(
    GALLERY_CATEGORIES.map((category) => [
      category,
      allPhotos.filter((photo) => photo.category === category).map(toGalleryPhotoDisplay),
    ]),
  ) as Record<GalleryCategory, GalleryPhotoDisplay[]>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading level="h1" eyebrow="Portfólió" title="Galéria" description="Válogatás korábbi fotózásokból." />
      <div className="mt-10">
        <GalleryBrowser photosByCategory={photosByCategory} />
      </div>
    </div>
  );
}
