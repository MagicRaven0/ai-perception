import { angleDiff, headingOf, polar, wrapAngle, type IslandLayout, type Vec3 } from "@/lib/three/layout";
import { CAMERA_AZIMUTH } from "@/lib/three/camera";

/**
 * Future island planning (pure maths, no three.js): splits the outer belt into city lots between the
 * content buildings, and decides which lot gets which landmark. Everything follows the content-driven layout,
 * so adding or removing a building moves the city around it instead of overlapping it.
 *
 * Lot frame: origin on the lot centre line, local +Z faces the ring road (like a building), local X runs
 * along the road. Usable depth: from LOT_FRONT (road side) back to -LOT_BACK.
 */

export type LotUse = "monoliths" | "comparison" | "servers" | "city";

export type Lot = {
  id: string;
  angle: number;
  /** World position of the lot origin (on the ground). */
  position: Vec3;
  /** Heading: local +Z faces the ring road. */
  rotationY: number;
  /** Half width along the road (m). */
  halfWidth: number;
  /** -1 (far from the camera: tall things are fine) .. 1 (between camera and road: keep low). */
  facing: number;
  /**
   * True when the lot stands just camera-side of a content building (screen-below it): a tower there would hide
   * the building, so the lot keeps low decor (cityTowers treats it like a camera-side lot).
   */
  lowRise: boolean;
  use: LotUse;
  /** Index among the city lots (for variety). */
  index: number;
};

/** Road-side edge of a lot (local +Z) and its back edge (local -Z). */
export const LOT_FRONT = 5.2;
export const LOT_BACK = 9.5;

/** Polar angle (XZ) of the camera's side of an island: tall decor there would hide the road. */
const CAMERA_SIDE = Math.atan2(Math.cos(CAMERA_AZIMUTH), Math.sin(CAMERA_AZIMUTH));

/** Tallest city tower (designs.ts cityTowers: 7 + 9 + 3 m). */
const TALLEST_TOWER = 19;
/** Ground a tower of height H hides behind it under the 42 degree camera: H / tan(42) ~ 1.1 H. */
const HIDDEN_BEHIND = TALLEST_TOWER * 1.15;

/**
 * True when a lot at `p` (half width `hw`) is camera-side of any content building and close enough for a tower
 * on it to cover that building on screen.
 */
function hidesBuilding(layout: IslandLayout, p: Vec3, hw: number): boolean {
  // Unit vector from the scene towards the camera (XZ).
  const cx = Math.sin(CAMERA_AZIMUTH);
  const cz = Math.cos(CAMERA_AZIMUTH);
  return layout.buildings.some((b) => {
    const dx = b.position[0] - p[0];
    const dz = b.position[2] - p[2];
    const behind = -(dx * cx + dz * cz); // > 0: the building is further from the camera than the lot
    const across = Math.abs(dx * cz - dz * cx);
    return behind > -hw && behind < HIDDEN_BEHIND && across < b.plot.width / 2 + hw;
  });
}

export function planLots(layout: IslandLayout): Lot[] {
  const g = layout.geometry;
  const { center, roadRadius: rr, roadWidth: rw } = g;
  const rLot = rr + rw / 2 + 0.45 + 2 + LOT_FRONT;
  const spacing = g.plot.width + 4;
  const count = Math.max(1, Math.floor((Math.PI * 2 * rLot) / spacing));
  const step = (Math.PI * 2) / count;
  const halfWidth = Math.min(7.2, (step * rLot) / 2 - 0.8);

  const free: Omit<Lot, "use" | "index">[] = [];
  for (let i = 0; i < count; i++) {
    const angle = wrapAngle(g.entryAngle + step * (i + 0.5));
    // Clear of the connector roads out to the bridges.
    if (g.bridgeAngles.some((b) => angleDiff(angle, b) * rLot < rw / 2 + halfWidth + 2.5)) continue;
    // Clear of building plots (and their signposts beside them).
    if (
      layout.buildings.some((b) => !b.sources && angleDiff(angle, b.angle) * rLot < b.plot.width / 2 + halfWidth + 2.5)
    )
      continue;
    const position = polar(center, angle, rLot);
    // Clear of any signpost or figure standing in the outer belt.
    const blocked = [...layout.insights.map((s) => s.position), ...layout.figures.map((f) => f.position)].some(
      (q) => Math.hypot(q[0] - position[0], q[2] - position[2]) < halfWidth + 2,
    );
    if (blocked) continue;
    free.push({
      id: `lot-${i}`,
      angle,
      position,
      rotationY: headingOf(-Math.cos(angle), -Math.sin(angle)),
      halfWidth,
      facing: Math.cos(angleDiff(angle, CAMERA_SIDE)),
      lowRise: hidesBuilding(layout, position, halfWidth),
    });
  }

  // Landmarks first: the monoliths stand tall, so they go furthest from the camera. The comparison plaza goes
  // to the lot nearest the arrival bridge whose front faces the camera (facing <= ~0: its exhibits face the
  // road, so on the camera side we would only see their backs); the server yard reads from any side and takes
  // the nearest remaining lot. The rest becomes city.
  const used = new Set<string>();
  const assign = new Map<string, LotUse>();
  const take = (lot: (typeof free)[number] | undefined, use: LotUse) => {
    if (!lot) return;
    used.add(lot.id);
    assign.set(lot.id, use);
  };
  // The monoliths are tall: never on a lot that would hide a content building.
  const byFar = [...free].sort((a, b) => Number(a.lowRise) - Number(b.lowRise) || a.facing - b.facing);
  take(byFar[0], "monoliths");
  const byArrival = () =>
    free
      .filter((l) => !used.has(l.id))
      .sort((a, b) => angleDiff(a.angle, g.entryAngle) - angleDiff(b.angle, g.entryAngle));
  take(byArrival().find((l) => l.facing < 0.15) ?? byArrival()[0], "comparison");
  take(byArrival()[0], "servers");

  let city = 0;
  return free.map((l) => {
    const use = assign.get(l.id) ?? "city";
    return { ...l, use, index: use === "city" ? city++ : 0 };
  });
}

/** Local (lot frame) -> world, for the few things that need world coordinates (scatter filtering). */
export function insideLot(lot: Lot, x: number, z: number, margin = 0): boolean {
  const dx = x - lot.position[0];
  const dz = z - lot.position[2];
  // Inverse-rotate by the heading: local x axis = (cos h, -sin h), local z axis = (sin h, cos h).
  const c = Math.cos(lot.rotationY);
  const s = Math.sin(lot.rotationY);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) < lot.halfWidth + margin && lz < LOT_FRONT + margin && lz > -LOT_BACK - margin;
}
