import Image from "next/image";
import Link from "next/link";
import { getSitePhotoUrls } from "@/lib/services/site-photo-service";
import { getPlaceholderImageUrl } from "@/lib/utils/placeholder-image";

export async function Hero() {
  const sitePhotos = await getSitePhotoUrls(["hero"]);
  const heroPhotoUrl = sitePhotos["hero"] || getPlaceholderImageUrl("zsana-hero-banner", 1920, 1080);

  return (
    <section className="relative overflow-hidden min-h-[560px] sm:min-h-[640px] lg:min-h-[720px] flex items-center bg-[#2a040b]">
      {/* Background Hero Image */}
      <div className="absolute inset-0">
        <Image
          src={heroPhotoUrl}
          alt="ZsaNa Photo - Emlékek, amiket jó újra és újra megnézni"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right sm:object-center"
        />
        {/* Dark Burgundy & Black Gradient Overlay for readability on the left */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#2a040b]/95 via-[#2a040b]/75 to-[#2a040b]/40 sm:bg-gradient-to-r sm:from-[#2a040b]/95 sm:via-[#2a040b]/70 sm:via-50% sm:to-transparent"
        />
      </div>

      {/* Floating Top-Right Script Note */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute top-6 right-6 lg:top-10 lg:right-14 xl:right-20 hidden md:flex flex-col items-center justify-center text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
      >
        <p className="font-script text-2xl sm:text-3xl lg:text-4xl leading-tight text-center">
          Több<br />
          <span className="text-xl sm:text-2xl lg:text-3xl font-light">mint fotózás...</span><br />
          <span className="text-3xl sm:text-4xl lg:text-5xl">Érzés.</span>
        </p>
        <svg
          className="mt-1.5 w-6 h-6 text-white/95 drop-shadow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>

      {/* Hero Content Container */}
      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="max-w-xl lg:max-w-2xl text-left">
          {/* Script Titles */}
          <h1 className="font-script text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            Emlékek,
          </h1>
          <p className="font-script text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white/95 mt-1 sm:mt-2 leading-tight drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
            amiket jó újra és újra megnézni.
          </p>

          {/* Ornamental Divider with Heart */}
          <div className="flex items-center gap-2 my-5 sm:my-6 text-white/80">
            <svg className="w-16 sm:w-28 h-5" viewBox="0 0 100 20" fill="none">
              <path
                d="M0 10 Q 50 10 90 4 Q 96 2 100 12"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <svg
              className="w-5 h-5 text-white shrink-0 drop-shadow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <svg className="w-16 sm:w-28 h-5" viewBox="0 0 100 20" fill="none">
              <path
                d="M100 10 Q 50 10 10 4 Q 4 2 0 12"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-white/95 font-light leading-relaxed max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            Családi és intézményi fotózás természetes, időtálló képekkel.
          </p>

          {/* Action Buttons */}
          <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3.5 sm:gap-4">
            <Link
              href="/csaladi-fotozas"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#670c18] border border-white/25 px-6 sm:px-8 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-xl transition-all duration-200 hover:bg-[#520913] hover:scale-105 active:scale-95"
            >
              <span>Családi fotózás</span>
              <span aria-hidden="true" className="text-xs font-bold">›</span>
            </Link>
            <Link
              href="/intezmenyi-fotozas"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#fbfaf8] border border-transparent px-6 sm:px-8 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#670c18] shadow-xl transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95"
            >
              <span>Intézményi fotózás</span>
              <span aria-hidden="true" className="text-xs font-bold">›</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
