import { GalleryPhotoManager } from "@/components/admin/GalleryPhotoManager";
import { GALLERY_CATEGORIES, type GalleryCategory } from "@/lib/gallery-categories";
import { listAllGalleryPhotos } from "@/lib/services/gallery-service";
import type { GalleryPhoto } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const allPhotos = await listAllGalleryPhotos();

  const photosByCategory = Object.fromEntries(
    GALLERY_CATEGORIES.map((category) => [category, allPhotos.filter((photo) => photo.category === category)]),
  ) as Record<GalleryCategory, GalleryPhoto[]>;

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-foreground">Galéria kezelése</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Tölts fel és törölj fotókat a publikus portfólió galériába kategóriánként. A kategória első
          feltöltött képe jelenik meg a főoldalon és a lábléc galéria-sávjában is.
        </p>
      </div>

      <div className="mt-6">
        <GalleryPhotoManager photosByCategory={photosByCategory} />
      </div>
    </div>
  );
}
