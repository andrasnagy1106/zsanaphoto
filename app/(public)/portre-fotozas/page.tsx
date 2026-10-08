import type { Metadata } from "next";
import Link from "next/link";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import { SERVICE_PAGE_PHOTO_COLLECTIONS } from "@/lib/service-page-photos";
import { getServicePagePhotos } from "@/lib/services/gallery-service";

export const metadata: Metadata = {
  title: "Portré fotózás Sárbogárdon",
  description:
    "Portré fotózás Sárbogárdon és környékén: természetes, személyre szabott portrék, amelyek megmutatják az egyéniségedet.",
  alternates: { canonical: "/portre-fotozas" },
};

export default async function PortraitPhotographyPage() {
  const collection = SERVICE_PAGE_PHOTO_COLLECTIONS.find((item) => item.href === "/portre-fotozas")!;
  const featuredPhotos = await getServicePagePhotos(collection.key, GALLERY_CATEGORIES.slice(0, 4));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        level="h1"
        eyebrow="Szolgáltatás"
        title="Portré fotózás"
        description="Portré fotózás Sárbogárdon és környékén: természetes, személyre szabott képek, amelyek igazán rólad szólnak."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>
            A portré fotózás során az egyéniséged és a természetes pillanatok kerülnek a középpontba.
            A fotózás részleteit személyesen egyeztetjük, hogy a képek a stílusodhoz és az elképzeléseidhez illeszkedjenek.
          </p>
          <p>
            Az időpontfoglalás online történik: válassz napot és időpontot, add meg az adataidat,
            majd a foglalás jóváhagyása után e-mailben visszaigazolást kapsz.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Egyéni portrék természetes hangulatban</li>
            <li>Személyre szabott fotózás, előzetes egyeztetéssel</li>
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