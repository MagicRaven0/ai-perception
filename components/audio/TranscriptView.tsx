"use client";

import { useEffect, useRef } from "react";
import { play } from "@/lib/audio/engine";
import { activeCueIndex, formatTime, type Cue } from "@/lib/audio/vtt";
import { useStore, type Track } from "@/lib/store";

/** Synced transcript: the current line highlights while playing; click any line to jump there. */
export function TranscriptView({ cues, track }: { cues: Cue[]; track: Track }) {
  const active = useStore((s) => (s.track?.id === track.id ? activeCueIndex(cues, s.currentTime) : -1));
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the active line in view inside the transcript box (not the page).
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[active] as HTMLElement | undefined;
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top > list.scrollTop + list.clientHeight - item.clientHeight) {
      list.scrollTo({ top: top - list.clientHeight / 3, behavior: "smooth" });
    }
  }, [active]);

  if (cues.length === 0) {
    return <p className="text-muted">The transcript appears here once it is added.</p>;
  }

  return (
    <ol ref={listRef} className="max-h-[60vh] overflow-y-auto border-t border-ink" aria-label="Transcript">
      {cues.map((cue, i) => {
        const isActive = i === active;
        return (
          <li key={i} className="border-b border-rule">
            <button
              type="button"
              onClick={() => void play(track, cue.start)}
              aria-current={isActive ? "true" : undefined}
              className={`grid w-full grid-cols-[4rem_1fr] gap-4 py-3 pr-2 text-left transition-colors duration-200 ${
                isActive ? "bg-sun/60" : "hover:bg-cream"
              }`}
            >
              <span className="pl-2 font-mono text-xs leading-7 text-muted tabular-nums">{formatTime(cue.start)}</span>
              <span className="text-lg leading-relaxed">
                {cue.speaker && <span className="font-semibold">{cue.speaker}: </span>}
                {cue.text}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
