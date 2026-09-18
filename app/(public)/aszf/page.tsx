import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "ÁSZF",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Jogi" title="Általános szerződési feltételek" />
      <p className="mt-6 text-foreground/70 leading-relaxed">
        Ez az oldal jelenleg helykitöltő. A végleges általános szerződési feltételek hamarosan
        elérhetők lesznek.
      </p>
    </div>
  );
}
