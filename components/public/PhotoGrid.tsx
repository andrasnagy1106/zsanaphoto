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
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id ?? `${photo.category}-${index}`}
          caption={photo.caption}
          src={photo.src}
          index={GALLERY_CATEGORIES.indexOf(photo.category)}
          aspect={index % 3 === 0 ? "landscape" : "portrait"}
        />
      ))}
    </div>
  );
}
