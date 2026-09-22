import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg text-foreground">ZsaNa Photo</p>
            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
              Emlékek, amiket jó újra és újra megnézni. Családi és intézményi fotózás.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Navigáció</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li><Link className="hover:text-accent" href="/csaladi-fotozas">Családi fotózás</Link></li>
              <li><Link className="hover:text-accent" href="/intezmenyi-fotozas">Intézményi fotózás</Link></li>
              <li><Link className="hover:text-accent" href="/galeria">Galéria</Link></li>
              <li><Link className="hover:text-accent" href="/rolam">Rólam</Link></li>
              <li><Link className="hover:text-accent" href="/idopontfoglalas">Időpontfoglalás</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Kapcsolat</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li><Link className="hover:text-accent" href="/kapcsolat">Kapcsolati adatok</Link></li>
              <li><Link className="hover:text-accent" href="/adatvedelem">Adatvédelem</Link></li>
              <li><Link className="hover:text-accent" href="/aszf">ÁSZF</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs text-foreground/50">
          © {new Date().getFullYear()} ZsaNa Photo. Minden jog fenntartva.
        </p>
      </div>
    </footer>
  );
}
