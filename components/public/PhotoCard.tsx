const GRADIENTS = [
  ["#efe6da", "#c9b8a3"],
  ["#f1e7de", "#b3122b22"],
  ["#e9e2d6", "#8f0e2222"],
  ["#f4ede3", "#d8c7ad"],
  ["#ece3d6", "#c2ab8c"],
  ["#f0e8dd", "#b3122b1a"],
];

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
 * Renders an elegant placeholder in place of a real reference photo.
 * Swap these out for actual photography before launch.
 */
export function PhotoCard({ caption, index = 0, aspect = "portrait" }: PhotoCardProps) {
  const [from, to] = GRADIENTS[index % GRADIENTS.length];

  return (
    <figure className={`group relative overflow-hidden rounded-lg border border-border ${ASPECT_CLASSES[aspect]}`}>
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill={`url(#grad-${index})`} />
        <circle cx="200" cy="170" r="70" fill="#ffffff" fillOpacity="0.25" />
        <rect x="120" y="250" width="160" height="18" rx="9" fill="#ffffff" fillOpacity="0.35" />
      </svg>
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-xs font-medium text-white">
        {caption}
      </figcaption>
    </figure>
  );
}
