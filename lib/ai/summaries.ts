import "server-only";
import { createHash } from "node:crypto";
import cachedSummaries from "@/content/generated/summaries.json";
import cachedAnswers from "@/content/generated/answers.json";
import type { PersonaId, SummaryMode } from "./personas";

/**
 * Pre-generated AI output (npm run gen-ai), reviewed by the group: set "checked": true in the JSON after
 * reading each one. A stored summary is only used while its source text is unchanged (hash match).
 */

export type StoredSummary = { text: string; hash: string; model: string; generatedAt: string; checked: boolean };
export type SummaryFile = Record<string, Partial<Record<SummaryMode, StoredSummary>>>;
export type StoredAnswer = { answer: string; hash: string; model: string; generatedAt: string; checked: boolean };
export type AnswerFile = Partial<Record<PersonaId, Record<string, StoredAnswer>>>;

export const textHash = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

export function storedSummary(itemId: string, mode: SummaryMode, text: string): StoredSummary | null {
  const s = (cachedSummaries as SummaryFile)[itemId]?.[mode];
  return s && s.hash === textHash(text) ? s : null;
}

/** Client-safe: every reviewed-or-not stored summary for an item whose text still matches. */
export function storedSummariesFor(itemId: string, text: string) {
  const out: Partial<Record<SummaryMode, { text: string; checked: boolean }>> = {};
  for (const [mode, s] of Object.entries((cachedSummaries as SummaryFile)[itemId] ?? {})) {
    if (s && s.hash === textHash(text)) out[mode as SummaryMode] = { text: s.text, checked: s.checked };
  }
  return out;
}

/** Client-safe: stored answers to the suggested questions, keyed by persona then question. */
export function storedAnswers(corpusHash: string) {
  const out: Partial<Record<PersonaId, Record<string, { answer: string; checked: boolean }>>> = {};
  for (const [persona, qs] of Object.entries(cachedAnswers as AnswerFile)) {
    for (const [q, a] of Object.entries(qs ?? {})) {
      if (a.hash !== corpusHash) continue; // corpus changed since generation: re-run gen-ai
      (out[persona as PersonaId] ??= {})[q] = { answer: a.answer, checked: a.checked };
    }
  }
  return out;
}
