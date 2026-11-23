"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor ring in the site's own style (docs/VISION.md, "Custom cursor"). It replaces the system cursor.
 * - Desktop mouse only (pointer: fine). Phones and tablets keep normal touch.
 * - The system cursor is hidden (`custom-cursor` on <html>, globals.css), so the ring sits exactly on the pointer, with
 *   no trailing, and has a light and a dark edge to stay visible on any background. Embedded players and fullscreen
 *   video keep the system cursor. It never takes pointer events (pointer-events: none, aria-hidden).
 * - Grows over links and buttons, says "Drag" over sliders and "Drag to turn" over the 3D world.
 * - Off with prefers-reduced-motion and in forced-colours (high contrast) mode.
 */

type Mode = "idle" | "link" | "drag" | "world";

const LABEL: Record<Mode, string> = { idle: "", link: "", drag: "Drag", world: "Drag to turn" };

function modeFor(target: EventTarget | null): Mode {
  if (!(target instanceof Element)) return "idle";
  if (target.closest('input[type="range"], [data-cursor="drag"]')) return "drag";
  if (target.closest("a, button, [role='button'], label, select, summary")) return "link";
  if (target.closest("canvas")) return "world";
  return "idle";
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  // Only on a fine pointer, without reduced motion or forced colours (re-checked live).
  useEffect(() => {
    const queries = [
      window.matchMedia("(pointer: fine)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(forced-colors: active)"),
    ];
    const update = () => setEnabled(queries[0].matches && !queries[1].matches && !queries[2].matches);
    update();
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ring.current;
    const text = label.current;
    if (!el || !text) return;
    let mode: Mode = "idle";
    const root = document.documentElement;
    root.classList.add("custom-cursor");

    const setMode = (next: Mode) => {
      if (next === mode) return;
      mode = next;
      el.dataset.mode = next;
      text.textContent = LABEL[next];
    };
    const place = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      place(e);
      el.style.opacity = "1";
      setMode(modeFor(e.target));
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };
    // Inside an embedded player the page gets no pointer events: the frame's own cursor takes over.
    const onOver = (e: PointerEvent) => {
      if (e.target instanceof HTMLIFrameElement) onLeave();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeave);
      root.classList.remove("custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ring}
      aria-hidden="true"
      data-mode="idle"
      className="group pointer-events-none fixed top-0 left-0 z-skip opacity-0"
    >
      <span className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-snow ring-[1.5px] ring-coal transition-[width,height,background-color,border-color] duration-200 ease-calm group-data-[mode=drag]:size-12 group-data-[mode=drag]:border-orange group-data-[mode=link]:size-10 group-data-[mode=link]:bg-snow/25 group-data-[mode=world]:size-9 group-data-[mode=world]:bg-snow/15" />
      <span
        ref={label}
        className="absolute top-5 left-4 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-paper empty:hidden"
      />
    </div>
  );
}
