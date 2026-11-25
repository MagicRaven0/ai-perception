"use client";

import { useEffect, useRef } from "react";
import type { BuildingVideoData } from "@/lib/content/media";
import { pause as pauseEpisode } from "@/lib/audio/engine";
import { useStore } from "@/lib/store";

const episodeBusy = () => {
  const { status } = useStore.getState();
  return status === "playing" || status === "loading";
};

/**
 * One of our own looping animations, with its title under it. Its credit (and how it was made) is listed in the
 * credits on the About page, not here.
 * Nothing downloads until it plays (`preload="none"`).
 * - `inside` (3D drawer, i.e. the visitor went in): starts by itself, with sound. Muted if an episode is playing or
 *   the browser blocks sound; not started at all under reduced motion.
 * - otherwise (long-read): waits for the visitor.
 * While it is audible the island music is ducked (`videoSound` in the store), and it never talks over an episode:
 * turning its sound on pauses the episode, starting an episode pauses the video.
 */
export function BuildingVideo({ video, inside = false }: { video: BuildingVideoData; inside?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const { setVideoSound } = useStore.getState();
    let audible = false;
    const sync = () => {
      const now = !v.paused && !v.ended && !v.muted && v.volume > 0;
      if (now === audible) return;
      audible = now;
      setVideoSound(now);
      if (now && episodeBusy()) pauseEpisode();
    };
    const events = ["play", "playing", "pause", "volumechange"] as const;
    events.forEach((e) => v.addEventListener(e, sync));
    const unsubscribe = useStore.subscribe((s, prev) => {
      if (audible && s.status !== prev.status && s.status === "playing") v.pause();
    });

    let cancelled = false;
    if (inside && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.muted = episodeBusy();
      v.play().catch(() => {
        // Sound needs a tap first (deep link): play silently, the controls turn sound on.
        if (cancelled) return;
        v.muted = true;
        v.play().catch(() => {});
      });
    }
    return () => {
      cancelled = true;
      unsubscribe();
      events.forEach((e) => v.removeEventListener(e, sync));
      v.pause();
      if (audible) setVideoSound(false);
    };
  }, [inside, video.src]);

  return (
    <figure data-building-video="">
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        aria-label={video.title}
        controls
        loop
        playsInline
        preload="none"
        className="aspect-video w-full rounded-[4px] bg-night object-contain"
      />
      <figcaption className="mt-1.5 text-xs leading-snug text-muted">{video.title}</figcaption>
    </figure>
  );
}
