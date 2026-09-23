import Image from "next/image";
import { getPlaceholderImageUrl } from "@/lib/utils/placeholder-image";

interface PhotoCardProps {
  caption: string;
  index?: number;
  aspect?: "square" | "portrait" | "landscape";
}

const ASPECT_CLASSES: Record<NonNullable<PhotoCardProps["aspect"]>, string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};

/**
 * Renders a neutral filler image in place of a real reference photo.
 * Swap these out for actual photography before launch.
 */
export function PhotoCard({ caption, index = 0, aspect = "portrait" }: PhotoCardProps) {
  return (
    <figure className={`group relative overflow-hidden rounded-lg border border-border ${ASPECT_CLASSES[aspect]}`}>
      <Image
        src={getPlaceholderImageUrl(`zsana-gallery-${index}`, 600, 800)}
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
