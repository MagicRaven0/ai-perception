import { ERA_PALETTE, SHARED } from "@/lib/three/palette";

/**
 * THE JOBS ERA (era-2) island colours. Owned by the Jobs Era island (components/three/islands/IslandJobsEra.tsx).
 * Spreads the shared era palette and adds the extra hexes the island's models and decor use:
 * platinum + pink, desk-computer beige, friendly pastels, lime/yellow-green trees (Late Checkout look).
 * Plain strings only (no three.js).
 */

const ERA = ERA_PALETTE["era-2"];

export const JOBS = {
  ...ERA,
  // Era identity
  platinum: "#d8d2c4",
  platinumDark: "#bfb8a6",
  pink: "#ff87a2",
  pinkSoft: "#ffd6df",
  pinkDeep: "#e8647f",
  /** The one glow colour on this island (StaticMerge buckets by emissive hex, so keep it single). */
  glow: "#ff87a2",
  // Desk computers (generic beige-box geometry)
  beige: "#e9e0c8",
  beigeShade: "#d6cbb0",
  screen: "#2c3440",
  screenLit: "#bfe9ee",
  // Friendly town pastels
  white: SHARED.snow,
  cream: SHARED.cream,
  creamShade: SHARED.creamShade,
  sky: "#9ee3ea",
  skyDeep: "#6cc4d4",
  butter: "#fee163",
  mint: "#bfe8c9",
  lilac: "#cfc4ee",
  peach: "#ffc9a8",
  orange: SHARED.orange,
  ink: SHARED.ink,
  charcoal: "#3a3a36",
  wood: "#c9a57a",
  woodDark: "#8a6a4a",
  water: "#8fd6e0",
  hedge: "#5f9e3c",
  // Lime / yellow-green trees (Late Checkout town)
  treeLeaves: ["#a8c94a", "#c9d84a", "#8fbf4a", "#d4e157"],
} as const;

export type JobsPalette = typeof JOBS;
