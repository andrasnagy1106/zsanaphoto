import type { Service } from "@/db/schema";
import { formatPrice } from "@/lib/photo-order-catalog";

type PricedService = Service & { effectivePrice: number };

interface ServiceStepProps {
  services: PricedService[];
  onSelect: (service: PricedService) => void;
}

export function ServiceStep({ services, onSelect }: ServiceStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => onSelect(service)}
          className="min-h-11 rounded-xl border border-border bg-white/60 p-6 text-left transition-colors hover:border-accent"
        >
          <p className="font-display text-xl text-foreground">{service.name}</p>
          <p className="mt-2 text-sm text-foreground/70">
            {service.description ?? `${service.durationMinutes} perces időpontfoglalás.`}
          </p>
          <p className="mt-4 font-semibold text-accent">{formatPrice(service.effectivePrice)}</p>
        </button>
      ))}
    </div>
  );
}
