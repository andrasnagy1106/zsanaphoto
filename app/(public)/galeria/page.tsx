import type { Metadata } from "next";
import { GalleryBrowser } from "@/components/public/GalleryBrowser";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GALLERY_CATEGORIES, type GalleryCategory } from "@/lib/gallery-categories";
import { listAllGalleryPhotos, type GalleryPhotoDisplay } from "@/lib/services/gallery-service";

export const metadata: Metadata = {
  title: "Galéria",
  description: "Válogatás családi, páros, esküvői, rendezvény- és intézményi fotózásokból.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const allPhotos = await listAllGalleryPhotos();

  const photosByCategory = Object.fromEntries(
    GALLERY_CATEGORIES.map((category) => [
      category,
      allPhotos
        .filter((photo) => photo.category === category)
        .map(
          (photo): GalleryPhotoDisplay => ({
            id: photo.id,
            category,
            caption: photo.caption,
            src: photo.secureUrl,
            width: photo.width,
            height: photo.height,
          }),
        ),
    ]),
  ) as Record<GalleryCategory, GalleryPhotoDisplay[]>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Portfólió" title="Galéria" description="Válogatás korábbi fotózásokból." />
      <div className="mt-10">
        <GalleryBrowser photosByCategory={photosByCategory} />
      </div>
    </div>
  );
}
