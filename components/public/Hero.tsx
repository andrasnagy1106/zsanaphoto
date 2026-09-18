import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(179,18,43,0.08),transparent_60%),radial-gradient(circle_at_80%_0%,rgba(179,18,43,0.06),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-accent">Zsana Photo</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Emlékek, amiket jó újra és újra megnézni.
          </h1>
          <p className="mt-6 text-lg text-foreground/70 leading-relaxed">
            Családi és intézményi fotózás természetes, időtálló képekkel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/idopontfoglalas"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
            >
              Időpontot foglalok
            </Link>
            <Link
              href="/csaladi-fotozas"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white/60 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Családi fotózás
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
