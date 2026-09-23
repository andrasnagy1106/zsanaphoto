import Link from "next/link";

const FEATURES = [
  {
    label: "Természetes, őszinte képek",
    icon: (
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1-1.6A1.5 1.5 0 0 1 10.6 3.6h2.8a1.5 1.5 0 0 1 1.3.8l1 1.6h1.8A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
    ),
  },
  {
    label: "Gyermekbarát légkör",
    icon: (
      <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 3.1c0 5.4-7.5 10-7.5 10Z" />
    ),
  },
  {
    label: "Minőségi utómunka",
    icon: <path d="M12 3.5 15 9l6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 9.9 9 9l3-5.5Z" />,
  },
  {
    label: "Egyedi, időtálló emlékek",
    icon: (
      <path d="M12 4c1.8-1.6 4.6-1.7 6.2.5 1.5 2.1.9 5.2-1.6 8.3-1.7 2.1-3.7 3.7-4.6 4.4-.9-.7-2.9-2.3-4.6-4.4C4.9 9.7 4.3 6.6 5.8 4.5 7.4 2.3 10.2 2.4 12 4Z" />
    ),
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24">
      <div className="border-t border-b border-border bg-background">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {FEATURES.map((feature) => (
            <div key={feature.label} className="flex items-center justify-center gap-3 lg:px-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-accent" aria-hidden="true">
                {feature.icon}
              </svg>
              <span className="text-sm font-medium text-foreground/80">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-footer text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-3xl italic">Kapcsolat</p>

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-8">
              <a href="tel:+36302133039" className="flex items-center gap-2 hover:text-white/80">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1a1 1 0 0 1 1-.25c1.1.36 2.3.55 3.5.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.6a1 1 0 0 1 1 1c0 1.2.2 2.4.55 3.5a1 1 0 0 1-.25 1L6.6 10.8Z" />
                </svg>
                06 30 213 3039
              </a>
              <a href="mailto:zsanaphoto@gmail.com" className="flex items-center gap-2 hover:text-white/80">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                zsanaphoto@gmail.com
              </a>
            </div>

            <div className="flex flex-col items-center gap-3 sm:items-end">
              <div className="flex items-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="flex size-8 items-center justify-center rounded-full border border-white/30 hover:bg-white/10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.9.3-1.5 1.6-1.5H16.5V4.3C16.2 4.3 15.2 4.2 14 4.2c-2.3 0-3.9 1.4-3.9 4v2.3H7.6v3H10.1V21h3.4Z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="flex size-8 items-center justify-center rounded-full border border-white/30 hover:bg-white/10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              </div>
              <p className="font-display italic text-sm text-white/70">
                Pillanatok, amik örökre megmaradnak...
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© {year} ZsaNa Photo. Minden jog fenntartva.</p>
            <div className="flex gap-4">
              <Link href="/adatvedelem" className="hover:text-white">Adatvédelem</Link>
              <Link href="/aszf" className="hover:text-white">ÁSZF</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
