import Image from "next/image";
import { getPlaceholderImageUrl } from "@/lib/utils/placeholder-image";

interface PhotoCardProps {
  caption: string;
  /** Real uploaded photo URL. When missing, a neutral filler image is shown instead. */
  src?: string | null;
  index?: number;
  aspect?: "square" | "portrait" | "landscape";
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
export function PhotoCard({ caption, src, index = 0, aspect = "portrait" }: PhotoCardProps) {
  const imageSrc = src || getPlaceholderImageUrl(`zsana-gallery-${index}`, 600, 800);

  return (
    <figure className={`group relative overflow-hidden rounded-lg border border-border ${ASPECT_CLASSES[aspect]}`}>
      <Image
        src={imageSrc}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-xs font-medium text-white">
        {caption}
      </figcaption>
    </figure>
  );
}
