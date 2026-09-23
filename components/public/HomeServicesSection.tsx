import { ServiceCard } from "./ServiceCard";
import { HOME_SERVICE_CARDS } from "@/lib/home-service-cards";
import { getSitePhotoUrls } from "@/lib/services/site-photo-service";

/** Homepage-only "Miben segíthetek?" services teaser with 4 admin-editable cards. */
export async function HomeServicesSection() {
  const photoUrlsByKey = await getSitePhotoUrls(HOME_SERVICE_CARDS.map((card) => card.key));

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="text-center">
        <h2 className="font-display text-4xl text-accent-dark sm:text-5xl">Miben segíthetek?</h2>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-accent/30" aria-hidden="true" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-accent" aria-hidden="true">
            <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 3.1c0 5.4-7.5 10-7.5 10Z" />
          </svg>
          <span className="h-px w-10 bg-accent/30" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.15em] text-accent/60">
          Válassz a szolgáltatásaim közül!
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
    </section>
  );
}
