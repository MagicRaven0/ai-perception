"use client";

import { useEffect, useRef, useState } from "react";
import { InTextCite, type SourceRef } from "@/components/content/InTextCite";
import { formatValue } from "@/lib/content/format";

/** Ceros-style stat: one huge number (counts up once when visible), a one-line label, its context and citation. */
export function StatCard({
  value,
  unit,
  label,
  context,
  source,
}: {
  value: number;
  unit: string;
  label: string;
  /** Question wording or a "not a survey" note, plus who/when. */
  context?: string;
  source?: SourceRef;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Server render and no-JS show the real number; the count-up only runs for a card that is still off-screen.
  const [shown, setShown] = useState(value);
  const decimals = Number.isInteger(value) ? 0 : 1;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const r = node.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already visible: no count-up
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1200);
        setShown(value * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <p className="font-display text-7xl leading-none font-medium tracking-headline text-era3-accent md:text-8xl">
        <span aria-hidden="true">
          {shown.toFixed(decimals)}
          {unit === "%" ? "%" : <span className="ml-3 text-4xl md:text-5xl">{unit}</span>}
        </span>
        <span className="sr-only">{formatValue(value, unit)}</span>
      </p>
      <p className="max-w-md text-lg text-snow">{label}</p>
      <p className="max-w-2xl text-sm text-chart-text">
        {context} {source ? <InTextCite sources={[source]} /> : "(source to be added)"}.
      </p>
    </div>
  );
}
