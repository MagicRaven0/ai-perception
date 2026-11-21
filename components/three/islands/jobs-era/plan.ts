import type { IslandLayout } from "@/lib/three/layout";
import { angleDiff } from "@/lib/three/layout";
import { rng, scatterOnIsland, type ScatterItem } from "@/lib/three/scatter";

/**
 * THE JOBS ERA decor plan: where every non-content piece goes. Pure maths, no three.js, deterministic.
 *
 * The inner lawn is laid out in SCREEN axes (the isometric camera looks from the back-left, lib/three/camera):
 * `u` runs to the right of the screen, `v` runs up the screen (away from the camera). So the landmarks read
 * left to right: desk-computer sculpture garden, giant pointer on the central plaza, voice-waveform, with the
 * window-and-icon wall behind and the fountain in front. The outer lawn gets a ring of small studio houses in
 * the gaps between content buildings, plus lamps, a phone box and picnic tables.
 *
 * Content (buildings, signposts, figures) always wins: any decor piece that would overlap a content item, the
 * ring road or a bridge road is dropped, so adding buildings later just thins the decor, it never collides.
 */

export type DecorKind =
  | "plaza"
  | "fountain"
  | "desktopWall"
  | "waveform"
  | "crt"
  | "tower"
  | "laptop"
  | "picnic"
  | "bench"
  | "lamp"
  | "house"
  | "phoneBox"
  | "bikeRack"
  | "flowerBed";

export type DecorItem = {
  kind: DecorKind;
  /** World position on the lawn (y = 0). */
  x: number;
  z: number;
  /** Heading about Y; local +Z is the front. */
  rotY: number;
  variant: number;
  /** Keep-out radius (m). */
  r: number;
};

export type PathStrip = { x: number; z: number; rotY: number; length: number; width: number };

export type JobsPlan = {
  items: DecorItem[];
  paths: PathStrip[];
  trees: ScatterItem[];
};

/** Screen-right and screen-up directions on the ground (camera azimuth -PI/4). */
const U: [number, number] = [Math.SQRT1_2, Math.SQRT1_2];
const V: [number, number] = [Math.SQRT1_2, -Math.SQRT1_2];
/** Heading whose local +Z points at the camera. */
export const FACE_CAMERA = -Math.PI / 4;

type Circle = { x: number; z: number; r: number };

function contentBlockers(layout: IslandLayout): Circle[] {
  return [
    ...layout.buildings.map((b) => ({
      x: b.position[0],
      z: b.position[2],
      r: Math.hypot(b.plot.width, b.plot.depth) / 2 + 0.5,
    })),
    // The sensor pad in front of each building stays clear too (the car pulls up there).
    ...layout.buildings.map((b) => ({ x: b.sensor.position[0], z: b.sensor.position[2], r: 2.5 })),
    ...layout.insights.map((s) => ({ x: s.position[0], z: s.position[2], r: 1.8 })),
    ...layout.figures.map((f) => ({ x: f.position[0], z: f.position[2], r: 3.4 })),
  ];
}

/** True when a circle (x, z, r) touches the ring road, a bridge road, or the island rim. */
function onRoadOrRim(layout: IslandLayout, x: number, z: number, r: number): boolean {
  const g = layout.geometry;
  const dx = x - g.center[0];
  const dz = z - g.center[1];
  const rho = Math.hypot(dx, dz);
  if (rho + r > g.radius - 1.2) return true;
  if (Math.abs(rho - g.roadRadius) < g.roadWidth / 2 + 0.9 + r) return true;
  for (const b of g.bridgeAngles) {
    const along = dx * Math.cos(b) + dz * Math.sin(b);
    const across = Math.abs(-dx * Math.sin(b) + dz * Math.cos(b));
    if (along > g.roadRadius - g.roadWidth && across < g.roadWidth / 2 + 1 + r) return true;
  }
  return false;
}

export function planJobsEra(layout: IslandLayout): JobsPlan {
  const g = layout.geometry;
  const [cx, cz] = g.center;
  const blockers = contentBlockers(layout);
  const items: DecorItem[] = [];

  const free = (x: number, z: number, r: number) =>
    !onRoadOrRim(layout, x, z, r) &&
    !blockers.some((b) => Math.hypot(b.x - x, b.z - z) < b.r + r) &&
    !items.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r);

  /** Place at screen coordinates (u right, v up) relative to the island centre. */
  const at = (u: number, v: number): [number, number] => [cx + u * U[0] + v * V[0], cz + u * U[1] + v * V[1]];
  const add = (kind: DecorKind, x: number, z: number, rotY: number, r: number, variant = 0) => {
    if (!free(x, z, r)) return false;
    items.push({ kind, x, z, rotY, r, variant });
    return true;
  };
  const addUV = (kind: DecorKind, u: number, v: number, rotY: number, r: number, variant = 0) => {
    const [x, z] = at(u, v);
    return add(kind, x, z, rotY, r, variant);
  };

  /* ---- inner lawn: the design-studio square (landmarks first, so they win their spots) */
  addUV("plaza", 0, 0, FACE_CAMERA, 6.4);
  // The wall is about 10.6 m wide: its two wings must be clear of content too (a future inner-ring plot),
  // so it is only placed when the centre and both wing circles are free.
  if ([-4, 4].every((w) => free(...at(w, 10.6), 2.4))) addUV("desktopWall", 0, 10.6, FACE_CAMERA, 3.2);
  const wallPlaced = items.some((i) => i.kind === "desktopWall");
  addUV("waveform", 10.4, 2.6, FACE_CAMERA, 3.4);
  addUV("fountain", 0, -10.2, FACE_CAMERA, 2.9);
  addUV("crt", -8.4, 4.2, FACE_CAMERA + 0.25, 2.6);
  addUV("tower", -13.6, 3.0, FACE_CAMERA + 0.1, 2.6);
  addUV("laptop", -9.0, -3.6, FACE_CAMERA + 0.35, 2.6);
  addUV("picnic", 7.4, -7.6, FACE_CAMERA + 0.5, 1.9, 0);
  addUV("picnic", -6.6, -9.4, FACE_CAMERA - 0.3, 1.9, 1);
  addUV("flowerBed", 4.2, 9.6, FACE_CAMERA, 1.1, 0);
  addUV("flowerBed", -4.2, 9.6, FACE_CAMERA, 1.1, 1);
  addUV("flowerBed", 13.4, -1.6, FACE_CAMERA + 0.6, 1.1, 2);

  // Benches round the plaza edge, facing the pointer.
  for (const a of [0.55, 2.6, 3.7, 5.75]) {
    const u = Math.cos(a) * 5.1;
    const v = Math.sin(a) * 5.1;
    const [x, z] = at(u, v);
    // Inside the plaza disc: exempt from the plaza's own keep-out.
    items.push({ kind: "bench", x, z, rotY: Math.atan2(cx - x, cz - z), r: 0.8, variant: 0 });
  }

  /* ---- paths: plaza out to the inner road edge along the four screen axes */
  const inner = g.roadRadius - g.roadWidth / 2 - 0.5;
  const paths: PathStrip[] = [];
  for (const [du, dv] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const from = 6;
    const to = inner;
    const mid = (from + to) / 2;
    const [x, z] = at(du * mid, dv * mid);
    const dirX = du * U[0] + dv * V[0];
    const dirZ = du * U[1] + dv * V[1];
    paths.push({ x, z, rotY: Math.atan2(dirX, dirZ), length: to - from, width: 2.2 });
  }

  /* ---- inner road edge: lamps (skip path mouths, signposts, figures) */
  const lampInner = g.roadRadius - g.roadWidth / 2 - 1.5;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.2;
    const x = cx + Math.cos(a) * lampInner;
    const z = cz + Math.sin(a) * lampInner;
    // Path mouths are at the screen axes (angles PI/4 + k PI/2).
    if ([0, 1, 2, 3].some((k) => angleDiff(a, Math.PI / 4 + (k * Math.PI) / 2) * lampInner < 2.2)) continue;
    add("lamp", x, z, Math.atan2(cx - x, cz - z), 0.4);
  }

  /* ---- outer lawn: small studio houses in the gaps between content buildings */
  const houseR = g.roadRadius + g.roadWidth / 2 + 6.4;
  const steps = 64;
  let variant = 0;
  let lastAngle = -Infinity;
  for (let i = 0; i < steps; i++) {
    const a = g.entryAngle + 0.5 + (i / steps) * Math.PI * 2;
    if ((a - lastAngle) * houseR < 12) continue;
    const x = cx + Math.cos(a) * houseR;
    const z = cz + Math.sin(a) * houseR;
    if (add("house", x, z, Math.atan2(cx - x, cz - z), 3.0, variant)) {
      variant++;
      lastAngle = a;
    }
  }

  /* ---- outer road edge: lamps, phone box, bike rack */
  const edgeOut = g.roadRadius + g.roadWidth / 2 + 1.5;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.11;
    const x = cx + Math.cos(a) * edgeOut;
    const z = cz + Math.sin(a) * edgeOut;
    add("lamp", x, z, Math.atan2(cx - x, cz - z), 0.4);
  }
  // Phone box and bike rack by the arrival road (first thing you pass), whichever side is free.
  for (const s of [0.3, -0.3, 0.45, -0.45]) {
    const a = g.entryAngle + s;
    const rr = edgeOut + 1.4;
    const x = cx + Math.cos(a) * rr;
    const z = cz + Math.sin(a) * rr;
    if (add("phoneBox", x, z, Math.atan2(cx - x, cz - z), 1.1)) break;
  }
  for (const b of g.bridgeAngles) {
    for (const s of [-0.36, 0.36]) {
      const a = b + s;
      const rr = edgeOut + 1.5;
      const x = cx + Math.cos(a) * rr;
      const z = cz + Math.sin(a) * rr;
      if (add("bikeRack", x, z, Math.atan2(cx - x, cz - z) + Math.PI / 2, 1.2)) break;
    }
  }

  /* ---- trees: the shared scatter, minus anything that would sit on decor or paths */
  const pathHit = (x: number, z: number, r: number) =>
    paths.some((p) => {
      const dx = x - p.x;
      const dz = z - p.z;
      const along = Math.abs(dx * Math.sin(p.rotY) + dz * Math.cos(p.rotY));
      const across = Math.abs(dx * Math.cos(p.rotY) - dz * Math.sin(p.rotY));
      return along < p.length / 2 + r && across < p.width / 2 + r;
    });
  const wall = wallPlaced ? items.find((i) => i.kind === "desktopWall") : undefined;
  const wallWings: Circle[] = wall
    ? [-1, 1].map((s) => ({
        x: wall.x + s * Math.cos(wall.rotY) * 4,
        z: wall.z - s * Math.sin(wall.rotY) * 4,
        r: 2.6,
      }))
    : [];
  const rand = rng(1984);
  const trees = scatterOnIsland(layout, { count: 90, seed: 2011, itemMargin: 1, minScale: 0.75, maxScale: 1.25 })
    .filter(
      (t) =>
        !items.some((o) => Math.hypot(o.x - t.position[0], o.z - t.position[2]) < o.r + 1.1) &&
        !wallWings.some((o) => Math.hypot(o.x - t.position[0], o.z - t.position[2]) < o.r + 1.1) &&
        !pathHit(t.position[0], t.position[2], 1.2),
    )
    // Thin the inner lawn a little more than the outer one, so the square stays open and readable.
    .filter((t) => Math.hypot(t.position[0] - cx, t.position[2] - cz) > g.roadRadius || rand() < 0.7)
    .slice(0, 56);

  return { items, paths, trees };
}
