import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/services/settings-service";
import { getPlaceholderImageUrl } from "@/lib/utils/placeholder-image";

/** Homepage-only "about" teaser, shown right above the gallery section. */
export async function HomeAboutSection() {
  const settings = await getSettings();
  const photoUrl = settings.aboutPhotoUrl || getPlaceholderImageUrl("zsana-portre", 800, 1000);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr_minmax(0,240px)] lg:items-center lg:gap-12">
        <div className="relative aspect-[4/5] w-full max-w-sm justify-self-center overflow-hidden rounded-2xl lg:justify-self-start">
          <Image src={photoUrl} alt="ZsaNa Photo" fill sizes="(max-width: 1024px) 80vw, 380px" className="object-cover" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-r from-transparent to-background lg:block"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">ZsaNa Photo</p>
          <h2 className="mt-3 font-display text-3xl text-accent-dark sm:text-4xl">
            A fotós, aki a pillanatot keresi
          </h2>
          <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start">
            <span className="h-px w-10 bg-accent/30" aria-hidden="true" />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-accent" aria-hidden="true">
              <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 3.1c0 5.4-7.5 10-7.5 10Z" />
            </svg>
            <span className="h-px w-10 bg-accent/30" aria-hidden="true" />
          </div>
          <p className="mt-4 text-foreground/70 leading-relaxed">
            Zsani vagyok, a ZsaNa Photo megálmodója. Számomra a fotózás nem csak munka, hanem szenvedély.
            Szeretem a természetes pillanatokat, az őszinte mosolyokat és azokat a kis részleteket, amik
            igazán különlegessé teszik az emlékeket.
          </p>
          <Link
            href="/rolam"
            className="mt-6 inline-flex min-h-11 items-center gap-1 rounded-full bg-accent px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-accent-dark"
          >
            Több rólam »
          </Link>
        </div>

        <div className="text-center lg:text-right">
          <p className="font-script text-3xl leading-snug text-accent sm:text-4xl">
            „A legszebb képek a szívvel készülnek.”
          </p>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="mx-auto mt-3 text-accent lg:ml-auto lg:mr-0"
            aria-hidden="true"
          >
            <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 3.1c0 5.4-7.5 10-7.5 10Z" />
          </svg>
          <p className="mt-2 font-script text-3xl text-accent-dark">Zsani</p>
        </div>
      </div>
    </section>
  );
}
