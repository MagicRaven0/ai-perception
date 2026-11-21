"use client";

import { useEffect, useMemo } from "react";
import type { BuildingKind } from "@/lib/content/schema";
import type { PlacedBuilding } from "@/lib/three/layout";
import { ERA_PALETTE, pick } from "@/lib/three/palette";
import { PAST } from "@/lib/three/palettes/past";
import type { BuildingModelProps } from "../../buildings/registry";
import { Geo } from "./geo";
import { usePastLow, usePastMaterial } from "./material";

/**
 * THE PAST: era-styled building models for all seven kinds (1950s campus computing lab).
 * Oversized, academic and a little cold: cut stone, college brick, slate, grey steel, manila, phosphor lamps.
 *
 * Every model:
 * - faces local +Z (the road), sits on y = 0 and keeps its main mass inside the shared box collider
 *   (about +-5.3 m across, +-4.4 m deep, 6 m tall for the Past's 14 x 13 m plot);
 * - keeps its FRONT low (<= ~5 m) and puts the tall mass at the back of the plot, so that on the near side
 *   of the island it never hides the car on the road in front of it (high-angle camera from -x, +z);
 * - is ONE vertex-coloured mesh (one draw call; two on High with the shadow pass). Use it with
 *   <Building merge={false} height={PAST_MODEL_HEIGHT[kind]}> (it is already merged; StaticMerge would
 *   overwrite its vertex colours).
 * Phosphor lamps and tape reels are not part of the mesh: `pastBuildingExtras()` returns their world
 * positions and the island draws them all as two instanced meshes (blinking / spinning).
 *
 * Same kind, same cue as the other islands: podcast = microphone + on-air lamp, interview = glass booth
 * with two chairs, archive = filing drawers, lab = dome + antenna, cinema = marquee + screen,
 * gallery = big frames, arcade = glowing strip + joystick.
 */

type Build = (g: Geo, p: BuildingModelProps) => void;

/** Main volume half-extents (matches Building.tsx's collider). */
function extent(p: BuildingModelProps) {
  return { hw: p.plot.width * 0.38, hd: p.plot.depth * 0.34 };
}

function wallOf(p: BuildingModelProps, k = 0) {
  return pick(p.palette.buildings, p.colourIndex + k);
}

/* ------------------------------------------------------------- pieces */

/** Stone steps rising towards the building, starting at z0 and going back by `run` per step. */
function steps(g: Geo, w: number, z0: number, n = 3, rise = 0.18, run = 0.45) {
  for (let i = 0; i < n; i++) {
    const h = rise * (i + 1);
    g.box([w - i * 0.3, h, run], [0, h / 2, z0 - i * run], i % 2 ? PAST.stone : PAST.stoneLight);
  }
}

/** A grid of tall windows on a wall facing +Z at depth z. */
function windows(
  g: Geo,
  o: { x0: number; x1: number; y: number; z: number; cols: number; rows?: number; w: number; h: number; gapY?: number },
  frame: string = PAST.stoneLight,
  glass: string = PAST.glassDark,
) {
  const rows = o.rows ?? 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < o.cols; c++) {
      const x = o.cols === 1 ? (o.x0 + o.x1) / 2 : o.x0 + ((o.x1 - o.x0) * c) / (o.cols - 1);
      const y = o.y + r * (o.h + (o.gapY ?? 0.8));
      g.box([o.w + 0.24, o.h + 0.24, 0.08], [x, y, o.z + 0.04], frame);
      g.box([o.w, o.h, 0.08], [x, y, o.z + 0.08], glass);
      // Mullion
      g.box([0.08, o.h, 0.04], [x, y, o.z + 0.14], frame);
    }
  }
}

/** Plain door with a stone surround. */
function door(g: Geo, z: number, w = 1.6, h = 2.6, colour: string = PAST.woodDark) {
  g.box([w + 0.5, h + 0.35, 0.12], [0, (h + 0.35) / 2, z + 0.06], PAST.stoneLight);
  g.box([w, h, 0.12], [0, h / 2, z + 0.12], colour);
}

/** Cornice band around the top of a box volume. */
function cornice(g: Geo, w: number, d: number, y: number, z = 0, colour: string = PAST.stoneLight) {
  g.box([w + 0.5, 0.35, d + 0.5], [0, y, z], colour);
}

type Panes = {
  cols: number;
  rows?: number;
  /** Distance between the outer column centres. */
  span: number;
  /** Centre height of the first row. */
  y: number;
  w: number;
  h: number;
  gapY?: number;
  frame?: string;
  glass?: string;
};

/** Window grid (frame + pane, two boxes each) on a face looking along local +Z at z = 0. */
function panes(g: Geo, o: Panes) {
  const rows = o.rows ?? 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < o.cols; c++) {
      const x = o.cols === 1 ? 0 : -o.span / 2 + (o.span * c) / (o.cols - 1);
      const y = o.y + r * (o.h + (o.gapY ?? 0.8));
      g.box([o.w + 0.24, o.h + 0.24, 0.08], [x, y, 0.04], o.frame ?? PAST.stoneLight);
      g.box([o.w, o.h, 0.08], [x, y, 0.08], o.glass ?? PAST.glassDark);
    }
  }
}

/** Windows on a back face (looking along local -Z) at depth `z`. */
function backWindows(g: Geo, z: number, o: Panes) {
  g.at([0, 0, z], Math.PI, () => panes(g, o));
}

/** Windows on a side face at `x` (its sign picks the side), centred along the depth at `z`. */
function sideWindows(g: Geo, x: number, z: number, o: Panes) {
  g.at([x, 0, z], (Math.sign(x) * Math.PI) / 2, () => panes(g, o));
}

/** "Text still coming" hint: a wooden sawhorse barrier with a striped plank, front right of the plot. */
function comingSoonBarrier(g: Geo, p: BuildingModelProps) {
  const z = p.plot.depth / 2 - 0.4;
  const x = p.plot.width * 0.3;
  g.at([x, 0, z], 0, () => {
    for (const s of [-1, 1]) {
      g.box([0.12, 1.0, 0.12], [s * 0.8, 0.48, 0.18], PAST.woodDark, [0.28, 0, 0]);
      g.box([0.12, 1.0, 0.12], [s * 0.8, 0.48, -0.18], PAST.woodDark, [-0.28, 0, 0]);
    }
    for (let i = 0; i < 4; i++) {
      g.box([0.5, 0.3, 0.06], [-0.75 + i * 0.5, 0.9, 0.03], i % 2 ? PAST.ink : PAST.manila);
    }
  });
}

/** Phosphor status board: a dark panel with a grid of lamps (lamps recorded, not drawn). */
function lampBoard(g: Geo, x: number, y: number, z: number, cols: number, rows: number, pitch = 0.32) {
  const w = cols * pitch + 0.2;
  const h = rows * pitch + 0.2;
  g.box([w, h, 0.1], [x, y, z + 0.05], PAST.panel);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      g.light(
        [x - (cols - 1) * pitch * 0.5 + c * pitch, y - (rows - 1) * pitch * 0.5 + r * pitch, z + 0.12],
        0.18,
        0.18,
      );
    }
  }
}

/** Tapered lattice-look mast in bands (radio tower / antenna), with a lamp on top. */
function mast(g: Geo, x: number, z: number, y0: number, h: number, r0: number, bands: [string, string]) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const rb = r0 * (1 - (i / n) * 0.75);
    const rt = r0 * (1 - ((i + 1) / n) * 0.75);
    g.cyl(rt, rb, h / n, [x, y0 + (h / n) * (i + 0.5), z], bands[i % 2], 4, [0, Math.PI / 4, 0]);
  }
  g.box([0.12, 1.2, 0.12], [x, y0 + h + 0.6, z], PAST.iron);
  g.light([x, y0 + h + 1.3, z + 0.1], 0.36, 0.36, false);
}

/** 1950s capsule microphone on a yoke and stand, `s` metres tall overall. */
function microphone(g: Geo, x: number, y: number, z: number, s: number) {
  const k = s / 3;
  g.cyl(0.7 * k, 0.8 * k, 0.15 * k, [x, y + 0.08 * k, z], PAST.iron, 10);
  g.cyl(0.08 * k, 0.08 * k, 1.4 * k, [x, y + 0.85 * k, z], PAST.iron, 6);
  // Yoke
  g.box([1.5 * k, 0.12 * k, 0.12 * k], [x, y + 1.6 * k, z], PAST.iron);
  for (const sx of [-1, 1]) g.box([0.12 * k, 0.7 * k, 0.12 * k], [x + sx * 0.7 * k, y + 1.9 * k, z], PAST.iron);
  // Capsule with grille bands
  g.sphere(0.6 * k, [x, y + 2.2 * k, z], PAST.steelLight, { w: 10, h: 6, scale: [1, 1.35, 0.8] });
  for (const dy of [-0.35, 0, 0.35]) {
    g.cyl(
      0.6 * k * Math.cos(dy) * 1.02,
      0.6 * k * Math.cos(dy) * 1.02,
      0.06 * k,
      [x, y + (2.2 + dy * 1.2) * k, z],
      PAST.steelDark,
      10,
    );
  }
}

/** Old armchair facing local +Z. */
function armchair(g: Geo, colour: string) {
  g.box([0.95, 0.42, 0.85], [0, 0.32, 0], colour);
  g.box([0.95, 0.75, 0.2], [0, 0.85, -0.36], colour);
  for (const s of [-1, 1]) g.box([0.16, 0.32, 0.8], [s * 0.48, 0.66, 0], colour);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) g.box([0.08, 0.12, 0.08], [sx * 0.38, 0.06, sz * 0.32], PAST.woodDark);
}

/** Small reel-to-reel recorder on a surface at y (reels recorded as spinning extras). */
function recorder(g: Geo, x: number, y: number, z: number, s = 1) {
  g.box([0.9 * s, 0.25 * s, 0.6 * s], [x, y + 0.12 * s, z], PAST.steelDark);
  g.box([0.9 * s, 0.6 * s, 0.1 * s], [x, y + 0.5 * s, z - 0.25 * s], PAST.steel);
  g.reel([x - 0.22 * s, y + 0.55 * s, z - 0.19 * s], 0.17 * s, 1.6);
  g.reel([x + 0.22 * s, y + 0.55 * s, z - 0.19 * s], 0.17 * s, 1.6);
}

/* ------------------------------------------------------------- models */

/** Research lab: stone hall with an observatory dome, a radio mast and a tilted dish. Low wing in front. */
const research: Build = (g, p) => {
  const { hw, hd } = extent(p);
  const wall = wallOf(p, 2);
  const front = hd;
  // Plinth
  g.box([hw * 2 + 0.6, 0.4, hd * 2 + 0.6], [0, 0.2, 0], PAST.stoneDark);
  // Tall rear hall
  const hb = 8.6;
  const zb = -hd * 0.45;
  const db = hd * 1.1;
  g.box([hw * 1.7, hb, db], [0, hb / 2, zb], wall);
  cornice(g, hw * 1.7, db, hb, zb);
  windows(g, { x0: -hw * 0.6, x1: hw * 0.6, y: 5.7, z: zb + db / 2, cols: 4, w: 1, h: 2.2 }, PAST.stoneLight);
  // Low front wing with portico
  const hf = 3.8;
  const df = hd * 0.9;
  const zf = front - df / 2;
  g.box([hw * 2, hf, df], [0, hf / 2 + 0.2, zf], wall);
  cornice(g, hw * 2, df, hf + 0.35, zf);
  windows(g, { x0: -hw * 0.75, x1: -hw * 0.38, y: 2.1, z: front, cols: 2, w: 0.9, h: 1.7 });
  windows(g, { x0: hw * 0.38, x1: hw * 0.75, y: 2.1, z: front, cols: 2, w: 0.9, h: 1.7 });
  door(g, front, 2, 2.6, PAST.glassDark);
  steps(g, 3.6, front + 1.1);
  lampBoard(g, 0, 3.4, front + 0.05, 6, 1);
  // Observatory dome on the rear roof, with its shutter slot as one dark strip over the crown: a narrow, slightly
  // larger half-ellipsoid that shows only as a band on the dome surface (nothing sticks out of the silhouette).
  const domeR = Math.min(hw, db) * 0.5;
  g.cyl(domeR + 0.2, domeR + 0.2, 0.6, [-hw * 0.35, hb + 0.3, zb], PAST.stone, 12);
  g.sphere(domeR, [-hw * 0.35, hb + 0.6, zb], PAST.steelLight, { w: 12, h: 4, dome: true });
  g.sphere(domeR * 1.04, [-hw * 0.35, hb + 0.6, zb], PAST.panel, { w: 12, h: 4, dome: true, scale: [0.3, 1, 1] });
  // Radio mast at the back right, the dish on the free front-right corner of the roof (clear of the dome)
  mast(g, hw * 0.55, zb - db * 0.2, hb + 0.2, 4.6, 0.6, [PAST.steel, PAST.steelDark]);
  g.at([hw * 0.52, hb + 0.4, zb + db * 0.26], 0.5, () => {
    g.box([0.2, 1.2, 0.2], [0, 0.6, 0], PAST.iron);
    g.cyl(1.3, 0.25, 0.5, [0, 1.5, 0.2], PAST.stoneLight, 10, [-0.7, 0, 0]);
    g.box([0.08, 0.08, 1.2], [0, 1.7, 0.75], PAST.iron, [-0.7, 0, 0]);
  });
  // Back and sides (the near half of the island sees them): two storeys of tall windows.
  backWindows(g, zb - db / 2, { cols: 4, rows: 2, span: hw * 1.2, y: 2.6, w: 1, h: 2, gapY: 1.3 });
  for (const s of [-1, 1]) {
    sideWindows(g, s * hw * 0.85, zb, { cols: 2, rows: 2, span: db * 0.5, y: 2.6, w: 1, h: 2, gapY: 1.3 });
    sideWindows(g, s * hw, zf, { cols: 1, span: 0, y: 2.1, w: 0.9, h: 1.7 });
  }
};

/** Archive: a stone portico in front of a giant filing cabinet (drawers, brass handles, manila labels). */
const documents: Build = (g, p) => {
  const { hw, hd } = extent(p);
  const front = hd;
  // Stylobate
  g.box([hw * 2 + 0.8, 0.45, hd * 2 + 1.2], [0, 0.22, 0.3], PAST.stone);
  steps(g, hw * 1.3, front + 1.4, 3, 0.15, 0.4);
  // Giant filing cabinet (the rear mass)
  const hc = 7.6;
  const dc = hd * 1.25;
  const zc = -hd + dc / 2;
  const cw = hw * 1.75;
  g.box([cw, hc, dc], [0, hc / 2 + 0.45, zc], PAST.steel);
  g.box([cw + 0.2, 0.3, dc + 0.2], [0, hc + 0.6, zc], PAST.steelDark);
  const zFace = zc + dc / 2;
  const drawers = 4;
  for (let col = 0; col < 2; col++) {
    const x = (col - 0.5) * cw * 0.5;
    for (let i = 0; i < drawers; i++) {
      const y = 0.45 + (hc / drawers) * (i + 0.5);
      // Only the drawers above the portico roof show; lower ones are still modelled (seen from the sides).
      g.box([cw * 0.46, hc / drawers - 0.25, 0.12], [x, y, zFace + 0.06], PAST.steelLight);
      g.box([0.9, 0.18, 0.18], [x, y - 0.35, zFace + 0.2], PAST.brass);
      g.box([0.8, 0.45, 0.06], [x, y + 0.35, zFace + 0.14], PAST.manilaLight);
    }
  }
  // One drawer pulled out, stuffed with manila folders.
  g.at([cw * 0.25, 0.45 + (hc / drawers) * 3.5, zFace + 0.9], 0, () => {
    g.box([cw * 0.42, 1.0, 1.7], [0, 0, 0], PAST.steelLight);
    for (let i = 0; i < 6; i++)
      g.box([cw * 0.38, 0.9, 0.1], [0, 0.45, -0.6 + i * 0.24], i % 2 ? PAST.manila : PAST.manilaDark);
  });
  // Portico: columns, entablature, pediment (front kept under ~5.5 m)
  const ph = 3.8;
  const zp = front + 0.2;
  const cols = 6;
  for (let i = 0; i < cols; i++) {
    const x = -hw * 0.85 + (hw * 1.7 * i) / (cols - 1);
    g.cyl(0.3, 0.36, ph, [x, 0.45 + ph / 2, zp], PAST.stoneLight, 8);
    g.box([0.85, 0.2, 0.85], [x, 0.45 + ph + 0.1, zp], PAST.stone);
  }
  const depthP = zp - (zc + dc / 2) + 0.8;
  const zMid = zp - depthP / 2 + 0.4;
  g.box([hw * 2 + 0.2, 0.6, depthP], [0, 0.45 + ph + 0.5, zMid], PAST.stoneLight);
  g.gable(hw * 2 + 0.2, 1.1, depthP, [0, 0.45 + ph + 0.8, zMid], wallOf(p));
  // Back wall of the porch with the door
  door(g, zc + dc / 2, 2.2, 2.8, PAST.woodDark);
  // Stack of record boxes by the steps
  for (let i = 0; i < 3; i++)
    g.box([1, 0.5, 0.75], [-hw * 0.95, 0.7 + i * 0.52, front + 1.6], i % 2 ? PAST.manilaDark : PAST.manila);
  // Back: the cabinet's drawers continue round the back (it is a filing cabinet from every side).
  g.at([0, 0, zc - dc / 2], Math.PI, () => {
    for (let col = 0; col < 2; col++) {
      const x = (col - 0.5) * cw * 0.5;
      for (let i = 0; i < drawers; i++) {
        const y = 0.45 + (hc / drawers) * (i + 0.5);
        g.box([cw * 0.46, hc / drawers - 0.25, 0.12], [x, y, 0.06], PAST.steelLight);
        g.box([0.9, 0.18, 0.18], [x, y - 0.35, 0.2], PAST.brass);
        g.box([0.8, 0.45, 0.06], [x, y + 0.35, 0.14], PAST.manilaLight);
      }
    }
  });
  for (const s of [-1, 1]) {
    g.at([(s * cw) / 2, 0, zc], (s * Math.PI) / 2, () => {
      for (let i = 0; i < drawers; i++)
        g.box([dc * 0.7, 0.12, 0.08], [0, 0.45 + (hc / drawers) * (i + 1), 0.04], PAST.steelDark);
    });
  }
};

/** Podcast studio: 1950s brick radio station, ON AIR lamp over the door, banded mast and a giant microphone. */
const podcast: Build = (g, p) => {
  const { hw, hd } = extent(p);
  const front = hd;
  const brick = p.colourIndex % 2 ? PAST.brick : PAST.brickDark;
  g.box([hw * 2 + 0.6, 0.35, hd * 2 + 0.6], [0, 0.17, 0], PAST.stoneDark);
  // Rear studio block
  const hb = 6.6;
  const db = hd * 1.15;
  const zb = -hd + db / 2;
  g.box([hw * 2, hb, db], [0, hb / 2, zb], brick);
  cornice(g, hw * 2, db, hb, zb);
  windows(g, { x0: -hw * 0.7, x1: hw * 0.7, y: 5.2, z: zb + db / 2, cols: 5, w: 0.8, h: 1.2 }, PAST.stoneLight);
  // Low front lobby
  const hf = 3.6;
  const df = hd * 2 - db + 0.4;
  const zf = front - df / 2;
  g.box([hw * 1.6, hf, df], [0, hf / 2, zf], wallOf(p));
  cornice(g, hw * 1.6, df, hf, zf, PAST.stone);
  door(g, front, 1.8, 2.4, PAST.woodDark);
  windows(g, { x0: -hw * 0.55, x1: hw * 0.55, y: 1.8, z: front, cols: 2, w: 1.4, h: 1.4 });
  // ON AIR box: dark case with a lamp row
  g.box([2.4, 0.8, 0.3], [0, 3.05, front + 0.15], PAST.panel);
  for (let i = 0; i < 5; i++) g.light([-0.8 + i * 0.4, 3.05, front + 0.32], 0.28, 0.42, false);
  // Mast behind, banded red and cream
  mast(g, -hw * 0.62, zb - db * 0.15, hb, 7.2, 0.9, [PAST.red, PAST.cream]);
  // Giant microphone on the studio roof
  microphone(g, hw * 0.4, hb + 0.2, zb + 0.4, 3.4);
  // Back and sides of the brick studio.
  backWindows(g, zb - db / 2, { cols: 5, rows: 2, span: hw * 1.4, y: 2, w: 0.8, h: 1.2, gapY: 2 });
  for (const s of [-1, 1])
    sideWindows(g, s * hw, zb, { cols: 2, rows: 2, span: db * 0.5, y: 2, w: 0.8, h: 1.2, gapY: 2 });
};

/** Interview booth: open-fronted timber-and-glass booth, two armchairs, a table with a recorder, a hanging mic. */
const interview: Build = (g, p) => {
  const { hw, hd } = extent(p);
  const front = hd;
  // Rear studio block (fills the collider). Kept low (about the booth's height) so that from behind (outer-ring
  // buildings show the camera their back) the high camera still sees over it into the open booth and the chairs,
  // like the interview booths on the other islands.
  const hb = 3.6;
  const db = hd * 0.75;
  const zb = -hd + db / 2;
  g.box([hw * 2, hb, db], [0, hb / 2, zb], wallOf(p, 1));
  cornice(g, hw * 2, db, hb, zb);
  windows(g, { x0: -hw * 0.6, x1: hw * 0.6, y: 2.3, z: zb + db / 2, cols: 3, w: 1.2, h: 1.2 }, PAST.stoneLight);
  // Booth: platform, posts, glass sides, roof band
  const bw = hw * 1.5;
  const bd = hd * 2 - db;
  const zc = zb + db / 2 + bd / 2;
  const bh = 3.6;
  g.box([bw + 0.4, 0.3, bd], [0, 0.15, zc], PAST.woodLight);
  for (const sx of [-1, 1]) {
    for (const f of [-0.5, 0, 0.5])
      g.box([0.18, bh, 0.18], [(sx * bw) / 2, 0.3 + bh / 2, zc + f * bd * 0.95], PAST.woodDark);
    // Glass side panels
    g.box([0.08, bh - 0.6, bd * 0.92], [(sx * bw) / 2, 0.3 + bh / 2 + 0.1, zc], PAST.glass);
  }
  // Open slatted roof (a pergola), so the high camera sees the two chairs inside.
  const ry = 0.3 + bh + 0.2;
  for (const sz of [-1, 1]) g.box([bw + 0.5, 0.4, 0.3], [0, ry, zc + (sz * bd) / 2], PAST.woodDark);
  for (const sx of [-1, 1]) g.box([0.3, 0.4, bd + 0.3], [(sx * (bw + 0.2)) / 2, ry, zc], PAST.woodDark);
  for (let i = 0; i < 5; i++) g.box([0.16, 0.22, bd], [-bw / 2 + (bw * (i + 1)) / 6, ry + 0.05, zc], PAST.wood);
  // Front glass transom only (open front)
  g.box([bw, 0.6, 0.08], [0, 0.3 + bh - 0.35, zc + bd / 2], PAST.glass);
  // RECORDING lamp on the roof band
  g.box([1.4, 0.5, 0.12], [0, 0.3 + bh + 0.65, zc + bd / 2 + 0.1], PAST.panel);
  g.light([0, 0.3 + bh + 0.65, zc + bd / 2 + 0.18], 1.1, 0.28, false);
  // Two chairs face each other across a small table
  g.at([-1.25, 0.3, zc], Math.PI / 2, () => armchair(g, PAST.red));
  g.at([1.25, 0.3, zc], -Math.PI / 2, () => armchair(g, PAST.brass));
  g.cyl(0.45, 0.45, 0.08, [0, 1.0, zc], PAST.wood, 10);
  g.cyl(0.07, 0.12, 0.7, [0, 0.65, zc], PAST.woodDark, 6);
  recorder(g, 0, 1.04, zc + 0.05, 0.6);
  // Hanging microphone
  g.box([0.05, 1.3, 0.05], [0, 0.3 + bh - 0.65, zc], PAST.iron);
  g.sphere(0.18, [0, 0.3 + bh - 1.4, zc], PAST.steelLight, { w: 8, h: 5, scale: [1, 1.4, 0.8] });
  // Low front step
  g.box([2.2, 0.15, 0.6], [0, 0.07, front + 0.4], PAST.stone);
  // Back of the studio wall.
  backWindows(g, zb - db / 2, { cols: 3, rows: 1, span: hw * 1.2, y: 2.0, w: 1.2, h: 1.2, gapY: 1.3 });
};

/** Cinema: 1950s movie palace with a lamp-lined marquee, a vertical blade sign and a big screen on the side. */
const video: Build = (g, p) => {
  const { hw, hd } = extent(p);
  const front = hd;
  const wall = wallOf(p, 1);
  g.box([hw * 2 + 0.4, 0.3, hd * 2 + 0.4], [0, 0.15, 0], PAST.stoneDark);
  // Tall auditorium at the back
  const hb = 9;
  const db = hd * 1.2;
  const zb = -hd + db / 2;
  g.box([hw * 1.9, hb, db], [0, hb / 2, zb], wall);
  cornice(g, hw * 1.9, db, hb, zb, PAST.manilaDark);
  // Giant screen on the auditorium's front face, above the lobby (pale with a dark border)
  g.box([hw * 1.5, 3.2, 0.12], [0, 6.8, zb + db / 2 + 0.06], PAST.ink);
  g.box([hw * 1.4, 2.8, 0.12], [0, 6.8, zb + db / 2 + 0.12], PAST.creamShade);
  // Lobby (low) in front
  const hf = 3.4;
  const df = hd * 2 - db + 0.3;
  const zf = front - df / 2;
  g.box([hw * 1.7, hf, df], [0, hf / 2, zf], wallOf(p, 2));
  door(g, front, 2.6, 2.4, PAST.ink);
  for (const s of [-1, 1]) {
    g.box([1.2, 1.7, 0.1], [s * hw * 0.6, 1.4, front + 0.05], PAST.brass);
    g.box([1.0, 1.5, 0.1], [s * hw * 0.6, 1.4, front + 0.1], s > 0 ? PAST.red : PAST.chalkboard);
  }
  // Marquee canopy with chaser lamps along its front edge and sides
  const mw = hw * 1.8;
  const mz = front + 1;
  g.box([mw, 1.1, 2], [0, hf + 0.25, mz - 0.4], PAST.manilaLight);
  g.box([mw + 0.2, 0.2, 2.2], [0, hf - 0.4, mz - 0.4], PAST.ink);
  const n = 12;
  for (let i = 0; i < n; i++) g.light([-mw / 2 + 0.35 + (i * (mw - 0.7)) / (n - 1), hf + 0.25, mz + 0.62], 0.22, 0.22);
  g.box([mw * 0.8, 0.5, 0.06], [0, hf + 0.25, mz + 0.62], PAST.panel);
  // Vertical blade sign at the corner
  g.at([hw * 0.95, 0, zf + df * 0.2], 0, () => {
    g.box([0.4, 4.6, 1.3], [0, hf + 2.8, 0], PAST.red);
    for (let i = 0; i < 6; i++) g.light([0.22, hf + 1.0 + i * 0.7, 0], 0.3, 0.3, false, [0, Math.PI / 2, 0]);
    for (let i = 0; i < 6; i++) g.light([-0.22, hf + 1.0 + i * 0.7, 0], 0.3, 0.3, false, [0, -Math.PI / 2, 0]);
  });
  // Back: a high row of small windows and a stage door; sides: tall blind arcades.
  backWindows(g, zb - db / 2, { cols: 4, span: hw * 1.3, y: 7.4, w: 0.7, h: 0.9 });
  backWindows(g, zb - db / 2, { cols: 1, span: 0, y: 1.2, w: 1.6, h: 2.4, glass: PAST.woodDark });
  for (const s of [-1, 1]) {
    sideWindows(g, s * hw * 0.95, zb, { cols: 3, span: db * 0.6, y: 4.6, w: 1.1, h: 5, glass: PAST.manilaDark });
  }
};

/** Gallery: stone museum with a saw-tooth skylight roof and three giant gilt frames on the front. */
const animation: Build = (g, p) => {
  const { hw, hd } = extent(p);
  const front = hd;
  const wall = wallOf(p, 3);
  g.box([hw * 2 + 0.6, 0.4, hd * 2 + 0.6], [0, 0.2, 0], PAST.stone);
  steps(g, 4, front + 1.0, 2, 0.2, 0.5);
  // Main hall (lower front, raised rear gallery)
  const hf = 4.6;
  g.box([hw * 2, hf, hd * 2], [0, hf / 2 + 0.4, 0], wall);
  cornice(g, hw * 2, hd * 2, hf + 0.4, 0, PAST.stoneLight);
  const hr = 2.4;
  g.box([hw * 2, hr, hd], [0, hf + 0.4 + hr / 2, -hd / 2], wall);
  // Saw-tooth skylights on the rear block
  for (let i = 0; i < 4; i++) {
    const x = -hw + hw * 0.25 + i * hw * 0.5;
    g.gable(hw * 0.5, 1.2, hd, [x, hf + 0.4 + hr, -hd / 2], i % 2 ? PAST.slate : PAST.slateDark);
    g.box([0.06, 0.9, hd * 0.9], [x + hw * 0.12, hf + 0.4 + hr + 0.45, -hd / 2], PAST.glass, [0, 0, -0.9]);
  }
  // Three big frames (brass) with abstract colour fields (not real works)
  const fills = [PAST.chalkboard, PAST.red, PAST.manilaDark];
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * hw * 0.62;
    g.box([hw * 0.5, 2.6, 0.2], [x, 2.6, front + 0.1], PAST.brass);
    g.box([hw * 0.42, 2.2, 0.1], [x, 2.6, front + 0.22], fills[i]!);
    g.box([hw * 0.2, 0.9, 0.06], [x - hw * 0.05, 2.9, front + 0.29], PAST.cream);
  }
  // Door between the frames is replaced by a side entrance
  g.box([1.4, 2.4, 0.12], [hw * 1.0, 1.6, front - 1.2], PAST.woodDark, [0, Math.PI / 2, 0]);
  // A frame on an easel out front
  g.at([-hw * 0.9, 0.4, front + 1.6], 0.35, () => {
    g.box([0.1, 2.4, 0.1], [-0.6, 1.2, 0], PAST.woodDark, [0.12, 0, 0]);
    g.box([0.1, 2.4, 0.1], [0.6, 1.2, 0], PAST.woodDark, [0.12, 0, 0]);
    g.box([0.1, 2.4, 0.1], [0, 1.2, -0.5], PAST.woodDark, [-0.3, 0, 0]);
    g.box([1.6, 1.2, 0.1], [0, 1.6, 0.12], PAST.brass);
    g.box([1.4, 1.0, 0.06], [0, 1.6, 0.18], PAST.phosphorDim);
  });
  // Back and sides of the hall.
  backWindows(g, -hd, { cols: 4, span: hw * 1.4, y: 2.8, w: 1, h: 2 });
  for (const s of [-1, 1]) sideWindows(g, s * hw, 0, { cols: 3, span: hd * 1.2, y: 2.8, w: 1, h: 2 });
};

/** Arcade: 1950s "electronic brain" fun house: console front with a scope screen, toggles and a big joystick. */
const experience: Build = (g, p) => {
  const { hw, hd } = extent(p);
  const front = hd;
  g.box([hw * 2 + 0.4, 0.3, hd * 2 + 0.4], [0, 0.15, 0], PAST.stoneDark);
  // Rear block with a striped awning band
  const hb = 6.4;
  const db = hd * 1.1;
  const zb = -hd + db / 2;
  g.box([hw * 2, hb, db], [0, hb / 2, zb], wallOf(p));
  for (let i = 0; i < 8; i++) {
    g.box(
      [(hw * 2) / 8, 0.9, 0.5],
      [-hw + (hw / 8) * (2 * i + 1), hb - 0.6, zb + db / 2 + 0.25],
      i % 2 ? PAST.cream : PAST.phosphorDim,
    );
  }
  // Glowing strip along the roofline (the era's "neon")
  for (let i = 0; i < 14; i++)
    g.light([-hw + 0.4 + (i * (hw * 2 - 0.8)) / 13, hb - 1.25, zb + db / 2 + 0.52], 0.5, 0.14);
  // Console front: a sloped desk the full width
  const hf = 3.2;
  const df = hd * 2 - db + 0.2;
  const zf = front - df / 2;
  g.box([hw * 2, hf, df], [0, hf / 2, zf], PAST.steel);
  g.box([hw * 2 + 0.1, 0.3, df + 0.1], [0, hf + 0.15, zf], PAST.steelDark);
  // Scope screen (round, lit) in a dark bezel
  g.box([2.6, 2.2, 0.16], [-hw * 0.45, 1.85, front + 0.08], PAST.panel);
  g.disc(0.85, [-hw * 0.45, 1.85, front + 0.18], PAST.ink, 14);
  g.light([-hw * 0.45, 1.85, front + 0.2], 1.2, 0.08, true);
  g.light([-hw * 0.45 - 0.2, 2.15, front + 0.21], 0.12, 0.12, true);
  // Row of giant toggle switches
  for (let i = 0; i < 5; i++) {
    const x = hw * 0.15 + i * 0.75;
    g.box([0.5, 0.5, 0.12], [x, 1.2, front + 0.06], PAST.steelLight);
    g.box([0.12, 0.6, 0.12], [x, 1.45, front + 0.3], PAST.cream, [i % 2 ? 0.6 : -0.6, 0, 0]);
    g.light([x, 2.1, front + 0.03], 0.22, 0.22);
  }
  // Big joystick out front
  g.at([-hw * 0.95, 0.3, front + 1.4], 0, () => {
    g.box([1.4, 0.5, 1.4], [0, 0.25, 0], PAST.steelDark);
    g.cyl(0.14, 0.14, 2.2, [0, 1.5, 0], PAST.iron, 6, [0.25, 0, 0.2]);
    g.sphere(0.45, [0.22, 2.55, 0.27], PAST.red, { w: 8, h: 6 });
  });
  door(g, front, 1.6, 2.4, PAST.ink);
  // Back and sides of the rear block.
  backWindows(g, zb - db / 2, { cols: 4, rows: 2, span: hw * 1.4, y: 1.8, w: 1, h: 1.3, gapY: 1.3 });
  for (const s of [-1, 1]) sideWindows(g, s * hw, zb, { cols: 2, span: db * 0.5, y: 3.2, w: 1, h: 1.6 });
};

const BUILDERS: Record<BuildingKind, Build> = {
  podcast,
  interview,
  documents,
  research,
  video,
  animation,
  experience,
};

/** Top of each model (for the floating beacon). */
export const PAST_MODEL_HEIGHT: Record<BuildingKind, number> = {
  podcast: 15,
  interview: 6.6,
  documents: 8.6,
  research: 14.4,
  video: 9.4,
  animation: 8.6,
  experience: 6.8,
};

/* ------------------------------------------------------------ exports */

/** The model component handed to <Building Model=...>: one mesh, built once per prop change. */
export function PastBuildingModel(p: BuildingModelProps) {
  const material = usePastMaterial();
  const low = usePastLow();
  const { kind, plot, colourIndex, comingSoon, palette, eraId } = p;
  const geometry = useMemo(() => {
    const g = new Geo();
    // Low: reels become part of this mesh (no instanced reel draw call); High: the island spins them.
    g.bakeReels = low;
    const props: BuildingModelProps = { kind, plot, colourIndex, comingSoon, palette, eraId };
    BUILDERS[kind](g, props);
    if (comingSoon) comingSoonBarrier(g, props);
    return g.build();
  }, [kind, plot, colourIndex, comingSoon, palette, eraId, low]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

/**
 * World-space lamps and reels of one placed building (the island draws them instanced). Pass a Geo made with
 * `withGeometry: false` (only lights, reels and colliders are recorded) and the same `bakeReels` as the models.
 */
export function pastBuildingExtras(b: PlacedBuilding, g: Geo) {
  g.at(b.position, b.rotationY, () => {
    BUILDERS[b.kind](g, {
      kind: b.kind,
      eraId: b.eraId,
      palette: ERA_PALETTE[b.eraId],
      plot: b.plot,
      colourIndex: b.colourIndex,
      comingSoon: b.comingSoon,
    });
  });
}
