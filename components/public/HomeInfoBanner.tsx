import Link from "next/link";
import { renderFormattedRichText } from "@/lib/utils/rich-text";

interface HomeInfoBannerProps {
  badge?: string;
  title?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export function HomeInfoBanner({
  badge,
  title,
  content,
  buttonText,
  buttonUrl,
}: HomeInfoBannerProps) {
  // If content is empty (or whitespace only), the entire banner is not rendered
  const trimmedContent = content?.trim();
  const trimmedTitle = title?.trim();
  const trimmedBadge = badge?.trim();

  if (!trimmedContent && !trimmedTitle) {
    return null;
  }

  const hasButton = Boolean(buttonText?.trim() && buttonUrl?.trim());
  const isExternalButton = buttonUrl?.startsWith("http://") || buttonUrl?.startsWith("https://");

  return (
    <section
      aria-label="Fontos információk"
      className="relative z-10 -mt-4 mb-4 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-r from-[#fff9f6] via-[#fbf7f4] to-[#fcf3ed] p-5 sm:p-7 shadow-lg shadow-accent/5 backdrop-blur">
          {/* Subtle decorative background element */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-accent/5 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-12 -bottom-12 size-40 rounded-full bg-accent/5 blur-2xl"
          />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
            {/* Left side: Icon + Content */}
            <div className="flex items-start gap-3.5 sm:gap-4.5 min-w-0">
              {/* Refined Icon container */}
              <div className="shrink-0 mt-0.5 flex size-10 sm:size-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark text-white shadow-md shadow-accent/20">
                <svg
                  className="size-5 sm:size-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>

              {/* Text content area */}
              <div className="min-w-0 flex-1 space-y-1.5">
                {trimmedBadge && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent border border-accent/20">
                      <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                      {trimmedBadge}
                    </span>
                  </div>
                )}

                {trimmedTitle && (
                  <h3 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight">
                    {trimmedTitle}
                  </h3>
                )}

                {trimmedContent && (
                  <div className="text-sm sm:text-base text-foreground/80 leading-relaxed font-normal">
                    {renderFormattedRichText(trimmedContent)}
                  </div>
                )}
              </div>
            </div>

            {/* Optional Call to Action Button */}
            {hasButton && buttonUrl && (
              <div className="shrink-0 flex items-center md:self-center pl-13 md:pl-0">
                {isExternalButton ? (
                  <a
                    href={buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-accent/20 transition-all hover:bg-accent-dark hover:scale-105 active:scale-95"
                  >
                    <span>{buttonText}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <Link
                    href={buttonUrl}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-accent/20 transition-all hover:bg-accent-dark hover:scale-105 active:scale-95"
                  >
                    <span>{buttonText}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
