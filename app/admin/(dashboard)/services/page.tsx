import { listServices } from "@/lib/services/service-service";
import { ServiceEditForm } from "@/components/admin/ServiceEditForm";

export default async function AdminServicesPage() {
  const services = await listServices();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Szolgáltatások</h1>
      <div className="mt-6 space-y-6">
        {services.map((service) => (
          <ServiceEditForm key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
