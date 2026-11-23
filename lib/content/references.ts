import { buildings, citations, comparisons, datasets, eras, insights, sources } from "./index";
import { citedSourceIds } from "./citations";
import { isPlaceholder } from "./placeholder";
import type { EraId, Source } from "./schema";

/**
 * The generated "References" building on every island (docs/VISION.md, added 22 Nov 2026) and the matching
 * "References for this era" list at the end of each 2D era section. Never stored in content/: computed from it.
 *
 * An era's references = every source cited by its buildings, insights, datasets, comparisons and era text
 * (ids, plus APA in-text citations in the prose) + every source whose `eraIds` include the era.
 * Sorted alphabetically (APA reference-list order), with `TODO:` entries last.
 */

/** Building id of an island's generated References building. */
export const referencesBuildingId = (eraId: EraId) => `${eraId}-references`;

export function referencesForEra(eraId: EraId): Source[] {
  const ids = new Set<string>();
  const add = (list: (string | undefined)[]) => list.forEach((id) => id && ids.add(id));
  const cite = (text: string | undefined) => text && !isPlaceholder(text) && add(citedSourceIds(text, citations));

  const era = eras.find((e) => e.id === eraId);
  if (era) {
    cite(era.perceptionSummary);
    cite(era.thesisLink);
    era.anchorFigures.forEach((f) => cite(f.view));
  }
  for (const b of buildings.filter((x) => x.eraId === eraId)) {
    add(b.sourceIds);
    cite(b.short);
    cite(b.long);
  }
  for (const i of insights.filter((x) => x.eraId === eraId)) {
    add(i.sourceIds);
    cite(i.text);
  }
  for (const d of datasets.filter((x) => x.eraId === eraId && x.status === "verified")) add([d.sourceId]);
  for (const c of comparisons.filter((x) => x.eraIds.includes(eraId))) add([c.left.sourceId, c.right.sourceId]);
  for (const s of sources) if (s.eraIds.includes(eraId)) ids.add(s.id);

  return sources
    .filter((s) => ids.has(s.id))
    .sort((a, b) => Number(isPlaceholder(a.apa)) - Number(isPlaceholder(b.apa)) || a.apa.localeCompare(b.apa));
}

/**
 * Short board line for a source, cut from its APA entry: authors and year, then the title. "Retrieved ...", the
 * link, bracketed formats and the publisher (the last sentence) are left off; the drawer has the full entry.
 */
export function sourceRow(s: Pick<Source, "apa">): { who: string; title: string } {
  if (isPlaceholder(s.apa)) return { who: "Coming soon", title: "" };
  const m = s.apa.match(/^(.+?)\.?\s\((n\.d\.|\d{4})[^)]*\)\.\s(.+)$/);
  if (!m) return { who: s.apa, title: "" };
  const authors = m[1]!.split(/, & |, (?=[A-Z][^,]+, [A-Z]\.)/);
  const surname = (a: string) => a.replace(/,(\s[A-Z]\.?)+$/, "");
  const more = authors.length === 2 ? ` & ${surname(authors[1]!)}` : authors.length > 2 ? " et al." : "";
  const who = `${surname(authors[0]!)}${more} (${m[2]})`;
  let title = m[3]!
    .replace(/\s*https?:\/\/\S+$/, "")
    .replace(/\s*Retrieved\s.*$/, "")
    .replace(/\s*\[[^\]]*\]/g, "")
    .trim()
    .replace(/(?<!\b[A-Z])\.$/, "");
  const publisher = title.match(/[.?!]\.?\s(?=[^.?!]*$)/);
  if (publisher?.index) title = title.slice(0, publisher.index + 1).replace(/(?<!\.[A-Z])\.$/, "");
  return { who, title };
}
