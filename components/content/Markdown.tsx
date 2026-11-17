import { Fragment, type ReactNode } from "react";
import { isPlaceholder } from "@/lib/content/placeholder";
import { ContentText } from "./ContentText";

/**
 * Small, safe markdown renderer for content strings: paragraphs (blank line), **bold**, *italic*,
 * [links](https://...). No raw HTML. Placeholders render as a single hatched box.
 */
export function Markdown({ value, className }: { value: string; className?: string }) {
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
            {inline(para.replace(/\n/g, " "))}
          </p>
        ))}
    </>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
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
  if (last < text.length) out.push(text.slice(last));
  return out.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}
