import { GalleryPhotoManager } from "@/components/admin/GalleryPhotoManager";
import { SERVICE_PAGE_PHOTO_COLLECTIONS } from "@/lib/service-page-photos";
import { listAllGalleryPhotos } from "@/lib/services/gallery-service";

export const dynamic = "force-dynamic";

export default async function AdminServicePagePhotosPage() {
  const allPhotos = await listAllGalleryPhotos();

  const photosByPage = Object.fromEntries(
    SERVICE_PAGE_PHOTO_COLLECTIONS.map((collection) => [
      collection.key,
      allPhotos.filter((photo) => photo.category === collection.key),
    ]),
  );

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-foreground">Szolgáltatás oldalak képei</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Itt cserélheted a szolgáltatásokat bemutató oldalak (pl. Családi fotózás) képeit. Amíg egy
          oldalhoz nincs saját kép feltöltve, ott a galéria kategóriák első képei látszanak.
          Feltöltés után a sorrend, a felirat és a keretbe igazítás is módosítható.
        </p>
      </div>

      <div className="mt-6">
        <GalleryPhotoManager
          collections={SERVICE_PAGE_PHOTO_COLLECTIONS}
          photosByCollection={photosByPage}
          previewAspectClasses={["aspect-[4/3]", "aspect-[3/4]"]}
        />
      </div>
    </div>
  );
}
