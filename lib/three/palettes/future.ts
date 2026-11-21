import { ERA_PALETTE, SHARED, type EraPalette } from "@/lib/three/palette";

/**
 * The Future (era-3) island colours. Owned by the Future island work (IslandFuture.tsx + islands/future/).
 *
 * Look: a dense data city with lime #D5FF95 glow on night #141414 accents, but still readable in daylight:
 * the lawn and roads follow the shared Late Checkout ground (deep green, cream road), the buildings are pale
 * concrete and graphite with lime light strips. Glow is over-bright albedo, not emissive (islands/future/kit.tsx:
 * it costs no draw call of its own; the brief asked for emissive glow, traded for draw calls), no post-processing.
 */
export type FuturePalette = EraPalette & {
  /** Pale concrete (main walls, plazas). */
  concrete: string;
  concreteShade: string;
  /** Paving inside the city lots and plazas. */
  paving: string;
  /** Graphite trims, racks, monoliths (the "night" accent). */
  graphite: string;
  graphiteSoft: string;
  night: string;
  /** Glass panes (opaque, flat: transparency would break the merge). */
  glass: string;
  glassDark: string;
  /** Lime glow (emissive) and the 1956 phosphor green (comparison plaza only). */
  lime: string;
  phosphor: string;
  /** An unlit 1956 phosphor lamp (the comparison plaza's blinking panel, "off" step). */
  phosphorOff: string;
  /** 1956 manila (comparison plaza mainframe). */
  manila: string;
  /** White details (the guide's speech bubble). */
  snow: string;
  /** Small coloured details (gallery art, chairs). */
  pink: string;
  sky: string;
  plum: string;
  orange: string;
  /** Tree crowns: lime and yellow-green (Late Checkout trees). */
  treeLeaves: string[];
};

const base = ERA_PALETTE["era-3"];

export const FUTURE_PALETTE: FuturePalette = {
  ...base,
  // Daylight-readable ground: shared deep green lawn, cream road, lime curb.
  ground: SHARED.groundGreen,
  road: SHARED.cream,
  curb: "#d5ff95",
  buildings: ["#e9e6dd", "#d9d6cc", "#f3f1ea", "#cfcbc0"],
  roofs: ["#3a3a36", "#2b2b2b", "#4a4a44"],
  leaves: [SHARED.leaf, SHARED.leafYellow, SHARED.leafDeep],
  trunk: SHARED.trunk,

  concrete: "#e9e6dd",
  concreteShade: "#cfcbc0",
  paving: "#efece4",
  graphite: "#2b2b2b",
  graphiteSoft: "#4a4a44",
  night: SHARED.night,
  glass: "#a9dfe6",
  glassDark: "#33424a",
  lime: "#d5ff95",
  phosphor: "#3bd16f",
  phosphorOff: "#1f4a2e",
  manila: "#e8d9b0",
  snow: SHARED.snow,
  pink: "#ff87a2",
  sky: "#9ee3ea",
  plum: SHARED.plum,
  orange: SHARED.orange,
  treeLeaves: [SHARED.leaf, SHARED.leafYellow, SHARED.leafDeep, "#d5ff95"],
};
