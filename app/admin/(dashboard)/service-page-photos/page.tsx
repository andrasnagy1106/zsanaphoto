import { GalleryPhotoManager } from "@/components/admin/GalleryPhotoManager";
import { PAGE_PHOTO_COLLECTIONS } from "@/lib/service-page-photos";
import { listAllGalleryPhotos } from "@/lib/services/gallery-service";

export const dynamic = "force-dynamic";

export default async function AdminServicePagePhotosPage() {
  const allPhotos = await listAllGalleryPhotos();

  const photosByPage = Object.fromEntries(
    PAGE_PHOTO_COLLECTIONS.map((collection) => [
      collection.key,
      allPhotos.filter((photo) => photo.category === collection.key),
    ]),
  );

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-foreground">Bemutatkozó oldalak képei</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Itt kezelheted a szolgáltatásoldalak és a Rólam oldal képeit. A feltöltött képek sorrendje,
          felirata és keretbe igazítása is módosítható.
        </p>
      </div>

      <div className="mt-6">
        <GalleryPhotoManager
          collections={PAGE_PHOTO_COLLECTIONS}
          photosByCollection={photosByPage}
          previewAspectClasses={["aspect-[4/3]", "aspect-[3/4]"]}
        />
      </div>
    </div>
  );
}
