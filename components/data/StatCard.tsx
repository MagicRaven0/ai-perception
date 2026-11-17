"use client";

import { useEffect, useRef, useState } from "react";
import { SourceLine, type SourceRef } from "./SourceLine";

/** Ceros-style stat: one huge number (counts up once when visible), a one-line label, the source. */
export function StatCard({
  value,
  unit,
  label,
  source,
}: {
  value: number;
  unit: string;
  label: string;
  source?: SourceRef;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const decimals = Number.isInteger(value) ? 0 : 1;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      if (reduce) return setShown(value);
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
          {unit}
        </span>
        <span className="sr-only">
          {value}
          {unit}
        </span>
      </p>
      <p className="max-w-md text-lg text-snow">{label}</p>
      <SourceLine source={source} />
    </div>
  );
}
