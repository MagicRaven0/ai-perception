"use client";

import { useState } from "react";

/**
 * Click-to-load YouTube player (privacy-enhanced domain). Nothing loads from YouTube until the visitor
 * clicks, which keeps the page fast and avoids third-party cookies on load.
 */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const [on, setOn] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[4px] bg-night">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setOn(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-paper"
        >
          <span
            className="flex size-16 items-center justify-center rounded-full bg-paper text-xl text-ink"
            aria-hidden="true"
          >
            ▶
          </span>
          <span className="text-sm font-semibold">Play video: {title}</span>
          <span className="text-xs text-chart-text">Loads from YouTube</span>
        </button>
      )}
    </div>
  );
}
