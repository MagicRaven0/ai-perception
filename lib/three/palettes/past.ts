import { ERA_PALETTE, SHARED } from "@/lib/three/palette";

/**
 * THE PAST (era-1, 1950s) extra colours. Owned by the past island (components/three/islands/past/).
 * Manila + phosphor green from the era palette, plus the cold-ish academic materials of a 1950s campus
 * computing lab: stone, college brick, slate roofs, grey steel cabinets, chalkboard green.
 * Plain strings only (no three.js import).
 */
export const PAST = {
  ...ERA_PALETTE["era-1"],
  manila: "#e8d9b0",
  manilaLight: "#f2e7c9",
  manilaDark: "#cdbd90",
  phosphor: "#3bd16f",
  /** Unlit lamp on a cabinet panel. */
  phosphorDim: "#1e5236",
  /** Lamps that stay on (screens, scopes). */
  phosphorSoft: "#8ff0ad",
  /** Cut stone (plinths, columns, trims). */
  stone: "#ddd5c1",
  stoneLight: "#ece6d6",
  stoneDark: "#b8af99",
  /** College brick. */
  brick: "#b7684d",
  brickDark: "#94523d",
  /** Slate roofs. */
  slate: "#5f6b6d",
  slateDark: "#4a5456",
  /** Mainframe steel (cool grey, the "cold" note). */
  steel: "#aeb7b3",
  steelLight: "#c9d0cc",
  steelDark: "#7d8986",
  /** Panel face behind the lamps. */
  panel: "#2f3a38",
  /** Glass panes (opaque, pale; transparency would break merging). */
  glass: "#bfe3df",
  glassDark: "#8fbdb8",
  chalkboard: "#2f4a3f",
  chalk: "#f1efe6",
  wood: "#8a6a4a",
  woodDark: "#6b4f36",
  woodLight: "#b08a62",
  brass: "#b8923f",
  iron: "#2e3230",
  hedge: "#2f6b45",
  water: "#9fd6d2",
  /** Tape on reels. */
  tape: "#4a3b2e",
  /** Pale aluminium flanges of the tape reels. */
  reelFlange: "#d7dbd6",
  red: "#c8553d",
  ink: SHARED.ink,
  cream: SHARED.cream,
  creamShade: SHARED.creamShade,
  leaf: SHARED.leaf,
  leafYellow: SHARED.leafYellow,
  leafDeep: SHARED.leafDeep,
  /** Paved paths and the central plaza. */
  paving: "#efe6cf",
  pavingDark: "#ddd0ad",
} as const;
