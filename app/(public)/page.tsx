import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/public/Hero";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/public/ServiceCard";
import { getPlaceholderImageUrl } from "@/lib/utils/placeholder-image";
import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import { getFeaturedGalleryPhotos } from "@/lib/services/gallery-service";

const HOW_IT_WORKS = [
  { title: "Válassz szolgáltatást", description: "Családi vagy intézményi fotózás." },
  { title: "Foglalj időpontot", description: "Nézd meg a szabad időpontokat, és válassz egyet." },
  { title: "Kapj visszaigazolást", description: "E-mailben értesítünk a foglalás állapotáról." },
  { title: "Élvezd a fotózást", description: "A megbeszélt időpontban várunk szeretettel." },
];

export default async function HomePage() {
  const featuredPhotos = await getFeaturedGalleryPhotos(GALLERY_CATEGORIES.slice(0, 8));

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Szolgáltatások" title="Miben segíthetek?" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <ServiceCard
            index={0}
            title="Családi fotózás"
            description="Természetes, oldott hangulatú fotózás a családodról, otthon vagy a szabadban."
            href="/csaladi-fotozas"
            ctaLabel="Részletek és időpontfoglalás"
          />
          <ServiceCard
            index={1}
            title="Intézményi fotózás"
            description="Óvodák, iskolák és cégek csoportos fotózása, személyes egyeztetéssel."
            href="/intezmenyi-fotozas"
            ctaLabel="Részletek és időpontfoglalás"
          />
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading eyebrow="Portfólió" title="Válogatott referenciafotók" />
          <div className="mt-8">
            <PhotoGrid photos={featuredPhotos} />
          </div>
          <div className="mt-8">
            <Link href="/galeria" className="text-sm font-semibold text-accent hover:text-accent-dark">
              Teljes galéria megtekintése →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="Rólam" title="A fotós, aki a pillanatot keresi" />
            <p className="mt-4 text-foreground/70 leading-relaxed">
              Több éve fotózok családokat és intézményeket, célom, hogy természetes, őszinte pillanatok
              maradjanak meg évtizedekre. Minden fotózás egyedi, a ti tempótokhoz igazodva.
            </p>
            <Link
              href="/rolam"
              className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:text-accent-dark"
            >
              Tudj meg többet rólam →
            </Link>
          </div>
          <div className="max-w-xs justify-self-center lg:justify-self-end">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border">
              <Image
                src={getPlaceholderImageUrl("zsana-portre", 600, 800)}
                alt=""
                fill
                sizes="(max-width: 1024px) 60vw, 320px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading align="center" eyebrow="Folyamat" title="Hogyan működik?" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-border bg-white/60 p-5">
                <span className="font-display text-2xl text-accent">{index + 1}</span>
                <p className="mt-2 font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-sm text-foreground/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <SectionHeading align="center" title="Foglalj időpontot még ma" />
        <div className="mt-8">
          <Link
            href="/idopontfoglalas"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Időpontot foglalok
          </Link>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading eyebrow="Kapcsolat" title="Kérdésed van?" />
          <p className="mt-4 max-w-xl text-foreground/70 leading-relaxed">
            Írj bátran, vagy nézd meg az elérhetőségeimet a kapcsolati oldalon.
          </p>
          <Link
            href="/kapcsolat"
            className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:text-accent-dark"
          >
            Kapcsolati adatok →
          </Link>
        </div>
      </section>
    </>
  );
}
