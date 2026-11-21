"use client";

import { useEffect, type KeyboardEvent, type ReactNode } from "react";
import { releaseInputs, setInput } from "@/lib/three/transient";

/**
 * Touch controls (PLAN 6.5, revised 21 Nov 2026), shown on coarse pointers only:
 * - an arrow pad bottom-left (hold Up to drive, Down to brake / reverse, Left / Right to steer);
 * - a hold-to-Boost button bottom-right;
 * - or simply tap a spot on the ground and the car drives there by itself (CameraRig + Vehicle).
 * All sit above the audio mini-bar and the chat button. The interact button is the prompt's own
 * "Tap to open / Tap to talk" (InteractPrompt), which sits ABOVE this row on touch layouts (the pad reaches
 * about 184px from the bottom, Boost 192px; the prompt starts at 14.5rem = 232px). Buttons write the transient
 * `input` directly (no re-renders). Keyboard users have the same actions on keys (see the Controls panel).
 */

type Dir = "forward" | "backward" | "left" | "right";

export function MobileControls() {
  useEffect(() => releaseInputs, []);

  const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

  return (
    <div className="hidden [@media(pointer:coarse)]:block">
      <div
        data-touch-pad=""
        role="group"
        aria-label="Drive"
        className="fixed bottom-16 left-[max(0.75rem,env(safe-area-inset-left))] z-hud grid grid-cols-3 grid-rows-2 gap-1.5"
      >
        <span />
        <HoldButton dir="forward" label="Forward" className="col-start-2" focusRing={focusRing}>
          <path d="M12 6 5 15h14z" />
        </HoldButton>
        <span />
        <HoldButton dir="left" label="Steer left" focusRing={focusRing}>
          <path d="M6 12 15 5v14z" />
        </HoldButton>
        <HoldButton dir="backward" label="Brake or reverse" focusRing={focusRing}>
          <path d="M12 18 5 9h14z" />
        </HoldButton>
        <HoldButton dir="right" label="Steer right" focusRing={focusRing}>
          <path d="M18 12 9 5v14z" />
        </HoldButton>
      </div>
      <div className="fixed right-4 bottom-[8.5rem] z-hud">
        <HoldButton dir="boost" label="Boost" focusRing={focusRing} text>
          Boost
        </HoldButton>
      </div>
    </div>
  );
}

/** A press-and-hold button that sets one transient input while held (touch, mouse, Enter / Space). */
function HoldButton({
  dir,
  label,
  className,
  focusRing,
  text,
  children,
}: {
  dir: Dir | "boost";
  label: string;
  className?: string;
  focusRing: string;
  text?: boolean;
  children: ReactNode;
}) {
  const set = (down: boolean) => setInput(dir, down);
  const key = (down: boolean) => (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    set(down);
  };
  return (
    <button
      type="button"
      aria-label={text ? undefined : label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onLostPointerCapture={() => set(false)}
      onKeyDown={key(true)}
      onKeyUp={key(false)}
      onBlur={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex touch-none items-center justify-center rounded-full bg-paper font-semibold text-ink shadow-pill-strong select-none active:bg-ink active:text-paper ${
        text ? "size-14 text-sm" : "size-[3.25rem]"
      } ${focusRing} ${className ?? ""}`}
    >
      {text ? (
        children
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {children}
        </svg>
      )}
    </button>
  );
}
