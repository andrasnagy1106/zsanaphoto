import Link from "next/link";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  index?: number;
}

export function ServiceCard({ title, description, href, ctaLabel, index = 0 }: ServiceCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-white/60 p-6 sm:p-8">
      <div
        className="mb-5 h-1 w-12 rounded-full bg-accent"
        aria-hidden="true"
        style={{ opacity: index % 2 === 0 ? 1 : 0.7 }}
      />
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
  );
}
