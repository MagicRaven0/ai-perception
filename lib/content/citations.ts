/**
 * APA in-text citations -> source ids. Content prose carries parenthetical citations like "(Witt, 2025, para. 57)",
 * "(McCarthy et al., 1955; Williams, 2024)", "(Dartmouth College, n.d.)", "(cited in Popova, 2011)" and narrative
 * ones like "Bengio (2025)" or "Simon and Newell (1958)".
 * Each source is matched by its first author (surname or organisation, from its APA string) and its year.
 * Pure functions (no server-only imports): used by the AI corpus and by the 2D renderer to link citations.
 */

export type CitationMatcher = { id: string; author: string; year: string; re: RegExp; narrative: RegExp };

/** A stretch of text that cites one source. `end` is exclusive. */
export type CitationSpan = { start: number; end: number; id: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** "McCarthy, J., ..." -> McCarthy; "Dartmouth College. (n.d.)" -> Dartmouth College; year "1955" or "n.d.". */
export function citationMatchers(sources: { id: string; apa: string }[]): CitationMatcher[] {
  const out: CitationMatcher[] = [];
  for (const s of sources) {
    const year = s.apa.match(/\((\d{4}|n\.d\.)/)?.[1];
    if (!year) continue; // placeholders ("TODO: ...") and unusual entries are simply not linked
    const head = s.apa.split(/\.\s\(|\(/)[0];
    const author = head.split(",")[0].trim();
    if (!author || author.startsWith("TODO")) continue;
    const a = escape(author);
    const y = escape(year);
    out.push({
      id: s.id,
      author,
      year,
      // Inside one parenthetical part: author, then the year within a short distance.
      re: new RegExp(`(?<![\\w-])${a}(?![\\w-])[^();]{0,60}?${y}`),
      // Narrative: "Bengio (2025)", "Simon and Newell (1958)", "McCarthy et al. (1955, p. 1)".
      narrative: new RegExp(
        `(?<![\\w-])${a}(?:\\s+(?:and|&)\\s+[A-Z][\\w'-]+|\\s+et al\\.)?\\s+\\(${y}[^()]*\\)`,
        "g",
      ),
    });
  }
  return out;
}

/** Every citation in `text`, in order, without overlaps. */
export function findCitations(text: string, matchers: CitationMatcher[]): CitationSpan[] {
  const spans: CitationSpan[] = [];

  // Parenthetical citations: "(A, 2020; B, 2021)" -> one span per matching part.
  for (const group of text.matchAll(/\(([^()]*)\)/g)) {
    let offset = (group.index ?? 0) + 1;
    for (const part of group[1].split(";")) {
      const m = matchers.find((x) => x.re.test(part));
      if (m) {
        const lead = part.length - part.trimStart().length;
        const trimmed = part.trim();
        spans.push({ start: offset + lead, end: offset + lead + trimmed.length, id: m.id });
      }
      offset += part.length + 1;
    }
  }

  // Narrative citations: the author's name is outside the brackets.
  for (const m of matchers) {
    for (const hit of text.matchAll(m.narrative)) {
      const start = hit.index ?? 0;
      spans.push({ start, end: start + hit[0].length, id: m.id });
    }
  }

  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: CitationSpan[] = [];
  for (const s of spans) if (!out.length || s.start >= out[out.length - 1].end) out.push(s);
  return out;
}

/** Ids of every source cited anywhere in `text`. */
export function citedSourceIds(text: string, matchers: CitationMatcher[]): string[] {
  return [...new Set(findCitations(text, matchers).map((s) => s.id))];
}
