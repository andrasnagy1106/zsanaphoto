import type { Service } from "@/db/schema";

interface ServiceStepProps {
  services: Service[];
  onSelect: (service: Service) => void;
}

export function ServiceStep({ services, onSelect }: ServiceStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {services.map((service) =>
        service.onlineBookingEnabled ? (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className="min-h-11 rounded-xl border border-border bg-white/60 p-6 text-left transition-colors hover:border-accent"
          >
            <p className="font-display text-xl text-foreground">{service.name}</p>
            <p className="mt-2 text-sm text-foreground/70">
              {service.description || `${service.durationMinutes} perces időpontfoglalás.`}
            </p>
          </button>
        ) : (
          <div
            key={service.id}
            className="min-h-11 rounded-xl border border-border bg-white/60 p-6 text-left"
          >
            <p className="font-display text-xl text-foreground">{service.name}</p>
            <p className="mt-2 text-sm text-foreground/70">
              {service.description || "Ehhez a szolgáltatáshoz telefonon egyeztethető időpont."}
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">Online foglalás nem elérhető.</p>
            <a className="mt-2 inline-block text-sm font-semibold text-accent" href="tel:+36302133039">
              Telefonos egyeztetés: +36 30 213 3039
            </a>
          </div>
        ),
      )}
    </div>
  );
}
