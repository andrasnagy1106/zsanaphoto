interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  level?: "h1" | "h2";
}

export function SectionHeading({ eyebrow, title, description, align = "left", level = "h2" }: SectionHeadingProps) {
  const Heading = level;
  return (
    <div className={align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-2xl"}>
      {eyebrow ? (
        <p className="text-sm font-medium tracking-wide uppercase text-accent mb-2">{eyebrow}</p>
      ) : null}
      <Heading className="font-display text-3xl sm:text-4xl text-foreground">{title}</Heading>
      {description ? (
        <p className="mt-3 text-base sm:text-lg text-foreground/70 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
