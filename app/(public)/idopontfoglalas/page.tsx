import type { Metadata } from "next";
import { listActiveServices } from "@/lib/services/service-service";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Fotózás időpontfoglalás Sárbogárdon",
  description: "Foglalj online időpontot családi vagy intézményi fotózásra Sárbogárdon és környékén a ZsaNa Photo-nál.",
  alternates: { canonical: "/idopontfoglalas" },
};

// Always reflect the latest service configuration (active flag, approval mode) from the admin.
export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const services = await listActiveServices();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading level="h1" eyebrow="Foglalás" title="Időpontfoglalás" />
      <div className="mt-10">
        <BookingWizard services={services} />
      </div>
    </div>
  );
}
