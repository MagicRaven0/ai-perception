import { CAMERA_AZIMUTH } from "@/lib/three/camera";
import type { Tier } from "@/lib/three/quality";
import type { Vec3 } from "@/lib/three/layout";
import { LOT_BACK, LOT_FRONT, type Lot } from "./lots";

/**
 * Future island designs as plain data (no three.js): where the towers, monoliths, racks and plaza pieces
 * stand inside each lot. The decor (decor.tsx), the colliders and the blinking lights all read the same specs,
 * so they can never drift apart. Lot frame: see lots.ts (local +Z faces the ring road, X runs along it).
 */

/* ------------------------------------------------------------- frames */

type Frame = { position: Vec3; rotationY: number };

/** Lot (or any heading frame) local point -> world point. Local +Z maps to (sin h, cos h). */
export function toWorld(f: Frame, x: number, y: number, z: number): Vec3 {
  const c = Math.cos(f.rotationY);
  const s = Math.sin(f.rotationY);
  return [f.position[0] + x * c + z * s, f.position[1] + y, f.position[2] - x * s + z * c];
}

/** Small deterministic hash in [0, 1) for per-lot variety. */
export function hash(i: number, salt = 0): number {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/** Usable lot box (local), with a margin so nothing pokes out towards the road or the neighbours. */
export function lotBox(lot: Lot) {
  return { xMax: lot.halfWidth - 0.6, zFront: LOT_FRONT - 1.4, zBack: -LOT_BACK + 0.8 };
}

/* -------------------------------------------------------------- towers */

export type TowerSpec = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** "tower": glass-banded high-rise; "slab": graphite night block with lime bands; "pavilion": low glass box. */
  style: "tower" | "slab" | "pavilion";
  tone: number;
  /** Tallest tower of the lot carries the antenna (with a blinking tip). */
  antenna: boolean;
};

/**
 * City lot: two or three towers, tall at the back and on the far side of the island, low pavilions on the
 * camera side and on lots just in front of a content building (lot.lowRise), so the road and the buildings
 * behind stay visible. Low tier keeps the main tower only.
 */
export function cityTowers(lot: Lot, tier: Tier): TowerSpec[] {
  const box = lotBox(lot);
  const k = lot.index;
  const far = (1 - lot.facing) / 2; // 0 (camera side) .. 1 (far side)
  if (lot.facing > 0.45 || lot.lowRise) {
    // Camera side, or just in front of a content building: one low glass pavilion plus a small kiosk.
    const specs: TowerSpec[] = [
      { x: -1.2, z: -3.2, w: 7.6, d: 5.4, h: 2.8 + hash(k, 1) * 0.8, style: "pavilion", tone: k, antenna: false },
    ];
    if (tier === "high")
      specs.push({ x: box.xMax - 1.6, z: 1.2, w: 2.2, d: 2.2, h: 2.2, style: "pavilion", tone: k + 1, antenna: false });
    return specs;
  }
  const tall = 7 + far * 9 + hash(k, 2) * 3;
  const main: TowerSpec = {
    x: -2.6 + hash(k, 3) * 1.2,
    z: -4.4,
    w: 4.6,
    d: 4.6,
    h: tall,
    style: k % 3 === 1 ? "slab" : "tower",
    tone: k,
    antenna: true,
  };
  if (tier === "low") return [main];
  return [
    main,
    {
      x: 3.4,
      z: -5.2,
      w: 3.4,
      d: 3.6,
      h: Math.max(5, tall * (0.55 + hash(k, 4) * 0.2)),
      style: k % 3 === 1 ? "tower" : "slab",
      tone: k + 2,
      antenna: false,
    },
    { x: 3.6, z: 0.4, w: 3.0, d: 2.6, h: 3.2, style: "pavilion", tone: k + 1, antenna: false },
  ];
}

/* ----------------------------------------------------------- monoliths */

/**
 * POLLING MONOLITHS. Their heights are meant to come from the verified "public-trust-vs-fear" dataset
 * (content/datasets.ts). IslandProps does not carry datasets yet and the dataset is still a placeholder, so
 * every monolith stands at the same PLACEHOLDER height with a hatched "data coming" band: equal heights so
 * nothing reads as a number.
 * TODO: pass the verified series in (IslandProps or a client-safe content helper) and call monolithHeights()
 * with its values; never type numbers in here.
 */
export const MONOLITH_PLACEHOLDER_COUNT = 4;
export const MONOLITH_PLACEHOLDER_HEIGHT = 10; // TODO: placeholder, not data (see above)
const MONOLITH_MIN = 2.5;
const MONOLITH_MAX = 16;

/**
 * Heights for verified percentages (0..100): linear, so the slabs compare honestly. Returns null for no data,
 * which keeps the placeholder row.
 */
export function monolithHeights(values: readonly number[] | null | undefined): number[] | null {
  if (!values || values.length === 0) return null;
  return values.map((v) => MONOLITH_MIN + (Math.max(0, Math.min(100, v)) / 100) * (MONOLITH_MAX - MONOLITH_MIN));
}

export type MonolithSpec = { x: number; z: number; w: number; d: number; h: number; placeholder: boolean };

export function monolithSpecs(lot: Lot, heights: number[] | null): MonolithSpec[] {
  const box = lotBox(lot);
  const n = heights?.length ?? MONOLITH_PLACEHOLDER_COUNT;
  const pitch = Math.min(3.1, (box.xMax * 2) / n);
  const w = pitch * 0.68;
  return Array.from({ length: n }, (_, i) => ({
    x: (i - (n - 1) / 2) * pitch,
    z: -3.6,
    w,
    d: 1.5,
    h: heights?.[i] ?? MONOLITH_PLACEHOLDER_HEIGHT,
    placeholder: !heights,
  }));
}

/* -------------------------------------------------------- server yard */

export type RackSpec = { x: number; z: number };

export const RACK = { w: 1.3, h: 2.7, d: 1.0 };

/** Which way the rack fronts (glass, LEDs) face in the lot: towards the camera (local -Z) on the camera side. */
export function rackFront(lot: Lot): 1 | -1 {
  return lot.facing > 0.3 ? -1 : 1;
}

/** Rows of racks (Low: two rows); fronts face rackFront(). */
export function rackSlots(lot: Lot, tier: Tier): RackSpec[] {
  const box = lotBox(lot);
  const rows = tier === "high" ? [-0.6, -3.8, -7.0] : [-0.6, -3.8];
  const cols = Math.floor((box.xMax * 2 - 1.2) / (RACK.w + 0.25));
  const out: RackSpec[] = [];
  for (const z of rows) {
    for (let i = 0; i < cols; i++) out.push({ x: (i - (cols - 1) / 2) * (RACK.w + 0.25), z });
  }
  return out;
}

/* ---------------------------------------------------- comparison plaza */

/**
 * The plaza's exhibits face their own local +Z. Inside the lot they are turned by a quarter turn (about the lot
 * centre) so they face the isometric camera as well as they can: a lot's front faces the road, which on most
 * of the ring is not towards the camera. Returns the turn and the lot-local centre it pivots on.
 */
export function plazaFrame(lot: Lot): { turn: number; cz: number } {
  const box = lotBox(lot);
  const cz = (box.zFront + box.zBack) / 2;
  // Direction from the scene to the camera (world XZ), expressed in the lot frame.
  const dx = Math.sin(CAMERA_AZIMUTH);
  const dz = Math.cos(CAMERA_AZIMUTH);
  const c = Math.cos(lot.rotationY);
  const s = Math.sin(lot.rotationY);
  const heading = Math.atan2(c * dx - s * dz, s * dx + c * dz);
  // Never turn the exhibits' back (the tall mainframe) towards the road: no half turn.
  const turns = [0, Math.PI / 2, -Math.PI / 2];
  const turn = turns.reduce((best, t) => (Math.cos(heading - t) > Math.cos(heading - best) ? t : best), 0);
  return { turn, cz };
}

/** Plaza-local point (unturned lot coordinates) -> lot-local point after the plaza's turn. */
export function plazaToLot(f: { turn: number; cz: number }, x: number, z: number): [number, number] {
  const zr = z - f.cz;
  const c = Math.cos(f.turn);
  const s = Math.sin(f.turn);
  return [x * c + zr * s, -x * s + zr * c + f.cz];
}

/** 1956 side (local -X): three manila mainframe cabinets with phosphor lamp panels. */
export const MAINFRAME = { x0: -5.0, pitch: 1.75, w: 1.6, h: 4.8, d: 1.4, z: -4.8, cabinets: 3, panelY: 3.5 };

/* -------------------------------------------------------------- lights */

export type BlinkPoint = { p: Vec3; phosphor: boolean };

/**
 * Every blinking light on the island, in world space (one instanced draw call): server rack LEDs, the 1956
 * mainframe's phosphor lamps, tower antenna tips and the monolith beacons.
 */
export function blinkPoints(lots: Lot[], tier: Tier, heights: number[] | null): BlinkPoint[] {
  const out: BlinkPoint[] = [];
  for (const lot of lots) {
    if (lot.use === "servers") {
      const f = rackFront(lot);
      for (const r of rackSlots(lot, tier)) {
        for (let k = 0; k < 3; k++) {
          out.push({ p: toWorld(lot, r.x - 0.35 + k * 0.35, 2.27, r.z + f * (RACK.d / 2 + 0.06)), phosphor: false });
        }
      }
    } else if (lot.use === "comparison") {
      const f = plazaFrame(lot);
      for (let c = 0; c < MAINFRAME.cabinets; c++) {
        const cx = MAINFRAME.x0 + c * MAINFRAME.pitch;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const [x, z] = plazaToLot(f, cx - 0.42 + col * 0.42, MAINFRAME.z + MAINFRAME.d / 2 + 0.07);
            out.push({ p: toWorld(lot, x, 0.1 + MAINFRAME.panelY - 0.4 + row * 0.4, z), phosphor: true });
          }
        }
      }
    } else if (lot.use === "monoliths") {
      for (const m of monolithSpecs(lot, heights)) out.push({ p: toWorld(lot, m.x, m.h + 0.85, m.z), phosphor: false });
    } else {
      for (const t of cityTowers(lot, tier)) {
        if (t.antenna) out.push({ p: toWorld(lot, t.x, t.h + 3.1, t.z), phosphor: false });
      }
    }
  }
  return out;
}
