import { SHARED } from "@/lib/three/palette";

/**
 * AUS mini campus colours (3D materials only). Kept here because the campus folder is the campus owner's
 * only folder; the foundation owner may move these into lib/three/palettes/ later.
 *
 * Sources actually consulted (modelling reference only; no photo, logo or texture was downloaded or copied):
 * - Wikipedia, "American University of Sharjah" (12 academic buildings at the centre of the campus);
 * - aus.edu, AUS 3D campus map PDF (Main Building at the head of the campus, colleges around it);
 * - T-Square blog, "A Day in The American University of Sharjah" (2013): buildings lining the sides of a
 *   large rectangular open space with the largest building at the far end; mostly domed, symmetrical blocks
 *   with the same facade on every side, mixing classical and Islamic features, separated by greenery.
 * The colours themselves are stylisation, not sourced fact: sand-cream stone and a pale dome for the regional
 * style, a pink bougainvillea accent and pool blue for warmth. Paving and kerb follow the Late Checkout-style
 * world (SHARED cream road).
 * The lime glow comes from the era-3 palette (passed in as `palette.accent`), not from here.
 */
export const CAMPUS = {
  /** Lit stone: cornices, pavilions, arcade screens. */
  stone: "#efe4cb",
  /** Main wall mass seen through the arcades (reads as shade behind the colonnade). */
  stoneShade: "#d8c7a2",
  /** Academic hall walls (between lit stone and shade, so the halls read a step behind the porticoes). */
  stoneMid: "#e6d7b6",
  /** Deep arch recesses and portals. */
  recess: "#a88f67",
  /** Pale ribbed dome. */
  dome: "#f6efdd",
  /** Plinths, kerbs, pool rims. */
  plinth: "#e2d4b4",
  /** Paths and forecourt (the world's cream road colour). */
  paving: SHARED.cream,
  /** Campus edge kerb. */
  kerb: SHARED.creamShade,
  /** Lawns: a touch brighter than the island ground so the campus reads as a garden. */
  lawn: "#2f8a68",
  /** Pool and fountain water. */
  water: "#8fd6dc",
  /** Fountain jets (lighter than the pool, so they read against it). */
  jet: "#e4f7f6",
  palmTrunk: "#9a7a55",
  palmLeaf: "#6fa83a",
  palmLeafLight: "#8fbf4a",
  /** Bougainvillea beds. */
  flower: "#e2589a",
  /** Lamp posts and benches. */
  metal: SHARED.ink,
  wood: "#8a6a4a",
  /** Name sign plate behind the text. */
  signPlate: "#1c1c1a",
  signText: SHARED.cream,
} as const;
