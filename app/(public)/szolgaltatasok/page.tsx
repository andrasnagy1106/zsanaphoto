import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/public/ServiceCard";

export const metadata: Metadata = {
  title: "Szolgáltatások",
  description: "Családi és intézményi fotózás természetes, időtálló képekkel.",
};

export default function ServicesOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Szolgáltatások"
        title="Miben segíthetek?"
        description="Válassz a szolgáltatásaim közül, majd foglalj magadnak vagy csoportodnak egy időpontot."
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <ServiceCard
          index={0}
          title="Családi fotózás"
          description="Természetes, oldott hangulatú fotózás a családodról, otthon vagy a szabadban."
          href="/csaladi-fotozas"
          ctaLabel="Részletek és időpontfoglalás"
        />
        <ServiceCard
          index={1}
          title="Intézményi fotózás"
          description="Óvodák, iskolák és cégek csoportos fotózása, személyes egyeztetéssel."
          href="/intezmenyi-fotozas"
          ctaLabel="Részletek és időpontfoglalás"
        />
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
