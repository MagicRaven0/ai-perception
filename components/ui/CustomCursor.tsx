"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Decorative cursor ring in the site's own style (docs/VISION.md, "Custom cursor").
 * - Desktop mouse only (pointer: fine). Phones and tablets keep normal touch.
 * - The real system cursor stays visible: this ring only trails it, so text selection, input carets and
 *   precise clicking are untouched. It never takes pointer events (pointer-events: none, aria-hidden).
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
    const pos = { x: -100, y: -100, tx: -100, ty: -100 };
    let mode: Mode = "idle";
    let raf = 0;
    let visible = false;

    const setMode = (next: Mode) => {
      if (next === mode) return;
      mode = next;
      el.dataset.mode = next;
      text.textContent = LABEL[next];
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      if (!visible) {
        visible = true;
        pos.x = pos.tx;
        pos.y = pos.ty;
        el.style.opacity = "1";
      }
      setMode(modeFor(e.target));
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };
    const tick = () => {
      // Trails the real cursor with a gentle ease (the calm, floaty Late Checkout feel).
      pos.x += (pos.tx - pos.x) * 0.22;
      pos.y += (pos.ty - pos.y) * 0.22;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ring}
      aria-hidden="true"
      data-mode="idle"
      className="group pointer-events-none fixed top-0 left-0 z-skip opacity-0 transition-opacity duration-200"
    >
      <span className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/60 transition-[width,height,background-color,border-color] duration-200 ease-calm group-data-[mode=drag]:size-12 group-data-[mode=drag]:border-orange group-data-[mode=link]:size-11 group-data-[mode=link]:border-ink group-data-[mode=link]:bg-ink/10 group-data-[mode=world]:size-10 group-data-[mode=world]:border-snow group-data-[mode=world]:bg-snow/15" />
      <span
        ref={label}
        className="absolute top-5 left-4 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-paper empty:hidden"
      />
    </div>
  );
}
