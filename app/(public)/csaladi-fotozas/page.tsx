import type { Metadata } from "next";
import Link from "next/link";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Családi fotózás",
  description:
    "Természetes, oldott hangulatú családi fotózás. Foglalj online időpontot pár kattintással.",
};

export default function FamilyPhotographyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Szolgáltatás"
        title="Családi fotózás"
        description="Oldott, természetes pillanatok rólad és a családodról, akár stúdióban, akár a szabadban."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>
            A családi fotózás során nem beállított, mesterséges pózokra törekszem, hanem arra, hogy
            átélhessétek azt az időt, amit együtt töltötök — a képek pedig maguktól születnek.
          </p>
          <p>
            Az időpontfoglalás teljesen online történik: válassz napot és időpontot, add meg az
            adataidat, majd — a szolgáltatás beállításától függően — azonnal vagy jóváhagyás után
            visszaigazolást kapsz e-mailben.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Időtartam: kb. 60 perc</li>
            <li>Helyszín: stúdió vagy külső helyszín, egyeztetés szerint</li>
            <li>Digitális képek átadása a fotózást követően</li>
          </ul>
          <Link
            href="/idopontfoglalas"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Időpontot foglalok
          </Link>
        </div>

        <PhotoGrid limit={4} />
      </div>
    </div>
  );
}
