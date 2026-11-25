"use client";

import { useRef } from "react";
import type { BuildingVideoData } from "@/lib/content/media";
import { BuildingVideo } from "@/components/media/BuildingVideo";
import { useDialog } from "./useDialog";

/**
 * A cinema or gallery building's video, full-screen over the world. Opens by itself when the visitor goes into
 * the building (see BuildingDrawer) and never again until they leave and come back; the drawer's "Watch the
 * video" button reopens it on purpose. The video is about 75% of the width (95% on phones), 16:9, on a
 * translucent dark backdrop so the world stays faintly visible. Sound, ducking of the island music and the
 * reduced-motion rule (opens, but does not autoplay) live in BuildingVideo.
 * Close: the × button, Esc, or a click on the backdrop. Focus stays inside while open and goes back to the
 * drawer's "Watch the video" button on close.
 */
export function VideoOverlay({ video, onClose }: { video: BuildingVideoData; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const pressedBackdrop = useRef(false);
  const { onKeyDown } = useDialog(ref, true, onClose, closeButton, "watch-video-button");

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      data-video-overlay=""
      onKeyDown={onKeyDown}
      // A click on the backdrop (pressed and released there, not a drag off the video's controls) closes.
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-modal flex items-center justify-center bg-coal/60 p-2 md:p-6"
    >
      <button
        ref={closeButton}
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-3 right-3 flex size-12 items-center justify-center rounded-full bg-snow text-2xl leading-none font-semibold text-coal shadow-pill-strong transition-colors hover:bg-sun focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-snow md:top-5 md:right-5"
      >
        <span aria-hidden="true">×</span>
      </button>
      <div className="w-[min(95vw,calc(80dvh*16/9))] text-snow md:w-[min(75vw,calc(80dvh*16/9))] [&_a]:text-snow [&_figcaption_p]:text-sm [&_figcaption_p]:text-snow">
        <BuildingVideo video={video} inside />
      </div>
    </div>
  );
}
