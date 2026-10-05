import { listServices } from "@/lib/services/service-service";
import { listServiceAvailabilityRules } from "@/lib/services/availability-rule-service";
import { ServiceEditForm } from "@/components/admin/ServiceEditForm";
import { CreateServiceModal } from "@/components/admin/CreateServiceModal";
import { AvailabilityCalendarsManager } from "@/components/admin/AvailabilityCalendarsManager";
import { listAvailabilityCalendars } from "@/lib/services/availability-calendar-service";
import { getSettings } from "@/lib/services/settings-service";

export default async function AdminServicesPage() {
  const [services, calendarsWithSlots, settings] = await Promise.all([
    listServices(),
    listAvailabilityCalendars(),
    getSettings(),
  ]);
  const calendars = calendarsWithSlots.map(({ calendar }) => calendar);

  const servicesWithRules = await Promise.all(
    services.map(async (service) => {
      const customRules = await listServiceAvailabilityRules(service.id);
      return { service, customRules };
    }),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">Szolgáltatások & Események</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Állítsd be a szolgáltatások adatait, fotó- és digitális árait, valamint az elérhetőségüket.
          </p>
        </div>
        <CreateServiceModal calendars={calendars} />
      </div>

      <div className="mt-6">
        <AvailabilityCalendarsManager calendars={calendarsWithSlots} />
      </div>

      <div className="mt-6 space-y-6">
        {servicesWithRules.map(({ service, customRules }) => (
          <ServiceEditForm
            key={service.id}
            service={service}
            customRules={customRules}
            calendars={calendars}
            defaultPhotoPrices={settings.defaultPhotoPrices}
          />
        ))}
      </div>
    </div>
  );
}
