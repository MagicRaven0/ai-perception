"use client";

import { useEffect } from "react";
import { ambience, type AmbienceLayer } from "@/content/ambience";
import type { EraId } from "@/lib/content/schema";
import { useStore } from "@/lib/store";

/**
 * World ambience: per-island lo-fi music + ambient loop (config: content/ambience.ts). DOM audio, rendered
 * by the HUD (not inside the canvas). Rules:
 * - off until the visitor turns it on (Options or the sound button), and remembered;
 * - crossfades when the active island changes;
 * - never fights the podcast player: fades out and pauses while an episode is playing or loading;
 * - files that do not exist yet are skipped silently (checked once with a HEAD request).
 */

type Slot = { layer: AmbienceLayer; el: HTMLAudioElement | null; available: boolean | null; target: number };

const slots = new Map<string, Slot>();
let timer: number | null = null;

function slotFor(layer: AmbienceLayer): Slot {
  let s = slots.get(layer.src);
  if (!s) {
    s = { layer, el: null, available: null, target: 0 };
    slots.set(layer.src, s);
  }
  return s;
}

async function ensure(slot: Slot) {
  if (slot.available === false || slot.el) return;
  if (slot.available === null) {
    try {
      const res = await fetch(slot.layer.src, { method: "HEAD" });
      slot.available = res.ok;
    } catch {
      slot.available = false;
    }
    if (!slot.available) return;
  }
  const el = new Audio(slot.layer.src);
  el.loop = true;
  el.preload = "auto";
  el.volume = 0;
  el.addEventListener("error", () => {
    slot.available = false;
    slot.el = null;
  });
  slot.el = el;
}

/** Ease every slot's volume toward its target; pause the silent ones. */
function step() {
  let moving = false;
  for (const s of slots.values()) {
    const el = s.el;
    if (!el) continue;
    const goal = s.target;
    const v = el.volume + (goal - el.volume) * 0.12;
    el.volume = Math.abs(v - goal) < 0.01 ? goal : v;
    if (el.volume !== goal) moving = true;
    if (goal > 0 && el.paused) void el.play().catch(() => (s.target = 0));
    if (goal === 0 && el.volume === 0 && !el.paused) el.pause();
  }
  if (!moving && timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

function apply(era: EraId | null) {
  for (const [id, layers] of Object.entries(ambience) as [EraId, (typeof ambience)[EraId]][]) {
    for (const layer of [layers.music, layers.sounds]) {
      const slot = slotFor(layer);
      slot.target = id === era ? layer.volume : 0;
      if (slot.target > 0) void ensure(slot).then(() => kick());
    }
  }
  kick();
}

function kick() {
  if (timer === null) timer = window.setInterval(step, 50);
}

export function Ambience() {
  const on = useStore((s) => s.ambienceOn);
  const era = useStore((s) => s.activeEra);
  const episodeBusy = useStore((s) => s.status === "playing" || s.status === "loading");

  useEffect(() => {
    apply(on && !episodeBusy ? era : null);
  }, [on, era, episodeBusy]);

  // Leaving /explore: silence everything.
  useEffect(
    () => () => {
      for (const s of slots.values()) {
        s.target = 0;
        s.el?.pause();
      }
    },
    [],
  );

  return null;
}
