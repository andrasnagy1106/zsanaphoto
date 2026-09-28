import Image from "next/image";
import Link from "next/link";
import { toObjectPosition } from "@/lib/utils/photo-layout";
import { getPlaceholderImageUrl } from "@/lib/utils/placeholder-image";
import type { SitePhotoView } from "@/lib/services/site-photo-service";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  photo?: SitePhotoView | null;
  index?: number;
}

export function ServiceCard({ title, description, href, ctaLabel, photo, index = 0 }: ServiceCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white/60">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={photo?.url || getPlaceholderImageUrl(`zsana-service-${index}`, 800, 600)}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
          style={photo ? { objectPosition: toObjectPosition(photo.focusX, photo.focusY) } : undefined}
        />
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <h3 className="font-display text-2xl text-foreground">{title}</h3>
        <p className="mt-3 flex-1 text-foreground/70 leading-relaxed">{description}</p>
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 w-fit items-center gap-1 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          {ctaLabel}
          <span aria-hidden="true">»</span>
        </Link>
      </div>
    </div>
  );
}
