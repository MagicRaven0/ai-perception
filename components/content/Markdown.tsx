import { Fragment, type ReactNode } from "react";
import { isPlaceholder } from "@/lib/content/placeholder";
import { findCitations, type CitationMatcher } from "@/lib/content/citations";
import { ContentText } from "./ContentText";

/**
 * Small, safe markdown renderer for content strings: paragraphs (blank line), **bold**, *italic*,
 * [links](https://...). No raw HTML. Placeholders render as a single hatched box.
 * With `citations`, APA in-text citations ("(Witt, 2025, para. 57)", "Bengio (2025)") link to /sources#<id>.
 */
export function Markdown({
  value,
  className,
  citations,
}: {
  value: string;
  className?: string;
  citations?: CitationMatcher[];
}) {
  if (isPlaceholder(value)) {
    return (
      <p className={className}>
        <ContentText value={value} />
      </p>
    );
  }

  return (
    <>
      {value
        .trim()
        .split(/\n\s*\n/)
        .map((para, i) => (
          <p key={i} className={className}>
            {inline(para.replace(/\n/g, " "), citations)}
          </p>
        ))}
    </>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;

function inline(text: string, citations?: CitationMatcher[]): ReactNode[] {
  const out: ReactNode[] = [];
  const plain = (from: number, to: number) => out.push(...cite(text.slice(from, to), from, citations));
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) plain(last, at);
    const token = m[0];
    if (token.startsWith("**")) out.push(<strong key={at}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("*")) out.push(<em key={at}>{token.slice(1, -1)}</em>);
    else {
      const label = token.slice(1, token.indexOf("]"));
      out.push(
        <a
          key={at}
          href={m[2]}
          className="underline decoration-1 underline-offset-2"
          rel="noopener noreferrer"
          target="_blank"
        >
          {label}
        </a>,
      );
    }
    last = at + token.length;
  }
  if (last < text.length) plain(last, text.length);
  return out.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}

/** Plain text with its in-text citations turned into links to the works-cited entry. */
function cite(text: string, keyBase: number, citations?: CitationMatcher[]): ReactNode[] {
  if (!citations?.length) return [text];
  const out: ReactNode[] = [];
  let last = 0;
  for (const c of findCitations(text, citations)) {
    if (c.start > last) out.push(text.slice(last, c.start));
    out.push(
      <a
        key={`c${keyBase + c.start}`}
        href={`/sources#${c.id}`}
        className="underline decoration-1 underline-offset-2 hover:decoration-2"
      >
        {text.slice(c.start, c.end)}
      </a>,
    );
    last = c.end;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
