import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Kapcsolat - fotózás Sárbogárdon",
  description: "Lépj kapcsolatba a ZsaNa Photo-val családi vagy intézményi fotózás ügyében Sárbogárdon és környékén. Telefon, e-mail és online foglalás.",
  alternates: { canonical: "/kapcsolat" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading level="h1" eyebrow="Kapcsolat" title="Vegyük fel a kapcsolatot" />

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white/60 p-6">
          <h2 className="font-display text-xl text-foreground">Elérhetőségek</h2>
          <dl className="mt-4 space-y-2 text-sm text-foreground/70">
            <div>
              <dt className="font-medium text-foreground">E-mail</dt>
              <dd><a className="hover:text-accent" href="mailto:zsanaphoto@gmail.com">zsanaphoto@gmail.com</a></dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Telefon</dt>
              <dd><a className="hover:text-accent" href="tel:+36302133039">+36 30 213 3039</a></dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Helyszín</dt>
              <dd>Sárbogárd és környéke</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-white/60 p-6">
          <h2 className="font-display text-xl text-foreground">Mit szeretnél?</h2>
          <p className="mt-3 text-sm text-foreground/70">
            Családi és intézményi fotózásra is online tudsz időpontot foglalni.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/idopontfoglalas"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              Időpontot foglalok
            </Link>
            <Link
              href="/portre-fotozas"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
            >
              Portré fotózás
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
