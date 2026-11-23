/**
 * Quality tiers (PLAN.md 6.4). The visitor picks Auto / High / Low in Options; on Auto, drei's
 * PerformanceMonitor moves the tier down (and back up) from measured frame rates.
 * No React, no three.js.
 */

import { detectCapabilities } from "./capabilities";

export type QualityPref = "auto" | "high" | "low";
export type Tier = "high" | "low";

export type TierSettings = {
  /** Device pixel ratio cap. */
  dpr: number;
  shadows: boolean;
  shadowMapSize: number;
  /** Fraction of decorative instances (trees, props) to draw. */
  decorDensity: number;
  /** Antialiasing is set at context creation, so it follows the first tier only. */
  antialias: boolean;
};

export const TIERS: Record<Tier, TierSettings> = {
  high: { dpr: 1.5, shadows: true, shadowMapSize: 1024, decorDensity: 1, antialias: true },
  low: { dpr: 1, shadows: false, shadowMapSize: 0, decorDensity: 0.55, antialias: false },
};

/** Budgets to check against in DevTools (r3f-perf or renderer.info). */
export const BUDGET: Record<Tier, { triangles: number; drawCalls: number }> = {
  high: { triangles: 150_000, drawCalls: 120 },
  low: { triangles: 60_000, drawCalls: 60 },
};

/** Starting tier for "auto": phones and small-memory devices start low. */
export function initialAutoTier(): Tier {
  if (typeof window === "undefined") return "high";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  if (coarse || detectCapabilities().softwareGl) return "low";
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 8) return "low";
  return "high";
}

/** Effective tier from the store's preference + the measured auto tier. Use as a store selector. */
export function selectTier(s: { quality: QualityPref; autoTier: Tier }): Tier {
  return s.quality === "auto" ? s.autoTier : s.quality;
}

/**
 * Resolution steps below Low, for machines that are still slow there. Only the number of pixels changes (nothing is
 * rebuilt), so stepping down is free. CPU-drawn 3D starts one step down.
 */
export const RES_STEPS = [1, 0.75, 0.55] as const;

export function startResStep(): number {
  return typeof window !== "undefined" && detectCapabilities().softwareGl ? 1 : 0;
}

/** Device pixel ratio for a tier (never above the screen's own ratio). `step` only applies to Low. */
export function dprFor(tier: Tier, step = 0): number {
  const device = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return Math.min(device, TIERS[tier].dpr) * (tier === "low" ? (RES_STEPS[step] ?? 1) : 1);
}
