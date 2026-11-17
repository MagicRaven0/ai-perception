"use client";

import { useState } from "react";
import type { Dataset } from "@/lib/content/schema";

const SERIES = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

/**
 * Horizontal grouped bars: one row per answer, one bar per series (e.g. survey year).
 * Thin bars, rounded data end, 2px gap between bars, value label at the bar end, hover tooltip.
 */
export function BarChart({ dataset }: { dataset: Dataset }) {
  const [hover, setHover] = useState<string | null>(null);
  const series = dataset.series.slice(0, 3);
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => String(p.x))))];
  const max = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.y)));
  const scaleMax = dataset.unit === "%" ? Math.max(100, max) : max * 1.1;

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-4 flex flex-wrap gap-4 text-sm text-paper" aria-label="Legend">
          {series.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className="size-3 rounded-[3px]" style={{ background: SERIES[i] }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div
        className="flex flex-col gap-5"
        role="img"
        aria-label={`${dataset.title}. Use "Show table" for the numbers.`}
      >
        {xs.map((x) => (
          <div key={x}>
            <p className="mb-1.5 text-sm text-paper">{x}</p>
            <div className="flex flex-col gap-0.5">
              {series.map((s, i) => {
                const y = s.points.find((p) => String(p.x) === x)?.y;
                if (y === undefined) return null;
                const key = `${s.label}|${x}`;
                return (
                  <div
                    key={s.label}
                    className="group relative flex items-center gap-2"
                    onPointerEnter={() => setHover(key)}
                    onPointerLeave={() => setHover(null)}
                  >
                    <div className="h-3 flex-1">
                      <div
                        className="h-full rounded-r-[4px] transition-opacity"
                        style={{
                          width: `${(y / scaleMax) * 100}%`,
                          background: SERIES[i],
                          opacity: hover && hover !== key ? 0.45 : 1,
                        }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-sm tabular-nums text-paper">
                      {y}
                      {dataset.unit}
                    </span>
                    {hover === key && (
                      <span className="pointer-events-none absolute -top-8 left-0 z-hud rounded-[4px] bg-paper px-2 py-1 text-xs whitespace-nowrap text-ink shadow">
                        {series.length > 1 ? `${s.label} · ` : ""}
                        {x}: {y}
                        {dataset.unit}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
