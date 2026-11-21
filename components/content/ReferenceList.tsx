import type { ReactNode } from "react";
import { isPlaceholder } from "@/lib/content/placeholder";
import { ContentText } from "./ContentText";

export type ReferenceItem = { id: string; apa: string; url: string };

/** APA strings end with their URL; it is shown once, as the clickable link after the text. */
function withoutTrailingUrl(apa: string, url: string): string {
  const trimmed = apa.trimEnd();
  return /^https?:\/\//.test(url) && trimmed.endsWith(url) ? trimmed.slice(0, -url.length).trimEnd() : apa;
}

/**
 * An APA 7 reference list (hanging indent, one clickable link each). `TODO:` entries render as the hatched
 * "coming soon" box. Items must already be sorted. `anchors` gives each item its source id as an HTML id
 * (only on /sources, so ids stay unique on pages that show several lists).
 */
export function ReferenceList({
  items,
  anchors = false,
  size = "base",
  extra,
}: {
  items: ReferenceItem[];
  anchors?: boolean;
  size?: "base" | "sm";
  extra?: (item: ReferenceItem) => ReactNode;
}) {
  return (
    <ul className={`border-t border-ink ${size === "sm" ? "text-sm" : ""}`}>
      {items.map((s) => {
        const todo = isPlaceholder(s.apa);
        const more = extra?.(s);
        return (
          <li
            key={s.id}
            id={anchors ? s.id : undefined}
            className={`scroll-mt-24 border-b border-rule pl-8 -indent-8 leading-relaxed wrap-anywhere target:bg-paper ${size === "sm" ? "py-2.5" : "py-4"}`}
          >
            {todo ? <ContentText value={s.apa} /> : withoutTrailingUrl(s.apa, s.url)}{" "}
            {!todo && /^https?:\/\//.test(s.url) && (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {s.url}
              </a>
            )}
            {more ? <span className="mt-1 block indent-0 text-sm text-muted">{more}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
