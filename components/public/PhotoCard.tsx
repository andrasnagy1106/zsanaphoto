import Image from "next/image";
import { getPlaceholderImageUrl } from "@/lib/utils/placeholder-image";

interface PhotoCardProps {
  /** Empty string hides the caption overlay. */
  caption: string;
  /** Real uploaded photo URL. When missing, a neutral filler image is shown instead. */
  src?: string | null;
  index?: number;
  aspect?: "square" | "portrait" | "landscape";
  objectPosition?: string;
}

const ASPECT_CLASSES: Record<NonNullable<PhotoCardProps["aspect"]>, string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};

/**
 * Renders a real gallery photo when available, otherwise a neutral filler image so the
 * page never breaks while a category still has no uploaded photo.
 */
export function PhotoCard({ caption, src, index = 0, aspect = "portrait", objectPosition }: PhotoCardProps) {
  const imageSrc = src || getPlaceholderImageUrl(`zsana-gallery-${index}`, 600, 800);

  return (
    <figure className={`group relative overflow-hidden rounded-lg border border-border bg-muted/30 ${ASPECT_CLASSES[aspect]}`}>
      <Image
        src={imageSrc}
        alt={caption}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-contain"
        style={objectPosition ? { objectPosition } : undefined}
      />
      {caption ? (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-xs font-medium text-white">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
