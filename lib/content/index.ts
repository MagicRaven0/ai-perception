import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  About,
  Building,
  Comparison,
  Credit,
  Dataset,
  Episode,
  Era,
  Image,
  Insight,
  Site,
  Source,
  type EraId,
} from "./schema";
import { citationMatchers } from "./citations";
import { site as rawSite } from "@/content/site";
import { about as rawAbout } from "@/content/about";
import { eras as rawEras } from "@/content/eras";
import { buildings as rawBuildings } from "@/content/buildings";
import { insights as rawInsights } from "@/content/insights";
import { comparisons as rawComparisons } from "@/content/comparisons";
import { datasets as rawDatasets } from "@/content/datasets";
import { episodes as rawEpisodes } from "@/content/episodes";
import { sources as rawSources } from "@/content/sources";
import { credits as rawCredits, images as rawImages } from "@/content/credits";
import { parseVtt, type Cue } from "@/lib/audio/vtt";

/**
 * Single source of truth for pages and (later) the AI corpus.
 * Content is parsed through the Zod schemas here, so defaults are applied and bad content fails loudly.
 * `npm run check-content` runs the same schemas plus cross-reference checks.
 */

export const site = Site.parse(rawSite);
export const about = About.parse(rawAbout);
export const eras = z
  .array(Era)
  .parse(rawEras)
  .sort((a, b) => a.number - b.number);
export const buildings = z.array(Building).parse(rawBuildings);
export const insights = z.array(Insight).parse(rawInsights);
export const comparisons = z.array(Comparison).parse(rawComparisons);
export const datasets = z.array(Dataset).parse(rawDatasets);
export const episodes = z.array(Episode).parse(rawEpisodes);
export const sources = z.array(Source).parse(rawSources);
/** Matchers that turn APA in-text citations in prose into source ids (and /sources#<id> links). */
export const citations = citationMatchers(sources);
export const credits = z.array(Credit).parse(rawCredits);
export const images = z.array(Image).parse(rawImages);

export function getEra(id: EraId) {
  const era = eras.find((e) => e.id === id);
  if (!era) throw new Error(`Unknown era ${id}`);
  return era;
}

export function getEraBySlug(slug: string) {
  return eras.find((e) => e.slug === slug);
}

export function buildingsForEra(id: EraId) {
  return buildings.filter((b) => b.eraId === id).sort((a, b) => a.order - b.order);
}

export function insightsForEra(id: EraId) {
  return insights.filter((i) => i.eraId === id);
}

export function datasetsForEra(id: EraId) {
  return datasets.filter((d) => d.eraId === id);
}

export function episodesForEra(id: EraId) {
  return episodes.filter((e) => e.eraIds.includes(id));
}

export function getEpisode(id: string) {
  return episodes.find((e) => e.id === id);
}

export function getSource(id: string) {
  return sources.find((s) => s.id === id);
}

export function getImage(id: string) {
  return images.find((i) => i.id === id);
}

export function getCredit(id: string) {
  return credits.find((c) => c.id === id);
}

/** Reads and parses an episode's WebVTT transcript from content/transcripts/. */
export function getTranscript(file: string | null): Cue[] {
  if (!file) return [];
  const text = readFileSync(join(process.cwd(), "content", "transcripts", file), "utf8");
  return parseVtt(text);
}
