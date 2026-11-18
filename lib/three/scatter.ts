import { angleDiff, type IslandLayout, type Vec3 } from "./layout";

/**
 * Deterministic decoration scatter (trees, bushes, lamps) for an island: avoids the ring road, the
 * connector roads, building plots, signposts, figures, the campus and the guide. Same input -> same output.
 * Pure maths, no three.js.
 */

/** Small seeded PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ScatterItem = { position: Vec3; scale: number; rotationY: number; variant: number };

export type ScatterOptions = {
  count: number;
  seed?: number;
  /** Keep this far from the island rim (m). */
  rimMargin?: number;
  /** Extra clearance around the road edges (m). */
  roadMargin?: number;
  /** Extra clearance around plots, signs and figures (m). */
  itemMargin?: number;
  /** Only place inside the ring road ("inner"), outside it ("outer"), or both. */
  zone?: "inner" | "outer" | "both";
  minScale?: number;
  maxScale?: number;
  variants?: number;
};

export function scatterOnIsland(island: IslandLayout, opts: ScatterOptions): ScatterItem[] {
  const {
    count,
    seed = island.eraId.charCodeAt(4) * 977,
    rimMargin = 2.5,
    roadMargin = 1.5,
    itemMargin = 1.5,
    zone = "both",
    minScale = 0.8,
    maxScale = 1.35,
    variants = 3,
  } = opts;
  const g = island.geometry;
  const [cx, cz] = g.center;
  const rand = rng(seed);
  const roadIn = g.roadRadius - g.roadWidth / 2 - roadMargin;
  const roadOut = g.roadRadius + g.roadWidth / 2 + roadMargin;
  const out: ScatterItem[] = [];

  const blockers: { x: number; z: number; r: number }[] = [
    ...island.buildings.map((b) => ({
      x: b.position[0],
      z: b.position[2],
      r: Math.hypot(b.plot.width, b.plot.depth) / 2 + itemMargin,
    })),
    ...island.insights.map((s) => ({ x: s.position[0], z: s.position[2], r: 1.5 + itemMargin })),
    ...island.figures.map((f) => ({ x: f.position[0], z: f.position[2], r: 3 + itemMargin })),
  ];
  if (island.guide) blockers.push({ x: island.guide.position[0], z: island.guide.position[2], r: 3 + itemMargin });

  let tries = 0;
  while (out.length < count && tries < count * 40) {
    tries++;
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (g.radius - rimMargin);
    if (r > roadIn && r < roadOut) continue;
    if (zone === "inner" && r >= roadIn) continue;
    if (zone === "outer" && r <= roadOut) continue;
    if (island.campus && r < island.campus.radius + 2) continue;
    // Connector roads to bridges.
    if (r > g.roadRadius && g.bridgeAngles.some((b) => angleDiff(angle, b) * r < g.roadWidth / 2 + roadMargin + 1))
      continue;
    const x = cx + Math.cos(angle) * r;
    const z = cz + Math.sin(angle) * r;
    if (blockers.some((b) => Math.hypot(b.x - x, b.z - z) < b.r)) continue;
    if (out.some((o) => Math.hypot(o.position[0] - x, o.position[2] - z) < 2.2)) continue;
    out.push({
      position: [x, 0, z],
      scale: minScale + rand() * (maxScale - minScale),
      rotationY: rand() * Math.PI * 2,
      variant: Math.floor(rand() * variants),
    });
  }
  return out;
}
