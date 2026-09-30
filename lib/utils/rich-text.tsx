import React from "react";

export type InfoBannerVariant = "accent" | "cream" | "gold";

/**
 * Parses a simple, safe inline markup format for rich text:
 * - **bold** or <b>bold</b> -> <strong>
 * - *italic* or <i>italic</i> -> <em>
 * - [Link Text](https://...) or [Link Text](/path) -> <a>
 * - {red}highlighted text{/red} or {accent}text{/accent} -> <span className="...">
 * - {gold}highlighted text{/gold} -> gold highlight
 * - {badge}TEXT{/badge} -> inline badge pill
 * - \n -> line breaks or paragraphs
 */
export function renderFormattedRichText(text: string): React.ReactNode {
  if (!text) return null;

  // Split into lines first
  const lines = text.split(/\r?\n/);

  return (
    <>
      {lines.map((line, lineIndex) => {
        const isBlank = line.trim().length === 0;
        if (isBlank) {
          return <span key={lineIndex} className="block h-2" aria-hidden="true" />;
        }

        return (
          <span key={lineIndex} className="block leading-relaxed">
            {parseInlineFormatting(line)}
          </span>
        );
      })}
    </>
  );
}

function parseInlineFormatting(line: string): React.ReactNode[] {
  // Regex pattern matching:
  // 1. [text](url) -> Markdown link
  // 2. **text** -> bold
  // 3. *text* -> italic
  // 4. {red}...{/red} or {accent}...{/accent}
  // 5. {gold}...{/gold}
  // 6. {badge}...{/badge}
  // 7. <b>...</b>
  // 8. <i>...</i>
  const tokenRegex =
    /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|\{(?:red|accent)\}([^{]+)\{\/(?:red|accent)\}|\{gold\}([^{]+)\{\/gold\}|\{badge\}([^{]+)\{\/badge\}|<b>(.*?)<\/b>|<i>(.*?)<\/i>)/gi;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    // Append preceding raw text
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const linkText = match[2];
    const linkUrl = match[3];
    const boldText = match[4] ?? match[8];
    const italicText = match[5] ?? match[9];
    const redText = match[6];
    const goldText = match[7];
    const badgeText = match[10];

    if (linkText && linkUrl) {
      const isExternal = linkUrl.startsWith("http://") || linkUrl.startsWith("https://");
      nodes.push(
        <a
          key={match.index}
          href={linkUrl}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-semibold underline decoration-accent/60 underline-offset-2 transition-colors hover:text-accent hover:decoration-accent"
        >
          {linkText}
        </a>,
      );
    } else if (boldText !== undefined) {
      nodes.push(
        <strong key={match.index} className="font-bold text-foreground">
          {boldText}
        </strong>,
      );
    } else if (italicText !== undefined) {
      nodes.push(
        <em key={match.index} className="italic">
          {italicText}
        </em>,
      );
    } else if (redText !== undefined) {
      nodes.push(
        <span key={match.index} className="font-semibold text-accent">
          {redText}
        </span>,
      );
    } else if (goldText !== undefined) {
      nodes.push(
        <span key={match.index} className="font-semibold text-amber-700">
          {goldText}
        </span>,
      );
    } else if (badgeText !== undefined) {
      nodes.push(
        <span
          key={match.index}
          className="mx-1 inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-accent border border-accent/25"
        >
          {badgeText}
        </span>,
      );
    } else {
      nodes.push(fullMatch);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [line];
}
