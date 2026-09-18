import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Rólam",
  description: "Ismerd meg a Zsana Photo mögött álló fotóst.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div>
          <SectionHeading eyebrow="Rólam" title="Sziasztok, Zsana vagyok" />
          <div className="mt-6 space-y-4 text-foreground/70 leading-relaxed">
            <p>
              Több éve fotózok családokat és intézményeket, és minden alkalommal ugyanaz a célom:
              olyan képeket készíteni, amiket évekkel később is örömmel néztek vissza.
            </p>
            <p>
              Számomra fontos a nyugodt, oldott légkör — nem erőltetett pózokra, hanem valódi
              pillanatokra vadászunk együtt.
            </p>
          </div>
          <Link
            href="/idopontfoglalas"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Időpontot foglalok
          </Link>
        </div>
        <div className="aspect-[3/4] rounded-xl border border-border bg-gradient-to-br from-[#efe6da] to-[#c9b8a3]" />
      </div>
    </div>
  );
}
