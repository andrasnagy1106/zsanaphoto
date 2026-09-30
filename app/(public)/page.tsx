import { Hero } from "@/components/public/Hero";
import { HomeAboutSection } from "@/components/public/HomeAboutSection";
import { HomeGallerySection } from "@/components/public/HomeGallerySection";
import { HomeInfoBanner } from "@/components/public/HomeInfoBanner";
import { HomeServicesSection } from "@/components/public/HomeServicesSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getHomeTexts } from "@/lib/services/home-text-service";

const STEP_NUMBERS = [1, 2, 3, 4] as const;

export default async function HomePage() {
  const texts = await getHomeTexts();

  return (
    <>
      <Hero />

      <HomeInfoBanner
        badge={texts["infoBanner.badge"]}
        title={texts["infoBanner.title"]}
        content={texts["infoBanner.content"]}
        buttonText={texts["infoBanner.buttonText"]}
        buttonUrl={texts["infoBanner.buttonUrl"]}
      />

      <HomeServicesSection />

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading align="center" eyebrow={texts["steps.eyebrow"]} title={texts["steps.title"]} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEP_NUMBERS.map((stepNumber) => (
              <div key={stepNumber} className="rounded-lg border border-border bg-white/60 p-5">
                <span className="font-display text-2xl text-accent">{stepNumber}</span>
                <p className="mt-2 font-semibold text-foreground">{texts[`steps.${stepNumber}.title`]}</p>
                <p className="mt-1 text-sm text-foreground/70">{texts[`steps.${stepNumber}.description`]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeAboutSection />
      <HomeGallerySection />
    </>
  );
}
