import type { Metadata } from "next";
import Link from "next/link";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getServicePagePhotos } from "@/lib/services/gallery-service";

export const metadata: Metadata = {
  title: "Iskolai fotózás Sárbogárdon",
  description: "Iskolai fotózás Sárbogárdon és környékén: egyéni portrék és osztályképek, az iskola időbeosztásához igazodva.",
  alternates: { canonical: "/iskolai-fotozas" },
};

export default async function SchoolPhotographyPage() {
  const featuredPhotos = await getServicePagePhotos("oldal:iskolai-fotozas", [
    "Bölcsi-óvoda-iskola",
    "Rendezvények",
    "Szülinapi",
    "Karácsonyi",
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        level="h1"
        eyebrow="Szolgáltatás"
        title="Iskolai fotózás"
        description="Iskolai fotózás Sárbogárdon és környékén: igényes portrék és osztályképek, osztályonként vagy az egész iskolának."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>
            Az iskolai fotózás során egyéni portrék és osztályképek is készülnek, természetes,
            oldott hangulatban — nem gépies sorozatgyártásban, hanem odafigyeléssel.
          </p>
          <p>
            A fotózás időpontját és menetét az iskolával közösen tervezzük meg, hogy minden osztály
            zökkenőmentesen sorra kerülhessen.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Egyéni portrék és osztályképek</li>
            <li>A részletek személyes egyeztetése az iskolával</li>
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
