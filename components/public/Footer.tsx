import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24">
      <div className="bg-footer text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <p className="font-script text-5xl">Kapcsolat</p>
              <div className="hidden h-12 w-px bg-white/30 sm:block" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-3 text-sm sm:gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Időpontfoglalás / Elérhetőség
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
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
            </div>

            <div className="flex flex-col items-center gap-3 sm:items-end">
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/p/ZsaNa-Photo-100076261230439/"
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
                  href="https://www.instagram.com/zsana.photo/"
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
              <p className="font-script text-2xl text-white/70">
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
