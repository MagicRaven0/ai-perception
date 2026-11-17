"use client";

import Link from "next/link";
import { Fragment } from "react";
import type { ChunkRef } from "@/lib/ai/corpus";

export const NOT_FOUND = "[NONE]";
const CITE = /\[(C\d{3})\]/g;

/** Splits an answer into text and citation chips. Returns the chunk ids it cited (valid ones only). */
export function parseAnswer(text: string, refs: Record<string, ChunkRef>) {
  const notFound = text.includes(NOT_FOUND);
  // Hide any model "thinking" block (local thinking models) and the not-found marker.
  const clean = text
    .replace(/<think>[\s\S]*?(<\/think>|$)/g, "")
    .replaceAll(NOT_FOUND, "")
    .trim();
  const cited: string[] = [];
  const invalid: string[] = [];
  for (const m of clean.matchAll(CITE)) {
    if (refs[m[1]]) {
      if (!cited.includes(m[1])) cited.push(m[1]);
    } else if (!invalid.includes(m[1])) invalid.push(m[1]);
  }
  return { clean, notFound, cited, invalid };
}

/** Renders answer text with numbered citation chips that link to the 2D section they came from. */
export function CitedText({ text, refs, cited }: { text: string; refs: Record<string, ChunkRef>; cited: string[] }) {
  const parts = text.split(/(\[C\d{3}\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[(C\d{3})\]$/);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        const ref = refs[m[1]];
        if (!ref) return null; // invented id: dropped, and flagged under the answer
        const n = cited.indexOf(m[1]) + 1;
        return (
          <Link
            key={i}
            href={ref.href}
            title={ref.title}
            aria-label={`Source ${n}: ${ref.title}`}
            className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 align-text-top font-mono text-[0.65rem] text-paper no-underline"
          >
            {n}
          </Link>
        );
      })}
    </>
  );
}
