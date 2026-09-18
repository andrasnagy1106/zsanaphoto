import type { Service } from "@/db/schema";
import { FAMILY_SERVICE_SLUG, INSTITUTION_SERVICE_SLUG } from "@/lib/constants";

interface ServiceStepProps {
  services: Service[];
  onSelect: (service: Service) => void;
}

export function ServiceStep({ services, onSelect }: ServiceStepProps) {
  const family = services.find((s) => s.slug === FAMILY_SERVICE_SLUG);
  const institution = services.find((s) => s.slug === INSTITUTION_SERVICE_SLUG);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {family ? (
        <button
          type="button"
          onClick={() => onSelect(family)}
          className="min-h-11 rounded-xl border border-border bg-white/60 p-6 text-left transition-colors hover:border-accent"
        >
          <p className="font-display text-xl text-foreground">Családi fotózás</p>
          <p className="mt-2 text-sm text-foreground/70">Online időpontfoglalás, azonnali vagy gyors visszaigazolással.</p>
        </button>
      ) : null}

      {institution ? (
        <button
          type="button"
          onClick={() => onSelect(institution)}
          className="min-h-11 rounded-xl border border-border bg-white/60 p-6 text-left transition-colors hover:border-accent"
        >
          <p className="font-display text-xl text-foreground">Intézményi fotózás</p>
          <p className="mt-2 text-sm text-foreground/70">Ajánlatkérés óvodák, iskolák és cégek számára.</p>
        </button>
      ) : null}
    </div>
  );
}
