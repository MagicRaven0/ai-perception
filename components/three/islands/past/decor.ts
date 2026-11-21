import * as THREE from "three";
import type { IslandLayout, PlacedBuilding } from "@/lib/three/layout";
import { CAMERA_AZIMUTH } from "@/lib/three/camera";
import { PAST } from "@/lib/three/palettes/past";
import { TIERS } from "@/lib/three/quality";
import { scatterOnIsland } from "@/lib/three/scatter";
import { Geo, type ColliderSpec, type LightSpot, type ReelSpot, type V3 } from "./geo";
import { pastBuildingExtras } from "./models";

/**
 * THE PAST: island decor (1950s campus computing lab, oversized so the visitor feels small).
 *
 * Centre (always there, inside r <= ~10 m, clear of every possible plot):
 * - a paved quad with the "1956" workshop monument (stepped stone plinth, brass digits, a giant punch card);
 * - an arc of giant mainframe cabinets on the far side (from the camera), facing the monument, with lamp
 *   panels (blinking phosphor, drawn instanced by the island) and tape drives (spinning reels);
 * - an operator's console.
 * Around it (each item only if its spot is clear of the roads, every plot, signpost and figure, so new content
 * never collides with decor): a brick clock tower, a chalkboard of (abstract) predictions, giant punch-card
 * stacks, a giant tape-reel sculpture, giant vacuum tubes, a fountain, a phone box, benches, picnic tables,
 * lamp posts on both road edges, paths, and a brick campus gate astride the bridge road.
 *
 * Layout frame: positions are written in a "view frame" centred on the island, rotated by the camera azimuth,
 * so local +Z points towards the camera and local -Z away from it. Tall things stand at the back (-Z) or the
 * sides, never between the camera and the plaza, and stay <= ~10 m (the clock tower, at the side, ~15 m).
 *
 * Output is plain geometry + specs; the island turns it into meshes, colliders and instanced extras.
 */

export type PastDecor = {
  /** Structures and props (cast + receive shadows). On Low this also holds the flat paving. */
  cast: THREE.BufferGeometry | null;
  /** Flat paving, paths and tiny props (lamp posts, benches, picnic tables): receive only, no shadows from
   *  tiny props. Null on Low (merged into `cast`; Low draws no shadows). */
  flat: THREE.BufferGeometry | null;
  colliders: ColliderSpec[];
  lights: LightSpot[];
  reels: ReelSpot[];
  /** Footprints of everything placed (world x, z, radius), so trees keep out. */
  blockers: Blocker[];
};

export type Blocker = { x: number; z: number; r: number };

/* ---------------------------------------------------------------- shapes */

/** Punch card outline (unit width, unit height, origin bottom centre) with the cut top-left corner. */
function cardShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0.5, 0);
  s.lineTo(0.5, 1);
  s.lineTo(-0.42, 1);
  s.lineTo(-0.5, 0.84);
  s.closePath();
  return s;
}

/** Seven-segment digits (a b c d e f g). */
const SEGMENTS: Record<string, string> = { "1": "bc", "9": "abcdfg", "5": "afgcd", "6": "afgecd" };

function digit(g: Geo, ch: string, x: number, y: number, z: number, colour: string, w = 0.62, h = 1.1) {
  const t = 0.16;
  const d = 0.12;
  const segs = SEGMENTS[ch] ?? "";
  const hor = (cy: number) => g.box([w, t, d], [x, y + cy, z], colour);
  const ver = (cx: number, cy: number) => g.box([t, h / 2 + t / 2, d], [x + cx, y + cy, z], colour);
  if (segs.includes("a")) hor(h / 2);
  if (segs.includes("g")) hor(0);
  if (segs.includes("d")) hor(-h / 2);
  if (segs.includes("b")) ver(w / 2, h / 4);
  if (segs.includes("c")) ver(w / 2, -h / 4);
  if (segs.includes("e")) ver(-w / 2, -h / 4);
  if (segs.includes("f")) ver(-w / 2, h / 4);
}

/** Deterministic pseudo-random in [0, 1) from an integer. */
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ------------------------------------------------------------ the build */

export function buildPastDecor(layout: IslandLayout, low: boolean): PastDecor {
  const geo = layout.geometry;
  const [cx, cz] = geo.center;
  const rr = geo.roadRadius;
  const rw = geo.roadWidth;
  const innerEdge = rr - rw / 2;
  const outerEdge = rr + rw / 2;
  /** Curb + painted lip on each side of every road. */
  const CURB = 0.8;

  const cast = new Geo();
  const flat = low ? cast : new Geo();
  cast.bakeReels = low;

  const cos = Math.cos(CAMERA_AZIMUTH);
  const sin = Math.sin(CAMERA_AZIMUTH);
  /** View frame (lx right on screen, lz towards the camera) -> world [x, z]. */
  const W = (lx: number, lz: number): [number, number] => [cx + lx * cos + lz * sin, cz - lx * sin + lz * cos];
  /** World polar (angle from the island centre, radius) -> world [x, z]. */
  const P = (angle: number, r: number): [number, number] => [cx + Math.cos(angle) * r, cz + Math.sin(angle) * r];

  // Content footprints: every plot as its rotated rectangle (plus a margin), signposts and figures as discs.
  const plots = layout.buildings.map((b) => ({
    x: b.position[0],
    z: b.position[2],
    c: Math.cos(b.rotationY),
    s: Math.sin(b.rotationY),
    hw: b.plot.width / 2 + 0.8,
    hd: b.plot.depth / 2 + 0.8,
  }));
  const discs: Blocker[] = [
    ...layout.insights.map((s) => ({ x: s.position[0], z: s.position[2], r: 2.2 })),
    ...layout.figures.map((f) => ({ x: f.position[0], z: f.position[2], r: 3.6 })),
  ];
  /** True when a disc of radius r at world (x, z) overlaps a plot, a signpost or a figure. */
  const hitsContent = (x: number, z: number, r: number) =>
    discs.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + r) ||
    plots.some((p) => {
      const dx = x - p.x;
      const dz = z - p.z;
      // Into the plot's frame (inverse of its heading): lx across the plot, lz towards the road.
      const lx = dx * p.c - dz * p.s;
      const lz = dx * p.s + dz * p.c;
      return Math.abs(lx) < p.hw + r && Math.abs(lz) < p.hd + r;
    });
  const placed: Blocker[] = [];

  /** True when a disc of radius r at world (x, z) is on the lawn, off every road and clear of everything. */
  function clear(x: number, z: number, r: number, opts: { ignorePlaced?: boolean } = {}) {
    const dx = x - cx;
    const dz = z - cz;
    const d = Math.hypot(dx, dz);
    if (d + r > geo.radius - 1.8) return false;
    if (d + r > innerEdge - CURB - 0.4 && d - r < outerEdge + CURB + 0.4) return false;
    for (const b of geo.bridgeAngles) {
      const along = dx * Math.cos(b) + dz * Math.sin(b);
      const across = Math.abs(dx * Math.sin(b) - dz * Math.cos(b));
      if (along > innerEdge - 2 && across < rw / 2 + CURB + 0.4 + r) return false;
    }
    if (hitsContent(x, z, r)) return false;
    if (!opts.ignorePlaced && placed.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + r)) return false;
    return true;
  }

  /**
   * Build `fn` at world (x, z) with heading `yaw` into `target` (default: the shadow-casting mesh) if a disc of
   * radius `r` there is clear. Registers the footprint.
   * `core` items (the centre ensemble) skip the check: they are inside r <= 10, where no plot or road can be.
   */
  function put(x: number, z: number, yaw: number, r: number, fn: () => void, core = false, target: Geo = cast) {
    if (!core && !clear(x, z, r)) return false;
    placed.push({ x, z, r });
    target.at([x, 0, z], yaw, fn);
    return true;
  }
  /** Same, in the view frame (yaw relative to "facing the camera"). */
  const putV = (lx: number, lz: number, yaw: number, r: number, fn: () => void, core = false, target: Geo = cast) => {
    const [x, z] = W(lx, lz);
    return put(x, z, CAMERA_AZIMUTH + yaw, r, fn, core, target);
  };

  /* ------------------------------------------------ paving and paths */

  const PLAZA_R = 10.5;
  flat.at([cx, 0, cz], 0, () => {
    flat.ring(0, PLAZA_R, 0.025, PAST.paving, 40);
    flat.ring(PLAZA_R, PLAZA_R + 0.7, 0.026, PAST.pavingDark, 40);
  });
  // Four paths from the plaza to the inner road edge, starting at the bridge direction.
  const pathEnd = innerEdge - CURB + 0.2;
  for (let k = 0; k < 4; k++) {
    const a = geo.entryAngle + (k * Math.PI) / 2;
    const r0 = PLAZA_R + 0.4;
    const len = pathEnd - r0;
    // Skip a path that would run under a plot or a figure.
    const blocked = [0.2, 0.5, 0.8].some((f) => {
      const [x, z] = P(a, r0 + len * f);
      return hitsContent(x, z, 1.5);
    });
    if (blocked) continue;
    const [x, z] = P(a, r0 + len / 2);
    flat.at([x, 0, z], Math.atan2(Math.cos(a), Math.sin(a)), () => {
      flat.box([3, 0.04, len], [0, 0.02, 0], PAST.paving);
      flat.box([0.25, 0.05, len], [-1.6, 0.022, 0], PAST.pavingDark);
      flat.box([0.25, 0.05, len], [1.6, 0.022, 0], PAST.pavingDark);
    });
  }

  /* ------------------------------------------------ the 1956 monument */

  putV(
    0,
    0,
    0,
    4.6,
    () => {
      const g = cast;
      [7, 5.8, 4.6].forEach((s, i) => g.box([s, 0.3, s], [0, 0.15 + i * 0.3, 0], i % 2 ? PAST.stoneLight : PAST.stone));
      g.box([3.5, 0.3, 3.5], [0, 1.05, 0], PAST.stoneDark);
      g.box([3.2, 2.6, 3.2], [0, 2.3, 0], PAST.stoneLight);
      g.box([3.7, 0.35, 3.7], [0, 3.75, 0], PAST.stone);
      // "1956" in brass on the front and the back.
      for (const side of [1, -1]) {
        g.at([0, 0, 0], side > 0 ? 0 : Math.PI, () => {
          "1956".split("").forEach((ch, i) => digit(g, ch, -1.2 + i * 0.8, 2.35, 1.66, PAST.brass));
        });
      }
      // Giant punch card standing on top, holes punched right through.
      const cw = 5.8;
      const ch = 2.6;
      const y0 = 3.92;
      g.shape("card", cardShape, [cw, ch, 0.18], [0, y0, 0], PAST.manilaLight);
      g.box([cw * 0.98, 0.06, 0.2], [0, y0 + ch * 0.86, 0], PAST.manilaDark);
      const cols = low ? 14 : 24;
      for (let c = 0; c < cols; c++) {
        const x = -cw * 0.43 + (c * cw * 0.86) / (cols - 1);
        const holes = 1 + Math.floor(hash(c) * 2.4);
        for (let k = 0; k < holes; k++) {
          const row = Math.floor(hash(c * 7 + k * 13) * 9);
          g.box([0.12, 0.2, 0.22], [x, y0 + 0.28 + row * 0.24, 0], PAST.ink);
        }
      }
      g.collider([3.5, 1.9, 3.5], [0, 1.9, 0]);
    },
    true,
  );

  /* ------------------------------------------------ mainframe arc */

  // Oversized on purpose (the visitor should feel small): 11.5 m in the middle rising to 13.9 m at the ends, about
  // three to four car lengths. The middle ones stand straight behind the monument, where the 42 degree camera sees
  // about 1.1 x their height of ground behind them: kept low enough that this stays inside the inner lawn (clear of
  // the far ring road). The ends are off to the sides, with more lawn behind them, so they can be taller.
  const ARC_R = 9;
  const phis = [-72, -48, -24, 0, 24, 48, 72];
  phis.forEach((deg, i) => {
    const phi = (deg * Math.PI) / 180;
    const h = 11.5 + Math.abs(i - 3) * 0.8;
    const type = i === 3 ? "core" : i % 2 ? "tape" : "lamps";
    putV(ARC_R * Math.sin(phi), -ARC_R * Math.cos(phi), -phi, 1.9, () => cabinet(cast, h, type, low), true);
  });
  // Operator's console in front of the core cabinet.
  putV(
    0,
    -6.1,
    0,
    1.2,
    () => {
      const g = cast;
      g.box([3.6, 0.8, 1.1], [0, 0.4, 0], PAST.steel);
      g.box([3.7, 0.12, 1.25], [0, 0.86, 0.05], PAST.steelDark);
      g.box([3.4, 0.7, 0.12], [0, 1.25, -0.42], PAST.panel, [-0.45, 0, 0]);
      for (let i = 0; i < 8; i++) g.light([-1.4 + i * 0.4, 1.28, -0.33], 0.16, 0.16, false, [-0.45, 0, 0]);
      // Chair facing the cabinets.
      g.at([0.4, 0, 1.2], Math.PI, () => {
        g.cyl(0.32, 0.32, 0.12, [0, 0.55, 0], PAST.red, 8);
        g.box([0.08, 0.5, 0.08], [0, 0.28, 0], PAST.iron);
        g.box([0.55, 0.5, 0.1], [0, 0.95, -0.28], PAST.red);
      });
      g.collider([1.8, 0.6, 0.6], [0, 0.6, 0]);
    },
    true,
  );

  /* ------------------------------------------------ around the quad */

  // Brick clock tower (campus), to the left: tall, so it stands where it hides no road.
  putV(-17, 4, 0.2, 2.6, () => clockTower(cast));

  // Chalkboard of predictions (abstract chalk marks only: no words), back right, turned to the quad.
  putV(14.5, -3, -0.6, 3.4, () => chalkboard(cast, low));

  // Giant punch-card stacks: one behind the tower, two out front on the left lawn.
  (
    [
      [-12.5, -6.5, 0.3],
      [-17.5, 11, -0.2],
      [-13.5, 15, 0.5],
    ] as const
  ).forEach(([lx, lz, yaw], i) =>
    putV(lx, lz, yaw, 2 * STACK_SCALE, () => cast.at([0, 0, 0], 0, () => cardStack(cast, 8 + i * 2, i, low), STACK_SCALE)),
  );

  // Giant tape-reel sculpture, front left (spins on High). Drawn 1.35x (collider halves scaled to match: Geo's
  // collider() moves positions with the frame but takes half extents as given).
  const REEL_SCALE = 1.35;
  putV(-10.5, 9.5, 0.35, 2.4 * REEL_SCALE, () => {
    const g = cast;
    g.at(
      [0, 0, 0],
      0,
      () => {
        g.box([3.6, 0.4, 1.6], [0, 0.2, 0], PAST.stone);
        for (const s of [-1, 1]) g.box([0.3, 3, 0.3], [s * 0.9, 1.7, -0.25], PAST.iron, [0, 0, s * -0.28]);
        g.reel([0, 2.9, 0.1], 2.4, 0.35);
        const k = REEL_SCALE;
        g.collider([1.8 * k, 2.5 * k, 0.8 * k], [0, 2.5, 0]);
      },
      REEL_SCALE,
    );
  });

  // Giant vacuum tubes, right.
  putV(15.5, 5, -0.3, 3, () => {
    const g = cast;
    g.box([5.4, 0.35, 2], [0, 0.17, 0], PAST.stone);
    [-1.7, 0, 1.7].forEach((x, i) => {
      const s = i === 1 ? 1.2 : 1;
      g.cyl(0.62 * s, 0.7 * s, 0.7 * s, [x, 0.7, 0], PAST.ink, 10);
      for (let p = 0; p < 4; p++) g.box([0.06, 0.4, 0.06], [x - 0.3 + p * 0.2, 0.22, 0.45], PAST.brass);
      g.cyl(0.55 * s, 0.55 * s, 1.9 * s, [x, 1.05 + 0.95 * s, 0], PAST.glass, 10);
      g.sphere(0.55 * s, [x, 1.05 + 1.9 * s, 0], PAST.glass, { w: 10, h: 4, dome: true });
      g.cyl(0.32 * s, 0.32 * s, 1.0 * s, [x, 1.05 + 0.95 * s, 0], PAST.steelDark, 6);
      // Glowing filament (phosphor lamp facing the camera).
      g.light([x, 1.05 + 1.0 * s, 0.58 * s], 0.3 * s, 0.9 * s, true);
    });
    g.collider([2.7, 1.6, 1], [0, 1.6, 0]);
  });

  // Fountain, front right (kept low: it is between the camera and the quad).
  putV(9, 13, 0, 3, () => fountain(cast, low));

  // Phone box near the arrival, on the inner lawn.
  {
    const [x, z] = P(geo.entryAngle - 0.36, innerEdge - 3.2);
    put(x, z, Math.atan2(-(x - cx), -(z - cz)), 1, () => phoneBox(cast));
  }

  // Picnic tables on the inner lawn (High only).
  if (!low) {
    (
      [
        [4, 17, 0.4],
        [16.5, -1.5, -0.2],
        [-4, 16, -0.3],
      ] as const
    ).forEach(([lx, lz, yaw]) => putV(lx, lz, yaw, 1.6, () => picnicTable(flat), false, flat));
  }

  // Benches round the quad, facing the monument (High only), between the paths.
  if (!low) {
    for (let k = 0; k < 4; k++) {
      for (const off of [-0.32, 0.32]) {
        const a = geo.entryAngle + Math.PI / 4 + (k * Math.PI) / 2 + off;
        const [x, z] = P(a, PLAZA_R + 1.6);
        put(x, z, Math.atan2(-(x - cx), -(z - cz)), 1, () => bench(flat), false, flat);
      }
    }
  }

  // Lamp posts: round the quad, along the inner road edge and along the outer road edge.
  const lampRing = (r: number, n: number, phase: number, every = 1) => {
    for (let k = 0; k < n; k += every) {
      const a = geo.entryAngle + phase + (k * Math.PI * 2) / n;
      const [x, z] = P(a, r);
      put(x, z, 0, 0.35, () => lampPost(flat), false, flat);
    }
  };
  const step = low ? 2 : 1;
  lampRing(PLAZA_R + 0.4, 4, Math.PI / 4, step);
  lampRing(innerEdge - CURB - 0.9, 10, 0.3, step);
  lampRing(outerEdge + CURB + 0.9, 12, 0.26, step);

  // Brick campus gate astride each bridge road (pillars and low walls beside the road, arch overhead).
  for (const b of geo.bridgeAngles) {
    const along = geo.radius - 6.5;
    const side = rw / 2 + CURB + 1.7;
    const ux = Math.cos(b);
    const uz = Math.sin(b);
    const at = (across: number): [number, number] => [cx + ux * along - uz * across, cz + uz * along + ux * across];
    // Both pillars (r 1) must be clear; each low wing wall (r 1.9, further out) only where it fits.
    if (![-1, 1].every((s) => clear(...at(s * side), 1))) continue;
    const walls = [-1, 1].map((s) => clear(...at(s * (side + 2.5)), 1.9)) as [boolean, boolean];
    [-1, 1].forEach((s, i) => {
      const [x, z] = at(s * side);
      placed.push({ x, z, r: 1 });
      if (walls[i]) {
        const [wx, wz] = at(s * (side + 2.5));
        placed.push({ x: wx, z: wz, r: 1.9 });
      }
    });
    cast.at([cx + ux * along, 0, cz + uz * along], Math.atan2(ux, uz), () => gate(cast, side, low, walls));
  }

  /* ------------------------------------------------ trees */

  // Baked into the decor mesh (not kit/Trees): saves its four draw calls on High. Same shapes and thinning
  // as kit/Trees (Low keeps the same ~55 % share), kept off every plot, road and decor footprint.
  const trees = [
    ...scatterOnIsland(layout, { count: 64, zone: "outer", minScale: 0.95, maxScale: 1.5 }),
    ...scatterOnIsland(layout, { count: 26, zone: "inner", seed: 4242, minScale: 1, maxScale: 1.55 }),
  ].filter((t) => !placed.some((b) => Math.hypot(b.x - t.position[0], b.z - t.position[2]) < b.r + 1.6));
  const keep = low ? TIERS.low.decorDensity : 1;
  const leaves = PAST.leaves;
  trees.forEach((t, i) => {
    if (keep < 1 && (i * 0.618) % 1 >= keep) return;
    const squash: V3 = t.variant === 1 ? [0.8, 1.6, 0.8] : t.variant === 2 ? [0.85, 1.35, 0.85] : [1.1, 0.95, 1.1];
    cast.at(
      t.position,
      t.rotationY,
      () => {
        cast.cyl(0.18, 0.26, 1.6, [0, 0.8, 0], PAST.trunk, 5);
        cast.ico(1.25, [0, 2.6 * squash[1], 0], leaves[(i + t.variant) % leaves.length]!, squash);
      },
      t.scale,
    );
  });

  /* ------------------------------------------------ building extras */

  const extras = new Geo({ withGeometry: false });
  extras.bakeReels = low;
  layout.buildings.forEach((b: PlacedBuilding) => pastBuildingExtras(b, extras));

  return {
    cast: cast.build(),
    flat: low ? null : flat.build(),
    colliders: cast.colliders,
    lights: [...cast.lights, ...extras.lights],
    reels: [...cast.reels, ...extras.reels],
    blockers: placed,
  };
}

/* ----------------------------------------------------------------- props */

/** Giant mainframe cabinet facing local +Z, `h` tall. */
function cabinet(g: Geo, h: number, type: "core" | "tape" | "lamps", low: boolean) {
  const w = 3.1;
  const d = 2.2;
  const z = d / 2;
  g.box([w + 0.2, 0.35, d + 0.2], [0, 0.17, 0], PAST.steelDark);
  g.box([w, h - 0.35, d], [0, 0.35 + (h - 0.35) / 2, 0], PAST.steel);
  g.box([w + 0.25, 0.4, d + 0.25], [0, h + 0.2, 0], PAST.steelDark);
  // Door seams and a vent grille at the bottom.
  g.box([0.06, h - 1.2, 0.04], [0, h / 2 + 0.2, z + 0.02], PAST.steelDark);
  for (let i = 0; i < (low ? 2 : 4); i++) g.box([w * 0.8, 0.08, 0.05], [0, 0.7 + i * 0.22, z + 0.02], PAST.panel);
  if (type === "lamps") {
    const cols = 5;
    const rows = low ? 5 : 8;
    const pitch = 0.42;
    const y = h * 0.62;
    g.box([cols * pitch + 0.3, rows * pitch + 0.3, 0.08], [0, y, z + 0.04], PAST.panel);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.light([(c - (cols - 1) / 2) * pitch, y + (r - (rows - 1) / 2) * pitch, z + 0.1], 0.24, 0.24);
      }
    }
  } else if (type === "tape") {
    const y = h * 0.66;
    g.box([w * 0.86, 2.4, 0.08], [0, y, z + 0.04], PAST.panel);
    g.box([w * 0.8, 2.2, 0.06], [0, y, z + 0.08], PAST.glassDark);
    g.reel([-0.65, y + 0.1, z + 0.18], 0.62, 1.2 + (h % 1));
    g.reel([0.65, y + 0.1, z + 0.18], 0.62, -0.9 - (h % 1));
    for (let i = 0; i < 6; i++) g.light([-1 + i * 0.4, y - 1.45, z + 0.1], 0.2, 0.2);
  } else {
    // Core: a round scope screen and a wide lamp bank.
    const y = h * 0.7;
    g.box([w * 0.86, 1.9, 0.08], [0, y, z + 0.04], PAST.panel);
    g.disc(0.75, [0, y, z + 0.1], PAST.ink, 14);
    g.light([0, y, z + 0.12], 1.2, 0.07, true);
    g.light([0, y + 0.3, z + 0.12], 0.8, 0.07, true);
    const cols = 6;
    for (let r = 0; r < (low ? 2 : 4); r++) {
      for (let c = 0; c < cols; c++) g.light([(c - 2.5) * 0.42, h * 0.38 + r * 0.42, z + 0.1], 0.24, 0.24);
    }
    g.box(
      [cols * 0.42 + 0.3, (low ? 2 : 4) * 0.42 + 0.2, 0.08],
      [0, h * 0.38 + (low ? 0.21 : 0.63), z + 0.04],
      PAST.panel,
    );
  }
  g.collider([w / 2 + 0.1, h / 2, d / 2 + 0.1], [0, h / 2, 0]);
}

/** Brick clock tower with a stone clock stage and a slate pyramid roof (~15 m). */
function clockTower(g: Geo) {
  g.box([4.2, 1, 4.2], [0, 0.5, 0], PAST.stone);
  g.box([3.4, 9, 3.4], [0, 5.5, 0], PAST.brick);
  for (const y of [4, 7.5]) g.box([3.6, 0.3, 3.6], [0, y, 0], PAST.stoneLight);
  // Arched door and slit windows on the front.
  g.box([1.3, 2.3, 0.1], [0, 2.15, 1.72], PAST.woodDark);
  g.box([1.5, 0.3, 0.12], [0, 3.4, 1.73], PAST.stoneLight);
  for (const y of [5.6, 8.6]) g.box([0.5, 1.4, 0.08], [0, y, 1.72], PAST.glassDark);
  // Clock stage
  g.box([4, 2.6, 4], [0, 11.3, 0], PAST.stoneLight);
  g.box([4.3, 0.3, 4.3], [0, 12.7, 0], PAST.stone);
  for (let k = 0; k < 4; k++) {
    g.at([0, 0, 0], (k * Math.PI) / 2, () => {
      g.disc(1.0, [0, 11.3, 2.02], PAST.cream, 16);
      g.box([0.1, 0.75, 0.04], [0, 11.6, 2.05], PAST.ink);
      g.box([0.55, 0.1, 0.04], [0.22, 11.3, 2.06], PAST.ink);
    });
  }
  g.cyl(0.01, 3.1, 2.8, [0, 14.25, 0], PAST.slate, 4, [0, Math.PI / 4, 0]);
  g.box([0.12, 1.2, 0.12], [0, 16.1, 0], PAST.iron);
  g.collider([2.1, 5, 2.1], [0, 5, 0]);
}

/** Freestanding chalkboard of predictions: abstract chalk marks, a rising curve and a ringed answer. */
function chalkboard(g: Geo, low: boolean) {
  const w = 6.6;
  const h = 3.4;
  const y = 1.0 + h / 2;
  // A-frame legs
  for (const s of [-1, 1]) {
    g.box([0.2, y + h / 2 + 0.2, 0.2], [s * (w / 2 + 0.15), (y + h / 2 + 0.2) / 2, 0.35], PAST.woodDark, [0.12, 0, 0]);
    g.box([0.2, y + h / 2, 0.2], [s * (w / 2 + 0.15), (y + h / 2) / 2, -0.55], PAST.woodDark, [-0.22, 0, 0]);
  }
  g.box([w + 0.3, h + 0.3, 0.16], [0, y, 0.2], PAST.wood);
  g.box([w, h, 0.18], [0, y, 0.22], PAST.chalkboard);
  g.box([w * 0.9, 0.1, 0.3], [0, y - h / 2 - 0.05, 0.4], PAST.wood);
  const z = 0.33;
  // "Lines" of chalk: dashes of varying length, never letters.
  const lines = low ? 4 : 6;
  for (let l = 0; l < lines; l++) {
    let x = -w / 2 + 0.4;
    const ly = y + h / 2 - 0.45 - l * 0.42;
    let k = 0;
    while (x < (l < 3 ? 0.2 : w / 2 - 0.5)) {
      const len = 0.18 + hash(l * 31 + k) * 0.55;
      g.box([len, 0.06, 0.02], [x + len / 2, ly, z], PAST.chalk);
      x += len + 0.16;
      k++;
    }
  }
  // Rising curve (zigzag) with axes, top right.
  const ox = 0.6;
  const oy = y - 0.1;
  g.box([0.05, 1.5, 0.02], [ox, oy + 0.75, z], PAST.chalk);
  g.box([2.4, 0.05, 0.02], [ox + 1.2, oy, z], PAST.chalk);
  const pts = [
    [0, 0.1],
    [0.5, 0.25],
    [1, 0.35],
    [1.5, 0.7],
    [2.1, 1.35],
  ] as const;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[i + 1]!;
    const len = Math.hypot(x1 - x0, y1 - y0);
    g.box([len, 0.06, 0.02], [ox + (x0 + x1) / 2, oy + (y0 + y1) / 2, z], PAST.chalk, [
      0,
      0,
      Math.atan2(y1 - y0, x1 - x0),
    ]);
  }
  // A ringed "answer" (a chalk ring round a blank).
  g.at([-1.6, y - 1.05, z], 0, () => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.box([0.26, 0.05, 0.02], [Math.cos(a) * 0.42, Math.sin(a) * 0.3, 0], PAST.chalk, [0, 0, a + Math.PI / 2]);
    }
  });
  g.collider([w / 2 + 0.3, 2.2, 0.6], [0, 2.2, 0]);
}

/** The punch-card stacks round the quad are drawn this much larger (oversized, like the cabinets). */
const STACK_SCALE = 1.4;

/**
 * Stack of giant punch cards (3.2 x 1.4 m each before STACK_SCALE), slightly fanned, the top one punched.
 * Called inside a frame scaled by STACK_SCALE: the collider's half extents are scaled here to match.
 */
function cardStack(g: Geo, n: number, seed: number, low: boolean) {
  const t = 0.13;
  const colours = [PAST.manilaLight, PAST.manila, PAST.manilaDark];
  const count = low ? Math.ceil(n / 2) : n;
  const tt = (t * n) / count;
  for (let i = 0; i < count; i++) {
    const jitter = (hash(seed * 17 + i) - 0.5) * 0.16;
    g.box([3.2, tt, 1.4], [jitter * 0.6, tt / 2 + i * tt, 0], colours[(i + seed) % 3]!, [0, jitter, 0]);
  }
  const top = count * tt;
  for (let c = 0; c < (low ? 6 : 12); c++) {
    const x = -1.35 + c * 0.245;
    const row = Math.floor(hash(seed * 5 + c) * 5);
    g.box([0.1, 0.02, 0.22], [x, top + 0.005, -0.5 + row * 0.25], PAST.ink);
  }
  // One card leaning against the stack.
  g.box([3.2, 1.4, 0.1], [0.1, 0.62, 0.95], PAST.manilaLight, [-1.05, 0, 0]);
  const k = STACK_SCALE;
  g.collider([1.7 * k, (top / 2 + 0.2) * k, 1.1 * k], [0, top / 2 + 0.2, 0.2]);
}

/** Stone fountain (two-tier), low. */
function fountain(g: Geo, low: boolean) {
  const seg = low ? 10 : 14;
  g.cyl(2.7, 2.8, 0.7, [0, 0.35, 0], PAST.stone, seg);
  g.cyl(2.35, 2.35, 0.08, [0, 0.66, 0], PAST.water, seg);
  g.cyl(0.35, 0.45, 1.6, [0, 1.3, 0], PAST.stoneLight, 8);
  g.cyl(1.1, 0.5, 0.35, [0, 2.1, 0], PAST.stone, seg);
  g.cyl(0.95, 0.95, 0.06, [0, 2.26, 0], PAST.water, seg);
  g.cyl(0.12, 0.2, 0.6, [0, 2.55, 0], PAST.stoneLight, 6);
  g.sphere(0.2, [0, 2.9, 0], PAST.brass, { w: 8, h: 4 });
  g.collider([2.4, 0.6, 2.4], [0, 0.6, 0]);
}

/** Red phone box with glazed sides. */
function phoneBox(g: Geo) {
  g.box([1.25, 0.15, 1.25], [0, 0.07, 0], PAST.stoneDark);
  g.box([1.1, 2.5, 1.1], [0, 1.4, 0], PAST.red);
  g.box([1.25, 0.25, 1.25], [0, 2.75, 0], PAST.red);
  g.box([0.9, 0.18, 0.9], [0, 2.95, 0], PAST.red);
  for (let k = 0; k < 4; k++) {
    g.at([0, 0, 0], (k * Math.PI) / 2, () => {
      g.box([0.8, 1.5, 0.04], [0, 1.45, 0.56], k === 0 ? PAST.glass : PAST.glassDark);
      g.box([0.05, 1.5, 0.05], [0, 1.45, 0.58], PAST.red);
      g.box([0.8, 0.05, 0.05], [0, 1.65, 0.58], PAST.red);
      g.box([0.7, 0.16, 0.04], [0, 2.43, 0.56], PAST.cream);
    });
  }
  g.collider([0.62, 1.4, 0.62], [0, 1.4, 0]);
}

function bench(g: Geo) {
  g.box([2, 0.1, 0.55], [0, 0.48, 0], PAST.woodLight);
  g.box([2, 0.45, 0.08], [0, 0.82, -0.27], PAST.woodLight, [-0.12, 0, 0]);
  for (const s of [-1, 1]) g.box([0.08, 0.5, 0.5], [s * 0.85, 0.25, 0], PAST.iron);
}

function picnicTable(g: Geo) {
  g.box([2.2, 0.1, 0.9], [0, 0.78, 0], PAST.woodLight);
  for (const s of [-1, 1]) {
    g.box([2.2, 0.08, 0.32], [0, 0.45, s * 0.8], PAST.wood);
    g.box([0.1, 0.85, 0.1], [s * 0.85, 0.4, 0], PAST.woodDark);
    g.box([0.1, 0.08, 1.9], [s * 0.85, 0.42, 0], PAST.woodDark);
  }
}

/** Cast-iron lamp post with a cream globe. */
function lampPost(g: Geo) {
  g.cyl(0.18, 0.24, 0.5, [0, 0.25, 0], PAST.iron, 6);
  g.cyl(0.06, 0.08, 3.4, [0, 2.2, 0], PAST.iron, 5);
  g.cyl(0.18, 0.12, 0.2, [0, 3.95, 0], PAST.iron, 6);
  g.ico(0.3, [0, 4.3, 0], PAST.cream);
}

/** Brick campus gate across a road: pillars `side` m either side of the centre, wing walls, iron arch. */
function gate(g: Geo, side: number, low: boolean, walls: [boolean, boolean]) {
  // Local frame: +Z along the road (outwards); local +X is the "across = -1" side of the caller's `at()`.
  for (const s of [-1, 1]) {
    const wall = walls[s > 0 ? 0 : 1];
    g.at([s * side, 0, 0], 0, () => {
      g.box([1.5, 0.4, 1.5], [0, 0.2, 0], PAST.stone);
      g.box([1.3, 4.4, 1.3], [0, 2.6, 0], PAST.brick);
      g.box([1.6, 0.3, 1.6], [0, 4.95, 0], PAST.stoneLight);
      g.box([1.0, 0.3, 1.0], [0, 5.25, 0], PAST.stone);
      g.ico(0.4, [0, 5.75, 0], PAST.cream);
      g.collider([0.75, 2.6, 0.75], [0, 2.6, 0]);
      if (!wall) return;
      // Low wing wall, away from the road.
      g.box([3.6, 1.3, 0.6], [s * 2.5, 0.65, 0], PAST.brickDark);
      g.box([3.7, 0.18, 0.75], [s * 2.5, 1.38, 0], PAST.stoneLight);
      g.collider([1.85, 0.7, 0.4], [s * 2.5, 0.7, 0]);
    });
  }
  // Iron arch overhead (well above the car), with a manila plaque and a row of phosphor lamps.
  const span = side * 2;
  g.box([span, 0.2, 0.2], [0, 5.5, 0], PAST.iron);
  g.box([span * 0.7, 0.16, 0.16], [0, 6.3, 0], PAST.iron);
  if (!low) {
    for (let i = 0; i < 9; i++) {
      const x = -span * 0.35 + (i * span * 0.7) / 8;
      g.box([0.08, 0.8, 0.08], [x, 5.9, 0], PAST.iron);
    }
  }
  g.box([3.4, 1.0, 0.16], [0, 6.0, 0], PAST.manila);
  for (const face of [1, -1]) {
    for (let i = 0; i < 6; i++)
      g.light([-1.25 + i * 0.5, 6.0, face * 0.1], 0.26, 0.26, false, [0, face > 0 ? 0 : Math.PI, 0]);
  }
}

/** Development check: colliders that would sit on the ring road or a bridge road (should be none). */
export function checkColliders(layout: IslandLayout, colliders: ColliderSpec[]) {
  const g = layout.geometry;
  const [cx, cz] = g.center;
  const bad: string[] = [];
  for (const c of colliders) {
    const r = Math.hypot(c.half[0], c.half[2]);
    const dx = c.position[0] - cx;
    const dz = c.position[2] - cz;
    const d = Math.hypot(dx, dz);
    const onRing = d + r > g.roadRadius - g.roadWidth / 2 - 0.8 && d - r < g.roadRadius + g.roadWidth / 2 + 0.8;
    // Exact test across the connector: rotated box corners vs the corridor.
    const onConnector = g.bridgeAngles.some((b) => {
      const along = dx * Math.cos(b) + dz * Math.sin(b);
      if (along < g.roadRadius - g.roadWidth) return false;
      const corners: V3[] = [];
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const lx = sx * c.half[0];
          const lz = sz * c.half[2];
          const x = dx + lx * Math.cos(c.rotationY) + lz * Math.sin(c.rotationY);
          const z = dz - lx * Math.sin(c.rotationY) + lz * Math.cos(c.rotationY);
          corners.push([x, 0, z]);
        }
      return corners.some((p) => Math.abs(p[0] * Math.sin(b) - p[2] * Math.cos(b)) < g.roadWidth / 2 + 0.8);
    });
    if (onRing || onConnector) bad.push(`${c.position.map((n) => n.toFixed(1)).join(",")}`);
  }
  return bad;
}
