import type { Metadata } from "next";
import { InstitutionInquiryForm } from "@/components/public/InstitutionInquiryForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Intézményi fotózás",
  description:
    "Óvodai, iskolai és céges csoportos fotózás. Kérj egyedi ajánlatot pár kattintással.",
};

export default function InstitutionPhotographyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Szolgáltatás"
        title="Intézményi fotózás"
        description="Óvodák, iskolák és cégek csoportos fotózása, egyedi igények szerint. Az időpont és a részletek egyeztetése a küldött érdeklődés alapján történik."
      />

      <div className="mt-10 max-w-2xl rounded-xl border border-border bg-white/60 p-6 sm:p-8">
        <InstitutionInquiryForm />
      </div>
    </div>
  );
}
