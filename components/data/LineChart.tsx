"use client";

import { useState } from "react";
import type { Dataset } from "@/lib/content/schema";

const SERIES = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];
const W = 640;
const H = 280;
const PAD = { top: 16, right: 96, bottom: 28, left: 40 };

/** Change over time. 2px lines, end labels, one axis, crosshair + tooltip on hover. */
export function LineChart({ dataset }: { dataset: Dataset }) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const series = dataset.series.slice(0, 3);
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => String(p.x))))];
  const ys = series.flatMap((s) => s.points.map((p) => p.y));
  const yMax = dataset.unit === "%" ? 100 : Math.max(1, ...ys) * 1.1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const px = (i: number) => PAD.left + (xs.length === 1 ? innerW / 2 : (i / (xs.length - 1)) * innerW);
  const py = (y: number) => PAD.top + innerH - (y / yMax) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-4 text-sm text-paper" aria-label="Legend">
          {series.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className="h-0.5 w-4" style={{ background: SERIES[i] }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${dataset.title}. Use "Show table" for the numbers.`}
        onPointerLeave={() => setHoverX(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={py(t)} y2={py(t)} stroke="var(--color-chart-grid)" />
            <text x={PAD.left - 8} y={py(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-chart-text)">
              {Math.round(t)}
              {dataset.unit === "%" ? "%" : ""}
            </text>
          </g>
        ))}
        {xs.map((x, i) => (
          <text key={x} x={px(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-chart-text)">
            {x}
          </text>
        ))}
        {hoverX !== null && (
          <line
            x1={px(hoverX)}
            x2={px(hoverX)}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="var(--color-chart-text)"
            strokeDasharray="3 3"
          />
        )}
        {series.map((s, si) => {
          const pts = xs
            .map((x, i) => {
              const p = s.points.find((q) => String(q.x) === x);
              return p ? ([px(i), py(p.y)] as const) : null;
            })
            .filter((p): p is readonly [number, number] => p !== null);
          const last = pts[pts.length - 1];
          return (
            <g key={s.label}>
              <polyline
                points={pts.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke={SERIES[si]}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {last && (
                <text x={last[0] + 8} y={last[1] + 4} fontSize="12" fill="var(--color-paper)">
                  {s.label}
                </text>
              )}
              {hoverX !== null && pts[hoverX] && (
                <circle
                  cx={pts[hoverX][0]}
                  cy={pts[hoverX][1]}
                  r="5"
                  fill={SERIES[si]}
                  stroke="var(--color-night)"
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}
        {/* Hit targets wider than the marks */}
        {xs.map((x, i) => (
          <rect
            key={x}
            x={px(i) - innerW / Math.max(1, xs.length - 1) / 2}
            y={PAD.top}
            width={innerW / Math.max(1, xs.length - 1)}
            height={innerH}
            fill="transparent"
            onPointerEnter={() => setHoverX(i)}
          />
        ))}
      </svg>
      {hoverX !== null && (
        <p className="mt-2 text-sm text-paper" aria-live="polite">
          <span className="font-semibold">{xs[hoverX]}</span>
          {series.map((s) => {
            const y = s.points.find((p) => String(p.x) === xs[hoverX])?.y;
            return y === undefined ? null : (
              <span key={s.label} className="ml-3">
                {s.label}: {y}
                {dataset.unit}
              </span>
            );
          })}
        </p>
      )}
    </div>
  );
}
