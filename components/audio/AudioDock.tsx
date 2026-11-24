"use client";

import Link from "next/link";
import { useEffect } from "react";
import { restore, seek, seekBy, setRate, toggle } from "@/lib/audio/engine";
import { formatTime } from "@/lib/audio/vtt";
import { useStore } from "@/lib/store";
import { isPlaceholder, placeholderLabel } from "@/lib/content/placeholder";

const RATES = [1, 1.25, 1.5, 0.75];

/**
 * Bottom audio dock. Mounted once in the root layout, so it (and the audio) survives every route change.
 * 72px tall on desktop, 56px on phones.
 */
export function AudioDock() {
  const track = useStore((s) => s.track);
  const status = useStore((s) => s.status);
  const currentTime = useStore((s) => s.currentTime);
  const duration = useStore((s) => s.duration);
  const rate = useStore((s) => s.rate);

  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).then(() => restore());
  }, []);

  const playing = status === "playing" || status === "loading";
  const total = duration || track?.durationSec || 0;

  return (
    // Not fully opaque: when the CPU draws the page (no graphics acceleration), Brave/Chromium cuts the wrong edge off
    // a canvas lying under a fully opaque bar. No blur either: it is redrawn on every 3D frame.
    <div
      role="region"
      aria-label="Audio player"
      className="fixed inset-x-0 bottom-0 z-audio h-14 border-t border-rule bg-paper/95 md:h-[72px]"
    >
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-3 px-4 md:gap-5 md:px-12">
        {track ? (
          <>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper md:size-11"
            >
              <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
            </button>
            <button
              type="button"
              onClick={() => seekBy(-15)}
              aria-label="Back 15 seconds"
              className="hidden text-sm font-semibold text-muted hover:text-ink md:block"
            >
              −15
            </button>
            <button
              type="button"
              onClick={() => seekBy(15)}
              aria-label="Forward 15 seconds"
              className="hidden text-sm font-semibold text-muted hover:text-ink md:block"
            >
              +15
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 items-baseline gap-2">
                <Link href={`/listen/${track.id}`} className="truncate text-sm font-semibold hover:underline">
                  {isPlaceholder(track.title) ? placeholderLabel(track.title) : track.title}
                </Link>
                <span className="hidden shrink-0 text-xs text-muted sm:inline">
                  {track.kindLabel}
                  {track.eraLabel ? ` · ${track.eraLabel}` : ""}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={total || 1}
                step={0.5}
                value={Math.min(currentTime, total || 1)}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Seek"
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(total)}`}
                className="h-1 w-full accent-ink"
              />
            </div>

            <span className="shrink-0 text-xs text-muted tabular-nums">
              {formatTime(currentTime)} / {formatTime(total)}
            </span>
            <button
              type="button"
              onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1)}
              aria-label={`Playback speed ${rate}x`}
              className="hidden w-12 shrink-0 rounded-full border border-rule py-1 text-xs font-semibold sm:block"
            >
              {rate}×
            </button>
            <Link
              href={`/listen/${track.id}`}
              className="hidden shrink-0 text-sm font-semibold underline-offset-2 hover:underline md:block"
            >
              Transcript
            </Link>
            {status === "error" && <span className="text-xs text-danger">Audio could not load</span>}
          </>
        ) : (
          <p className="text-sm text-muted">
            Podcasts and interviews play here while you read or explore.{" "}
            <Link href="/listen" className="font-semibold text-ink underline underline-offset-2">
              Browse episodes
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
