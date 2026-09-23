import type { Metadata } from "next";
import Link from "next/link";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getFeaturedGalleryPhotos } from "@/lib/services/gallery-service";

export const metadata: Metadata = {
  title: "Bölcsődei & óvodai fotózás",
  description:
    "Gyermekfotózás szeretettel, türelemmel és természetesen bölcsődékben és óvodákban. Foglalj online időpontot.",
};

export default async function NurserySchoolPhotographyPage() {
  const featuredPhotos = await getFeaturedGalleryPhotos([
    "Bölcsi-óvoda-iskola",
    "Karácsonyi",
    "Anyáknapi",
    "Szülinapi",
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Szolgáltatás"
        title="Bölcsődei & óvodai fotózás"
        description="Gyermekfotózás szeretettel, türelemmel és természetesen — a gyerekek tempójához igazodva."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>
            A legkisebbek fotózása különleges figyelmet igényel: játékos, nyugodt légkörben dolgozom,
            hogy a gyerekek természetesen, felszabadultan mosolyogjanak a kamerába.
          </p>
          <p>
            Az intézménnyel közösen egyeztetjük a részleteket (helyszín, időbeosztás, csoportok), majd
            a fotózás után a szülők online is hozzáférhetnek a képekhez.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Egyéni és csoportos portrék bölcsődékben, óvodákban</li>
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
