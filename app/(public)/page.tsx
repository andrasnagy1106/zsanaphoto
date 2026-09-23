import Link from "next/link";
import { Hero } from "@/components/public/Hero";
import { HomeAboutSection } from "@/components/public/HomeAboutSection";
import { HomeGallerySection } from "@/components/public/HomeGallerySection";
import { HomeServicesSection } from "@/components/public/HomeServicesSection";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import { getFeaturedGalleryPhotos } from "@/lib/services/gallery-service";

const HOW_IT_WORKS = [
  { title: "Válassz szolgáltatást", description: "Családi vagy intézményi fotózás." },
  { title: "Foglalj időpontot", description: "Nézd meg a szabad időpontokat, és válassz egyet." },
  { title: "Kapj visszaigazolást", description: "E-mailben értesítünk a foglalás állapotáról." },
  { title: "Élvezd a fotózást", description: "A megbeszélt időpontban várunk szeretettel." },
];

export default async function HomePage() {

  return (
    <>
      <Hero />

      <HomeServicesSection />

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

      <HomeAboutSection />
      <HomeGallerySection />
    </>
  );
}
