"use client";

import { useState } from "react";
import { SUMMARY_LABEL, SUMMARY_MODES, type SummaryMode } from "@/lib/ai/personas";

type Result = { text: string; checked: boolean; live?: boolean };

const ERRORS: Record<string, string> = {
  "rate-limited": "Too many requests right now. Try again in a minute.",
  "class-mode": "Live summaries are paused to keep the site free for the class.",
};

/** The 3 summary chips (PLAN.md 8.4). Reviewed summaries show instantly; others are generated once, then cached. */
export function SummarizerChips({
  itemId,
  stored,
}: {
  itemId: string;
  stored: Partial<Record<SummaryMode, { text: string; checked: boolean }>>;
}) {
  const [mode, setMode] = useState<SummaryMode | null>(null);
  const [results, setResults] = useState<Partial<Record<SummaryMode, Result>>>(stored);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async (m: SummaryMode) => {
    setMode(m === mode ? null : m);
    setError(null);
    if (m === mode || results[m]) return;
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, mode: m }),
      });
      const body = (await res.json()) as Result & { error?: string };
      if (!res.ok || body.error) throw new Error(body.error ?? "unavailable");
      setResults((r) => ({ ...r, [m]: body }));
    } catch (e) {
      setError(ERRORS[(e as Error).message] ?? "The summary could not be made right now.");
    } finally {
      setLoading(false);
    }
  };

  const result = mode ? results[mode] : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="AI summaries" className="flex flex-wrap gap-2">
        {SUMMARY_MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => void open(m)}
            aria-expanded={mode === m}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              mode === m ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"
            }`}
          >
            {SUMMARY_LABEL[m]}
          </button>
        ))}
      </div>
      {mode && (
        <div className="rounded-[4px] border border-rule bg-cream p-4" aria-live="polite">
          {loading && !result ? (
            <p className="text-muted">Summarising…</p>
          ) : error ? (
            <p className="text-muted">{error}</p>
          ) : result ? (
            <>
              <p className="leading-relaxed whitespace-pre-wrap">{result.text}</p>
              <p className="mt-3 text-xs font-semibold text-muted">
                {result.checked ? "AI-generated · checked by our group" : "AI-generated · not yet checked by our group"}
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
