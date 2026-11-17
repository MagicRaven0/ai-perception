"use client";

import { useState } from "react";
import type { Comparison } from "@/lib/content/schema";
import { ContentText } from "@/components/content/ContentText";
import { SourceLine, type SourceRef } from "./SourceLine";

type Side = Comparison["left"] & { source?: SourceRef };

/**
 * Ceros-style before/after: drag (or arrow keys) to move between "then" and "now".
 * Both texts are always in the DOM for screen readers; only the visual clip changes.
 */
export function ComparisonSlider({ left, right, takeaway }: { left: Side; right: Side; takeaway: string }) {
  const [pos, setPos] = useState(50);
  const snap = () =>
    setPos((p) => [0, 50, 100].reduce((best, s) => (Math.abs(s - p) < Math.abs(best - p) ? s : best), p));

  return (
    <figure className="flex flex-col gap-4">
      <div className="relative min-h-[320px] overflow-hidden rounded-[4px] border border-ink md:min-h-[280px]">
        {/* Right ("now") underneath */}
        <Panel side={right} tone="now" />
        {/* Left ("then") on top, clipped */}
        <div
          className="absolute inset-0 transition-[clip-path] duration-250 ease-calm motion-reduce:transition-none"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <Panel side={left} tone="then" />
        </div>
        {/* Handle */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink"
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        >
          <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink bg-paper text-sm">
            ⇆
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          onPointerUp={snap}
          onKeyUp={snap}
          aria-label={`Compare: drag left to see ${left.year}, right to see ${right.year}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="max-w-3xl text-lg">
        <ContentText value={takeaway} />
      </figcaption>
      <div className="grid gap-1 md:grid-cols-2">
        <SourceLine source={left.source} tone="light" />
        <SourceLine source={right.source} tone="light" />
      </div>
    </figure>
  );
}

function Panel({ side, tone }: { side: Side; tone: "then" | "now" }) {
  const then = tone === "then";
  // Each side keeps its text inside its own half, so at the 50% resting point both are fully readable.
  return (
    <div
      className={`absolute inset-0 flex flex-col justify-end gap-2 p-4 md:gap-3 md:p-10 ${
        then ? "bg-era1-base text-ink" : "items-end bg-night text-right text-paper"
      }`}
    >
      <div className={`flex w-[44%] flex-col gap-2 md:gap-3 ${then ? "" : "items-end"}`}>
        <p className="font-display text-4xl leading-none font-medium tracking-headline break-words md:text-8xl">
          {side.year}
        </p>
        <p className="text-xs font-semibold md:text-sm">
          <ContentText value={side.label} />
        </p>
        <p className="text-base leading-snug md:text-xl">
          <ContentText value={side.statement} />
        </p>
      </div>
    </div>
  );
}
