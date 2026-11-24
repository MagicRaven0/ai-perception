"use client";

import type { EraId } from "@/lib/content/schema";
import { useStore } from "@/lib/store";
import { nearestEra, type Pose, type WorldLayout } from "@/lib/three/layout";
import { player, requestTeleport } from "@/lib/three/transient";

/** "I'm stuck" (R key / Options): back to the spawn of the island you are on. */
export function respawn(world: WorldLayout) {
  const era = nearestEra(world, player.x, player.z);
  requestTeleport(world.islands[era].spawn);
  useStore.getState().setActiveEra(era);
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Fast travel (PLAN 6.2): fade to black, move the car to the island's spawn, fade back.
 * `fade` is the overlay element (opacity transition in CSS); with reduced motion it cuts instantly.
 */
export function fastTravel(world: WorldLayout, era: EraId, fade: HTMLElement | null) {
  fastTravelTo(world.islands[era].spawn, fade, era);
}

/** The same, to any pose (the team island belongs to no era: the current one stays active). */
export function fastTravelTo(pose: Pose, fade: HTMLElement | null, era?: EraId) {
  const s = useStore.getState();
  s.closeBuilding();
  const go = () => {
    requestTeleport(pose);
    if (era) s.setActiveEra(era);
  };
  if (!fade || reducedMotion()) {
    go();
    return;
  }
  fade.style.opacity = "1";
  window.setTimeout(() => {
    go();
    // Two frames so the camera has snapped before the fade lifts.
    requestAnimationFrame(() => requestAnimationFrame(() => (fade.style.opacity = "0")));
  }, 380);
}
