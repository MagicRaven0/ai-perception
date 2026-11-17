"use client";

import { play } from "@/lib/audio/engine";
import { formatTime } from "@/lib/audio/vtt";
import { useStore, type Track } from "@/lib/store";

export function ChapterList({ chapters, track }: { chapters: { t: number; title: string }[]; track: Track }) {
  const current = useStore((s) => {
    if (s.track?.id !== track.id) return -1;
    let idx = -1;
    chapters.forEach((c, i) => {
      if (c.t <= s.currentTime) idx = i;
    });
    return idx;
  });

  if (chapters.length === 0) return null;

  return (
    <ol className="border-t border-ink">
      {chapters.map((c, i) => (
        <li key={i} className="border-b border-rule">
          <button
            type="button"
            onClick={() => void play(track, c.t)}
            aria-current={i === current ? "true" : undefined}
            className={`flex w-full items-baseline gap-4 py-3 text-left ${i === current ? "font-semibold" : ""}`}
          >
            <span className="w-14 font-mono text-xs text-muted tabular-nums">{formatTime(c.t)}</span>
            <span>{c.title}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
