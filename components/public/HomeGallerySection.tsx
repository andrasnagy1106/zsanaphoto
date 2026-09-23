import Link from "next/link";
import { PhotoCard } from "./PhotoCard";
import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import { getFeaturedGalleryPhotos } from "@/lib/services/gallery-service";

const FEATURES = [
  {
    label: "Természetes, őszinte képek",
    icon: (
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1-1.6A1.5 1.5 0 0 1 10.6 3.6h2.8a1.5 1.5 0 0 1 1.3.8l1 1.6h1.8A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
    ),
  },
  {
    label: "Gyermekbarát légkör",
    icon: (
      <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 3.1c0 5.4-7.5 10-7.5 10Z" />
    ),
  },
  {
    label: "Minőségi utómunka",
    icon: <path d="M12 3.5 15 9l6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 9.9 9 9l3-5.5Z" />,
  },
  {
    label: "Egyedi, időtálló emlékek",
    icon: (
      <path d="M12 4c1.8-1.6 4.6-1.7 6.2.5 1.5 2.1.9 5.2-1.6 8.3-1.7 2.1-3.7 3.7-4.6 4.4-.9-.7-2.9-2.3-4.6-4.4C4.9 9.7 4.3 6.6 5.8 4.5 7.4 2.3 10.2 2.4 12 4Z" />
    ),
  },
];

/** Homepage-only gallery teaser + feature highlights, shown directly above the footer. */
export async function HomeGallerySection() {
  const featuredPhotos = await getFeaturedGalleryPhotos(GALLERY_CATEGORIES.slice(0, 6));

  return (
    <div className="border-t border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-accent">Galéria</p>
            <h2 className="font-display text-2xl text-foreground sm:text-3xl">Nézz körül a galériában</h2>
          </div>
          <Link href="/galeria" className="text-sm font-semibold text-accent hover:text-accent-dark">
            Galéria megnyitása →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {featuredPhotos.map((photo) => (
            <PhotoCard
              key={photo.id ?? photo.category}
              caption={photo.caption}
              src={photo.src}
              index={GALLERY_CATEGORIES.indexOf(photo.category)}
              aspect="square"
            />
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-0 lg:divide-x-2 lg:divide-accent">
        {FEATURES.map((feature) => (
          <div key={feature.label} className="flex flex-col items-center gap-3 text-center lg:px-6">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="shrink-0 text-accent" aria-hidden="true">
              {feature.icon}
            </svg>
            <span className="max-w-[9rem] text-sm font-medium leading-snug text-foreground/80">{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
