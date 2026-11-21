import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  about,
  buildings,
  comparisons,
  datasets,
  episodes,
  eras,
  getSource,
  getTranscript,
  insights,
  citations,
  site,
} from "@/lib/content";
import type { EraId } from "@/lib/content/schema";
import { isPlaceholder } from "@/lib/content/placeholder";
import { formatTime } from "@/lib/audio/vtt";
import { citedSourceIds } from "@/lib/content/citations";

/**
 * The research corpus the AI may use (PLAN.md 8.2). Built from content/ at request time (cached in memory):
 * every real, non-placeholder piece of text becomes one or more ~150-300 word chunks with a stable-ish id.
 * The whole list goes into the prompt (context stuffing): the corpus is small, so no vector database.
 */

export type Chunk = {
  id: string;
  /** What the chunk is about, shown on the citation chip. */
  title: string;
  eraId: EraId | null;
  text: string;
  sourceIds: string[];
  /** Where the citation chip links to. */
  href: string;
  /** Item id for the summarizer (building id, episode id, ...), if this chunk belongs to a summarizable item. */
  itemId?: string;
};

/** Public, client-safe metadata for citation chips. */
export type ChunkRef = { title: string; href: string };

const MAX_WORDS = 280;

function splitText(text: string): string[] {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  let cur: string[] = [];
  let words = 0;
  for (const p of paras) {
    const n = p.split(/\s+/).length;
    if (words + n > MAX_WORDS && cur.length) {
      out.push(cur.join("\n\n"));
      cur = [];
      words = 0;
    }
    cur.push(p);
    words += n;
  }
  if (cur.length) out.push(cur.join("\n\n"));
  return out;
}

type Doc = Omit<Chunk, "id" | "text"> & { text: string };

function collectDocs(): Doc[] {
  const docs: Doc[] = [];
  const real = (s: string | undefined | null): s is string => !!s && !isPlaceholder(s);

  if (real(site.thesis))
    docs.push({ title: "Our thesis", eraId: null, text: site.thesis, sourceIds: [], href: "/about" });
  if (real(about.genreRationale))
    docs.push({
      title: "Why this site is built this way",
      eraId: null,
      text: about.genreRationale,
      sourceIds: [],
      href: "/about",
    });

  for (const era of eras) {
    const href = `/read/${era.slug}`;
    if (real(era.perceptionSummary))
      docs.push({
        title: `${era.islandName}: overview`,
        eraId: era.id,
        text: era.perceptionSummary,
        sourceIds: [],
        href,
      });
    if (real(era.thesisLink))
      docs.push({
        title: `${era.islandName}: link to our argument`,
        eraId: era.id,
        text: era.thesisLink,
        sourceIds: [],
        href,
      });
    const people = era.anchorFigures
      .filter((f) => real(f.role) || real(f.view))
      .map((f) => `${f.name}${real(f.role) ? `, ${f.role}` : ""}${real(f.view) ? `: ${f.view}` : ""}`);
    if (people.length)
      docs.push({
        title: `${era.islandName}: key people`,
        eraId: era.id,
        text: people.join("\n\n"),
        sourceIds: [],
        href,
      });
  }

  for (const b of buildings) {
    if (!real(b.long)) continue;
    const era = eras.find((e) => e.id === b.eraId)!;
    docs.push({
      title: real(b.title) ? b.title : "Untitled section",
      eraId: b.eraId,
      text: b.long,
      sourceIds: b.sourceIds,
      href: `/read/${era.slug}#${b.id}`,
      itemId: b.summarizable ? b.id : undefined,
    });
  }

  for (const i of insights) {
    if (!real(i.text)) continue;
    const era = eras.find((e) => e.id === i.eraId)!;
    docs.push({
      title: `${era.islandName}: ${i.kind}`,
      eraId: i.eraId,
      text: `${i.kind[0].toUpperCase()}${i.kind.slice(1)}: ${i.text}${i.groupCommentary ? " (our group's view)" : ""}`,
      sourceIds: i.sourceIds,
      href: `/read/${era.slug}`,
    });
  }

  for (const d of datasets) {
    if (d.status !== "verified") continue;
    const era = eras.find((e) => e.id === d.eraId)!;
    const src = d.sourceId ? getSource(d.sourceId) : undefined;
    const values = d.series
      .map((s) => `${s.label}: ${s.points.map((p) => `${p.x} = ${p.y}${d.unit}`).join(", ")}`)
      .join("; ");
    docs.push({
      title: d.title,
      eraId: d.eraId,
      text: `Survey "${d.title}". Exact question: "${d.questionWording}". Asked to: ${d.population}${
        d.sampleSize ? ` (n = ${d.sampleSize})` : ""
      }, ${d.fieldDates}. Results: ${values}.${src ? ` Source: ${src.apa}` : ""}`,
      sourceIds: d.sourceId ? [d.sourceId] : [],
      href: `/read/${era.slug}`,
    });
  }

  for (const c of comparisons) {
    if (![c.left.statement, c.right.statement, c.takeaway].every(real)) continue;
    docs.push({
      title: `Then vs now: ${c.left.year} and ${c.right.year}`,
      eraId: c.eraIds[0],
      text: `${c.left.label} (${c.left.year}): ${c.left.statement}\n\n${c.right.label} (${c.right.year}): ${c.right.statement}\n\n${c.takeaway}`,
      sourceIds: [c.left.sourceId, c.right.sourceId].filter((s): s is string => !!s),
      href: "/read#then-and-now",
    });
  }

  for (const e of episodes) {
    // Interviews are only used once every speaker has agreed in writing.
    if (e.kind === "interview" && !e.speakers.every((s) => s.consentConfirmed)) continue;
    const cues = getTranscript(e.transcript);
    if (!cues.length) continue;
    const title = real(e.title) ? e.title : "Episode";
    // Group cues into ~250-word passages with their start time
    let buf: string[] = [];
    let start = cues[0].start;
    let words = 0;
    const flush = () => {
      if (!buf.length) return;
      docs.push({
        title: `${title} (${formatTime(start)})`,
        eraId: e.eraIds[0],
        text: buf.join(" "),
        sourceIds: [],
        href: `/listen/${e.id}`,
        itemId: e.summarizable ? e.id : undefined,
      });
      buf = [];
      words = 0;
    };
    for (const c of cues) {
      if (!buf.length) start = c.start;
      const line = c.speaker ? `${c.speaker}: ${c.text}` : c.text;
      buf.push(line);
      words += line.split(/\s+/).length;
      if (words >= 250) flush();
    }
    flush();
  }

  // Free-form research notes in the group's own words: content/corpus/*.md
  // First line may be "era: era-1" and/or "sources: id-1, id-2" (one per line) before a blank line.
  const dir = join(process.cwd(), "content", "corpus");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")) {
    const raw = readFileSync(join(dir, file), "utf8").replace(/\r/g, "");
    if (isPlaceholder(raw)) continue;
    const [head, ...rest] = raw.split(/\n\s*\n/);
    const meta = Object.fromEntries(
      head
        .split("\n")
        .map((l) => l.match(/^(\w+):\s*(.+)$/))
        .filter((m): m is RegExpMatchArray => !!m)
        .map((m) => [m[1].toLowerCase(), m[2].trim()]),
    );
    const hasMeta = Object.keys(meta).length > 0;
    const body = hasMeta ? rest.join("\n\n") : raw;
    const title = body.match(/^#\s+(.+)$/m)?.[1] ?? file.replace(/\.md$/, "");
    docs.push({
      title,
      eraId: (["era-1", "era-2", "era-3"].includes(meta.era) ? meta.era : null) as EraId | null,
      text: body.replace(/^#\s+.+$/m, "").trim(),
      sourceIds: meta.sources ? meta.sources.split(/,\s*/) : [],
      href: "/sources",
    });
  }

  return docs;
}

let cached: Chunk[] | null = null;

export function getCorpus(): Chunk[] {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const chunks: Chunk[] = [];
  // Prose carries APA in-text citations ("(Witt, 2025, para. 57)"): each chunk also gets the ids of the sources
  // it cites, so the chatbot's answers can name the works behind them, not only the section.
  for (const doc of collectDocs()) {
    for (const text of splitText(doc.text)) {
      const sourceIds = [...new Set([...doc.sourceIds, ...citedSourceIds(text, citations)])];
      chunks.push({ ...doc, text, sourceIds, id: `C${String(chunks.length + 1).padStart(3, "0")}` });
    }
  }
  cached = chunks;
  return chunks;
}

/** Client-safe map for rendering citation chips. */
export function getChunkRefs(): Record<string, ChunkRef> {
  return Object.fromEntries(getCorpus().map((c) => [c.id, { title: c.title, href: c.href }]));
}

/** The corpus as prompt text. Optionally puts one era's chunks first (persona focus). */
export function corpusForPrompt(focus?: EraId): string {
  const chunks = getCorpus();
  const ordered = focus
    ? [...chunks.filter((c) => c.eraId === focus), ...chunks.filter((c) => c.eraId !== focus)]
    : chunks;
  if (!ordered.length) return "(The corpus is empty: the group has not added its research yet.)";
  return ordered
    .map((c) => {
      const sources = c.sourceIds
        .map((id) => getSource(id)?.apa)
        .filter(Boolean)
        .join(" | ");
      return `<chunk id="${c.id}" era="${c.eraId ?? "general"}" title="${c.title.replace(/"/g, "'")}"${
        sources ? ` sources="${sources.replace(/"/g, "'")}"` : ""
      }>\n${c.text}\n</chunk>`;
    })
    .join("\n\n");
}

/** Full text of one summarizable item (building or episode), for the summarizer. */
export function itemText(itemId: string): { title: string; text: string } | null {
  const chunks = getCorpus().filter((c) => c.itemId === itemId);
  if (!chunks.length) return null;
  return { title: chunks[0].title.replace(/ \(\d+:\d+\)$/, ""), text: chunks.map((c) => c.text).join("\n\n") };
}

export function summarizableItemIds(): string[] {
  return [...new Set(getCorpus().flatMap((c) => (c.itemId ? [c.itemId] : [])))];
}
