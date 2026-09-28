import { GalleryPhotoManager } from "@/components/admin/GalleryPhotoManager";
import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import { listAllGalleryPhotos } from "@/lib/services/gallery-service";

export const dynamic = "force-dynamic";

const GALLERY_COLLECTIONS = GALLERY_CATEGORIES.map((category) => ({ key: category, label: category }));

export default async function AdminGalleryPage() {
  const allPhotos = await listAllGalleryPhotos();

  const photosByCategory = Object.fromEntries(
    GALLERY_CATEGORIES.map((category) => [category, allPhotos.filter((photo) => photo.category === category)]),
  );

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-foreground">Galéria kezelése</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Tölts fel és törölj fotókat a publikus portfólió galériába kategóriánként. Feltöltés után a
          nyilakkal módosíthatod a sorrendet, a „Szerkesztés” gombbal pedig a feliratot, annak
          láthatóságát és a kép keretbe igazítását. A kategória első képe jelenik meg a főoldalon is.
        </p>
      </div>

      <div className="mt-6">
        <GalleryPhotoManager
          collections={GALLERY_COLLECTIONS}
          photosByCollection={photosByCategory}
          previewAspectClasses={["aspect-square", "aspect-[3/4]", "aspect-[4/3]"]}
        />
      </div>
    </div>
  );
}
