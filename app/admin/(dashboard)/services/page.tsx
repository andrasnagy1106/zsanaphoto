import { listServices } from "@/lib/services/service-service";
import { listServiceAvailabilityRules } from "@/lib/services/availability-rule-service";
import { ServiceEditForm } from "@/components/admin/ServiceEditForm";
import { CreateServiceModal } from "@/components/admin/CreateServiceModal";

export default async function AdminServicesPage() {
  const services = await listServices();

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
            Állítsd be a fotózási szolgáltatások alapadatait, érvényességi idejét és egyedi elérhetőségeit.
          </p>
        </div>
        <CreateServiceModal />
      </div>

      <div className="mt-6 space-y-6">
        {servicesWithRules.map(({ service, customRules }) => (
          <ServiceEditForm key={service.id} service={service} customRules={customRules} />
        ))}
      </div>
    </div>
  );
}
