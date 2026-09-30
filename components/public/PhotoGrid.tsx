import { PhotoCard } from "./PhotoCard";
import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import type { GalleryPhotoDisplay } from "@/lib/services/gallery-service";

export { GALLERY_CATEGORIES } from "@/lib/gallery-categories";
export type { GalleryCategory } from "@/lib/gallery-categories";

interface PhotoGridProps {
  photos: GalleryPhotoDisplay[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {photos.map((photo, index) => {
        const isLandscape = typeof photo.width === "number" && typeof photo.height === "number" && photo.width > photo.height;
        const isSquare = typeof photo.width === "number" && typeof photo.height === "number" && Math.abs(photo.width - photo.height) <= 24;

        return (
          <PhotoCard
            key={photo.id ?? `${photo.category}-${index}`}
            caption={photo.caption}
            src={photo.src}
            index={(GALLERY_CATEGORIES as readonly string[]).indexOf(photo.category)}
            aspect={isSquare ? "square" : isLandscape ? "landscape" : "portrait"}
            objectPosition={photo.objectPosition}
          />
        );
      })}
    </div>
  );
}
