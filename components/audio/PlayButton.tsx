"use client";

import { play, toggle } from "@/lib/audio/engine";
import { formatTime } from "@/lib/audio/vtt";
import { useStore, type Track } from "@/lib/store";

/** "Play" or "Play from 03:12" for a track. Toggles pause if this track is already playing. */
export function PlayButton({
  track,
  startAt,
  label,
  className,
}: {
  track: Track;
  startAt?: number;
  label?: string;
  className?: string;
}) {
  const current = useStore((s) => s.track?.id === track.id);
  const playing = useStore((s) => s.track?.id === track.id && s.status === "playing");
  const text = label ?? (startAt ? `Play from ${formatTime(startAt)}` : "Play");

  return (
    <button
      type="button"
      onClick={() => (current && startAt === undefined ? toggle() : void play(track, startAt))}
      className={
        className ??
        "inline-flex w-fit items-center gap-2 self-start rounded-full bg-ink px-5 py-2.5 font-semibold text-paper transition-transform duration-300 ease-calm hover:-translate-y-0.5"
      }
    >
      <span aria-hidden="true">{playing && startAt === undefined ? "❚❚" : "▶"}</span>
      {playing && startAt === undefined ? "Pause" : text}
    </button>
  );
}
