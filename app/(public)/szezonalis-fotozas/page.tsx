import type { Metadata } from "next";
import Link from "next/link";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getFeaturedGalleryPhotos } from "@/lib/services/gallery-service";

export const metadata: Metadata = {
  title: "Szezonális fotózás",
  description: "Karácsonyi, anyák napi és egyéb szezonális, ünnepi fotózások. Foglalj online időpontot.",
};

export default async function SeasonalPhotographyPage() {
  const featuredPhotos = await getFeaturedGalleryPhotos([
    "Karácsonyi",
    "Anyáknapi",
    "Rendezvények",
    "Szülinapi",
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Szolgáltatás"
        title="Szezonális fotózás"
        description="Karácsony, Anyák napja és különleges alkalmak — limitált idényjellegű időpontokkal."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>
            Az év ünnepi alkalmaira (karácsony, anyák napja és más különleges időszakok) tematikus,
            hangulatos mini fotózásokat tartok, ahol a lényeg a közös élmény és az emlék.
          </p>
          <p>
            Ezek az időpontok korlátozott számban, adott időszakokhoz kötve érhetők el — érdemes
            időben foglalni.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Tematikus, szezonális mini fotózások</li>
            <li>Rövidebb, kb. 20-30 perces időtartam</li>
            <li>Digitális képek átadása a fotózást követően</li>
          </ul>
          <Link
            href="/idopontfoglalas"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Időpontot foglalok
          </Link>
        </div>

        <PhotoGrid photos={featuredPhotos} />
      </div>
    </div>
  );
}
