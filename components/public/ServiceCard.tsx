import Image from "next/image";
import Link from "next/link";
import { getPlaceholderImageUrl } from "@/lib/utils/placeholder-image";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  index?: number;
}

export function ServiceCard({ title, description, href, ctaLabel, index = 0 }: ServiceCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white/60">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={getPlaceholderImageUrl(`zsana-service-${index}`, 800, 600)}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <h3 className="font-display text-2xl text-foreground">{title}</h3>
        <p className="mt-3 flex-1 text-foreground/70 leading-relaxed">{description}</p>
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-accent hover:text-accent-dark"
        >
          {ctaLabel}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
