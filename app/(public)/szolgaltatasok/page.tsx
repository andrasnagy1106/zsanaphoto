import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/public/ServiceCard";
import { HOME_SERVICE_CARDS } from "@/lib/home-service-cards";
import { getSitePhotoUrls } from "@/lib/services/site-photo-service";

export const metadata: Metadata = {
  title: "Szolgáltatások",
  description: "Családi és intézményi fotózás természetes, időtálló képekkel.",
};

export default async function ServicesOverviewPage() {
  const photoUrlsByKey = await getSitePhotoUrls(HOME_SERVICE_CARDS.map((card) => card.key));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Szolgáltatások"
        title="Miben segíthetek?"
        description="Válassz a szolgáltatásaim közül, majd foglalj magadnak vagy csoportodnak egy időpontot."
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {HOME_SERVICE_CARDS.map((card, index) => (
          <ServiceCard
            key={card.key}
            index={index}
            title={card.title}
            description={card.description}
            href={card.href}
            ctaLabel="Tovább"
            imageUrl={photoUrlsByKey[card.key]}
          />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/idopontfoglalas"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          Időpontot foglalok
        </Link>
      </div>
    </div>
  );
}
