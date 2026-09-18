import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Adatvédelem",
  robots: { index: false, follow: false },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Jogi" title="Adatvédelmi tájékoztató" />
      <p className="mt-6 text-foreground/70 leading-relaxed">
        Ez az oldal jelenleg helykitöltő. A végleges adatvédelmi tájékoztató hamarosan elérhető lesz.
      </p>
    </div>
  );
}
