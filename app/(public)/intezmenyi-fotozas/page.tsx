import type { Metadata } from "next";
import Link from "next/link";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import { getFeaturedGalleryPhotos } from "@/lib/services/gallery-service";

export const metadata: Metadata = {
  title: "Intézményi fotózás",
  description:
    "Óvodai, iskolai és céges csoportos fotózás. Foglalj online időpontot pár kattintással.",
};

export default async function InstitutionPhotographyPage() {
  const featuredPhotos = await getFeaturedGalleryPhotos(GALLERY_CATEGORIES.slice(0, 4));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Szolgáltatás"
        title="Intézményi fotózás"
        description="Óvodák, iskolák és cégek csoportos fotózása, az intézmény igényeihez igazítva."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>
            Az intézményi fotózás óvodák, iskolák és cégek számára kínál természetes, egységes
            képi világot, a személyes egyeztetés során kialakított részletek szerint.
          </p>
          <p>
            Az időpontfoglalás online történik: válassz napot és időpontot, add meg az adataidat,
            majd a foglalás jóváhagyása után e-mailben visszaigazolást kapsz.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Óvodai, iskolai és céges fotózás</li>
            <li>A részletek személyes egyeztetése az intézménnyel</li>
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
