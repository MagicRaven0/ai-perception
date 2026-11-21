"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactElement, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { motion } from "@/lib/three/motion";
import { pick } from "@/lib/three/palette";
import { JOBS } from "@/lib/three/palettes/jobs-era";
import type { ScatterItem } from "@/lib/three/scatter";
import { Box, Cyl, Disc, Extruded, Gable, Ico, Patch, Ring, RoundBox, RoundPanel, Sphere, type V3 } from "./parts";
import type { DecorItem, DecorKind, PathStrip } from "./plan";

/**
 * THE JOBS ERA decor: the design-studio town square and its small-town details, all built from primitives
 * (no downloads). Everything here is static and goes inside ONE kit/StaticMerge in the island file, so the
 * whole set costs a "cast" bucket (+ its shadow pass) and a "flat" bucket. Tiny props are shade="flat"
 * (no shadows from tiny props). The only animated piece, the voice-waveform bars, is a separate instanced
 * mesh (<WaveformBars>) outside the merge.
 *
 * No logos, no lettering, no OS UI copies: the computers are generic beige boxes (desktop case + CRT, tower +
 * monitor, laptop), the wall is a generic window-and-icon desktop, the pointer is the generic arrow cursor.
 */

/* ------------------------------------------------------------ pointer arrow */

/** The generic arrow cursor outline (units; tip at the origin, y up). */
const CURSOR: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, -16],
  [3.8, -12.4],
  [6.4, -18.6],
  [8.8, -17.6],
  [6.2, -11.6],
  [11.4, -11.6],
];

/** Miter offset of a closed polygon by d (positive = outwards for a counter-clockwise outline). */
function offsetPolygon(pts: readonly (readonly [number, number])[], d: number): [number, number][] {
  const n = pts.length;
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    const e1 = norm(p1[0] - p0[0], p1[1] - p0[1]);
    const e2 = norm(p2[0] - p1[0], p2[1] - p1[1]);
    // Outward normals of a CCW polygon: (dy, -dx).
    const n1: [number, number] = [e1[1], -e1[0]];
    const n2: [number, number] = [e2[1], -e2[0]];
    const m = norm(n1[0] + n2[0], n1[1] + n2[1]);
    const cos = m[0] * n1[0] + m[1] * n1[1];
    const len = d / Math.max(cos, 0.35);
    out.push([p1[0] + m[0] * len, p1[1] + m[1] * len]);
  }
  return out;
}

function norm(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

/**
 * Cursor standing on its tail: rotated so the tail end is level and the arrow points straight up,
 * scaled so it is `height` tall, tail centre at the origin.
 */
function standingCursor(height: number): { body: [number, number][]; outline: [number, number][] } {
  const tailA = CURSOR[3]!;
  const tailB = CURSOR[4]!;
  const tail: [number, number] = [(tailA[0] + tailB[0]) / 2, (tailA[1] + tailB[1]) / 2];
  const axis = Math.atan2(0 - tail[1], 0 - tail[0]); // tail -> tip
  const rot = Math.PI / 2 - axis;
  const length = Math.hypot(tail[0], tail[1]);
  const s = height / length;
  const tf = ([x, y]: readonly [number, number]): [number, number] => {
    const dx = x - tail[0];
    const dy = y - tail[1];
    return [(dx * Math.cos(rot) - dy * Math.sin(rot)) * s, (dx * Math.sin(rot) + dy * Math.cos(rot)) * s];
  };
  return { body: CURSOR.map(tf), outline: offsetPolygon(CURSOR, 0.75).map(tf) };
}

/* ------------------------------------------------------------ inner square */

/** Central plaza: cream disc with a soft rim, and a giant pointer arrow on a pink plinth. */
function Plaza() {
  const cursor = useMemo(() => standingCursor(6.8), []);
  return (
    <group>
      <Disc r={6.6} seg={40} y={0.018} color={JOBS.creamShade} />
      <Disc r={6.2} seg={40} y={0.024} color={JOBS.cream} />
      <Ring inner={2.6} outer={2.95} seg={32} y={0.03} color={JOBS.pinkSoft} />
      <RoundBox size={[3.4, 0.6, 3.4]} r={0.9} position={[0, 0.3, 0]} color={JOBS.pink} />
      <RoundBox size={[2.6, 0.25, 2.6]} r={0.7} position={[0, 0.72, 0]} color={JOBS.white} />
      {/* Leans back a little so its face catches the sky light */}
      <group position={[0, 0.6, 0]} rotation-x={-0.22}>
        <Extruded points={cursor.outline} depth={0.5} position={[0, 0, -0.08]} color={JOBS.ink} />
        <Extruded points={cursor.body} depth={0.62} position={[0, 0, 0.02]} color={JOBS.white} />
      </group>
    </group>
  );
}

/** Low round fountain with a pink rim and a little tiered bowl. */
function Fountain() {
  return (
    <group>
      <Disc r={3.5} seg={28} y={0.022} color={JOBS.cream} />
      <Cyl r={[2.3, 2.45]} h={0.6} seg={20} position={[0, 0.3, 0]} color={JOBS.pink} />
      <Cyl r={2.05} h={0.08} seg={20} position={[0, 0.58, 0]} color={JOBS.water} shade="flat" />
      <Cyl r={[0.25, 0.35]} h={1.5} seg={8} position={[0, 1.2, 0]} color={JOBS.white} />
      <Cyl r={[0.95, 0.35]} h={0.32} seg={14} position={[0, 1.95, 0]} color={JOBS.white} />
      <Cyl r={0.8} h={0.06} seg={14} position={[0, 2.1, 0]} color={JOBS.water} shade="flat" />
      <Sphere r={0.32} w={8} h={5} position={[0, 2.35, 0]} color={JOBS.water} shade="flat" />
    </group>
  );
}

/** A generic window on the desktop wall: white panel, solid title strip, content drawn by children. */
function DeskWindow({
  position,
  size,
  bar,
  children,
}: {
  position: V3;
  size: [number, number];
  bar: string;
  children?: ReactNode;
}) {
  const [w, h] = size;
  return (
    <group position={position}>
      <RoundPanel size={[w + 0.12, h + 0.12, 0.08]} r={0.16} position={[0, 0, -0.02]} color={JOBS.charcoal} />
      <RoundPanel size={[w, h, 0.1]} r={0.12} color={JOBS.white} />
      <Box size={[w - 0.2, 0.4, 0.06]} position={[0, h / 2 - 0.3, 0.06]} color={bar} shade="flat" />
      <group position={[0, -0.2, 0.08]}>{children}</group>
    </group>
  );
}

/** Window-and-icon wall: a giant friendly desktop on two feet. No OS chrome, no lettering. */
function DesktopWall() {
  const pointer = useMemo(() => {
    const scale = 0.055;
    return CURSOR.map(([x, y]) => [x * scale, y * scale] as [number, number]);
  }, []);
  return (
    <group>
      {[-3.9, 3.9].map((x) => (
        <RoundBox key={x} size={[1.3, 0.5, 1.8]} r={0.35} position={[x, 0.25, 0]} color={JOBS.platinumDark} />
      ))}
      <RoundPanel size={[10.6, 5.9, 0.55]} r={0.6} position={[0, 3.45, 0]} color={JOBS.platinum} />
      <RoundPanel size={[9.8, 5.1, 0.1]} r={0.35} position={[0, 3.5, 0.3]} color={JOBS.skyDeep} />
      {/* Big window: lines of text and a small bar chart */}
      <DeskWindow position={[0.1, 3.9, 0.4]} size={[4.8, 3.2]} bar={JOBS.pink}>
        {[0.7, 0.3, -0.1].map((y, i) => (
          <Box
            key={y}
            size={[2.4 - i * 0.5, 0.16, 0.04]}
            position={[-0.9 + i * 0.25, y, 0]}
            color={JOBS.platinumDark}
            shade="flat"
          />
        ))}
        {[
          [0.9, 0.7, JOBS.pink],
          [1.4, 1.1, JOBS.butter],
          [1.9, 0.5, JOBS.skyDeep],
        ].map(([x, h, c]) => (
          <Box
            key={x as number}
            size={[0.38, h as number, 0.06]}
            position={[x as number, -0.95 + (h as number) / 2, 0]}
            color={c as string}
            shade="flat"
          />
        ))}
      </DeskWindow>
      {/* Overlapping picture window: sun over hills */}
      <DeskWindow position={[2.85, 2.65, 0.62]} size={[3.4, 2.2]} bar={JOBS.butter}>
        <Box size={[3.0, 1.45, 0.04]} position={[0, -0.05, 0]} color={JOBS.sky} shade="flat" />
        <Cyl
          r={0.28}
          h={0.05}
          seg={10}
          position={[0.8, 0.3, 0.03]}
          rotation={[Math.PI / 2, 0, 0]}
          color={JOBS.butter}
          shade="flat"
        />
        <Extruded
          points={[
            [-1.5, -0.77],
            [1.5, -0.77],
            [1.5, -0.35],
            [0.4, 0.15],
            [-0.5, -0.3],
            [-1.5, 0.05],
          ]}
          depth={0.05}
          position={[0, 0, 0.04]}
          color={JOBS.mint}
          shade="flat"
        />
      </DeskWindow>
      {/* Icons down the left edge: folder, document, picture (generic shapes, no OS layout) */}
      <group position={[-4.15, 0, 0.4]}>
        {/* Folder */}
        <Box size={[0.8, 0.55, 0.08]} position={[0, 5.0, 0]} color={JOBS.butter} shade="flat" />
        <Box size={[0.35, 0.14, 0.08]} position={[-0.2, 5.33, 0]} color={JOBS.butter} shade="flat" />
        <Box size={[0.75, 0.12, 0.06]} position={[0, 4.55, 0]} color={JOBS.white} shade="flat" />
        {/* Document */}
        <Box size={[0.6, 0.75, 0.08]} position={[0, 3.75, 0]} color={JOBS.white} shade="flat" />
        {[0.15, 0, -0.15].map((y) => (
          <Box key={y} size={[0.4, 0.06, 0.04]} position={[0, 3.75 + y, 0.05]} color={JOBS.platinumDark} shade="flat" />
        ))}
        <Box size={[0.75, 0.12, 0.06]} position={[0, 3.2, 0]} color={JOBS.white} shade="flat" />
        {/* Picture */}
        <Box size={[0.75, 0.6, 0.08]} position={[0, 2.4, 0]} color={JOBS.mint} shade="flat" />
        <Box size={[0.2, 0.2, 0.06]} position={[0.18, 2.55, 0.05]} color={JOBS.butter} shade="flat" />
        <Box size={[0.75, 0.12, 0.06]} position={[0, 1.8, 0]} color={JOBS.white} shade="flat" />
      </group>
      {/* Pointer resting on the picture window */}
      <Extruded
        points={pointer}
        depth={0.06}
        position={[4.05, 2.7, 0.78]}
        rotation={[0, 0, 0.15]}
        color={JOBS.ink}
        shade="flat"
      />
      {/* Back: a few vents so the wall reads from behind too */}
      {[1.6, 2.2, 2.8].map((y) => (
        <Box key={y} size={[3, 0.14, 0.06]} position={[0, y + 2.2, -0.3]} color={JOBS.platinumDark} shade="flat" />
      ))}
    </group>
  );
}

/** Waveform plinth (the bars themselves are <WaveformBars>, animated and instanced). */
function WaveformPlinth() {
  return (
    <group>
      <RoundBox size={[7.2, 0.5, 1.8]} r={0.6} position={[0, 0.25, 0]} color={JOBS.white} />
      <RoundBox size={[6.8, 0.12, 1.4]} r={0.5} position={[0, 0.56, 0]} color={JOBS.pinkSoft} shade="flat" />
    </group>
  );
}

/* ------------------------------------------------------- desk computers */

function Pad({ w = 3.8, d = 3.6 }: { w?: number; d?: number }) {
  return <RoundBox size={[w, 0.2, d]} r={0.6} position={[0, 0.1, 0]} color={JOBS.creamShade} shade="flat" />;
}

function Keyboard({ position, color }: { position: V3; color: string }) {
  return (
    <group position={position} rotation-x={0.06}>
      <Box size={[2.4, 0.16, 0.85]} position={[0, 0.08, 0]} color={color} shade="flat" />
      {[-0.22, 0, 0.22].map((z) => (
        <Box key={z} size={[2.1, 0.05, 0.14]} position={[0, 0.18, z]} color={JOBS.beigeShade} shade="flat" />
      ))}
    </group>
  );
}

/** Two-button mouse with a cord. */
function Mouse({ position, color }: { position: V3; color: string }) {
  return (
    <group position={position}>
      <RoundBox size={[0.42, 0.2, 0.62]} r={0.15} position={[0, 0.1, 0]} color={color} shade="flat" />
      <Box size={[0.03, 0.03, 0.24]} position={[0, 0.21, 0.16]} color={JOBS.charcoal} shade="flat" />
      <Box size={[0.05, 0.05, 0.9]} position={[0, 0.03, -0.75]} color={JOBS.charcoal} shade="flat" />
    </group>
  );
}

function ScreenText({ z, lit = JOBS.screenLit }: { z: number; lit?: string }) {
  return (
    <>
      {[0.3, 0.08, -0.14].map((y, i) => (
        <Box key={y} size={[1.0 - i * 0.25, 0.1, 0.03]} position={[-0.15 + i * 0.12, y, z]} color={lit} shade="flat" />
      ))}
    </>
  );
}

/** 1980s: beige desktop case with a CRT monitor on top, keyboard and mouse. */
function DeskCrt() {
  return (
    <group>
      <Pad />
      <Box size={[2.6, 0.7, 2.0]} position={[0, 0.55, -0.4]} color={JOBS.beige} />
      {[-0.55, 0.45].map((x) => (
        <Box key={x} size={[0.75, 0.08, 0.04]} position={[x, 0.6, 0.62]} color={JOBS.charcoal} shade="flat" />
      ))}
      <Box size={[0.12, 0.08, 0.04]} position={[1.1, 0.42, 0.62]} color={JOBS.pink} shade="flat" />
      {/* CRT: bezel + deep back */}
      <Box size={[1.6, 1.25, 1.1]} position={[0, 1.6, -0.95]} color={JOBS.beigeShade} />
      <Box size={[2.0, 1.75, 0.45]} position={[0, 1.8, -0.2]} color={JOBS.beige} />
      <RoundPanel size={[1.55, 1.25, 0.06]} r={0.18} position={[0, 1.85, 0.04]} color={JOBS.screen} shade="flat" />
      <group position={[0, 1.85, 0]}>
        <ScreenText z={0.09} />
      </group>
      <Keyboard position={[0, 0.2, 1.1]} color={JOBS.beige} />
      <Mouse position={[1.55, 0.2, 1.0]} color={JOBS.beige} />
    </group>
  );
}

/** 1990s: platinum tower beside a monitor on a swivel stand. */
function DeskTower() {
  return (
    <group>
      <Pad />
      <Box size={[0.95, 2.3, 2.0]} position={[-1.35, 1.35, -0.3]} color={JOBS.platinum} />
      {[2.0, 1.75].map((y) => (
        <Box key={y} size={[0.65, 0.12, 0.04]} position={[-1.35, y, 0.72]} color={JOBS.charcoal} shade="flat" />
      ))}
      <Box size={[0.12, 0.12, 0.04]} position={[-1.35, 0.8, 0.72]} color={JOBS.pink} shade="flat" />
      {/* Monitor */}
      <Box size={[0.9, 0.08, 0.7]} position={[0.55, 0.24, -0.3]} color={JOBS.platinumDark} />
      <Cyl r={0.18} h={0.45} seg={8} position={[0.55, 0.48, -0.3]} color={JOBS.platinumDark} />
      <Box size={[1.4, 1.1, 0.9]} position={[0.55, 1.45, -0.75]} color={JOBS.platinumDark} />
      <Box size={[1.95, 1.6, 0.35]} position={[0.55, 1.5, -0.15]} color={JOBS.platinum} />
      <RoundPanel size={[1.6, 1.22, 0.06]} r={0.12} position={[0.55, 1.55, 0.04]} color={JOBS.skyDeep} shade="flat" />
      {/* Two little windows on screen */}
      <Box size={[0.8, 0.55, 0.03]} position={[0.3, 1.65, 0.09]} color={JOBS.white} shade="flat" />
      <Box size={[0.6, 0.45, 0.03]} position={[0.85, 1.4, 0.11]} color={JOBS.pinkSoft} shade="flat" />
      <Keyboard position={[0.2, 0.2, 1.15]} color={JOBS.platinum} />
      <Mouse position={[1.75, 0.2, 1.05]} color={JOBS.platinum} />
    </group>
  );
}

/** 2000s: an open laptop. */
function DeskLaptop() {
  return (
    <group>
      <Pad />
      <RoundBox size={[2.9, 0.2, 2.1]} r={0.18} position={[0, 0.3, 0.2]} color={JOBS.platinum} />
      <Box size={[2.5, 0.03, 0.95]} position={[0, 0.41, 0.0]} color={JOBS.platinumDark} shade="flat" />
      <Box size={[0.8, 0.03, 0.5]} position={[0, 0.41, 0.85]} color={JOBS.white} shade="flat" />
      <group position={[0, 0.4, -0.82]} rotation-x={-0.32}>
        <RoundPanel size={[2.9, 2.0, 0.12]} r={0.18} position={[0, 1.0, 0]} color={JOBS.platinum} />
        <RoundPanel size={[2.55, 1.65, 0.04]} r={0.08} position={[0, 1.02, 0.07]} color={JOBS.screen} shade="flat" />
        <group position={[0, 1.02, 0]}>
          <Box size={[1.2, 0.8, 0.03]} position={[-0.4, 0.15, 0.1]} color={JOBS.sky} shade="flat" />
          <Box size={[0.9, 0.6, 0.03]} position={[0.55, -0.2, 0.12]} color={JOBS.pinkSoft} shade="flat" />
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------ town props */

function PicnicTable({ variant }: { variant: number }) {
  const canopy = variant % 2 ? JOBS.white : JOBS.pink;
  const trim = variant % 2 ? JOBS.pink : JOBS.white;
  return (
    <group>
      <Box size={[2.4, 0.12, 1.0]} position={[0, 0.8, 0]} color={JOBS.wood} shade="flat" />
      {[-0.85, 0.85].map((z) => (
        <Box key={z} size={[2.4, 0.1, 0.35]} position={[0, 0.45, z]} color={JOBS.wood} shade="flat" />
      ))}
      {[-0.9, 0.9].map((x) => (
        <Box key={x} size={[0.1, 0.8, 1.9]} position={[x, 0.4, 0]} color={JOBS.woodDark} shade="flat" />
      ))}
      <Cyl r={0.05} h={2.5} seg={5} position={[0, 1.25, 0]} color={JOBS.white} />
      <Cyl r={[0.1, 1.55]} h={0.55} seg={8} position={[0, 2.5, 0]} color={canopy} />
      <Cyl r={1.56} h={0.08} seg={8} position={[0, 2.22, 0]} color={trim} />
    </group>
  );
}

function Bench() {
  return (
    <group>
      <Box size={[1.7, 0.1, 0.5]} position={[0, 0.45, 0]} color={JOBS.wood} shade="flat" />
      <Box size={[1.7, 0.42, 0.08]} position={[0, 0.78, -0.22]} color={JOBS.wood} shade="flat" />
      {[-0.7, 0.7].map((x) => (
        <Box key={x} size={[0.08, 0.45, 0.45]} position={[x, 0.22, -0.02]} color={JOBS.charcoal} shade="flat" />
      ))}
    </group>
  );
}

function Lamp() {
  return (
    <group>
      <Cyl r={0.16} h={0.3} seg={5} position={[0, 0.15, 0]} color={JOBS.charcoal} shade="flat" />
      <Cyl r={0.07} h={3.2} seg={5} position={[0, 1.7, 0]} color={JOBS.charcoal} />
      <Ico r={0.32} position={[0, 3.45, 0]} color={JOBS.butter} />
      <Cyl r={[0.08, 0.3]} h={0.16} seg={6} position={[0, 3.72, 0]} color={JOBS.charcoal} />
    </group>
  );
}

/** Phone box: pink frame, glass sides, white cap. No lettering. */
function PhoneBox() {
  return (
    <group>
      <Box size={[1.25, 0.15, 1.25]} position={[0, 0.07, 0]} color={JOBS.platinumDark} shade="flat" />
      {[
        [-0.52, -0.52],
        [0.52, -0.52],
        [-0.52, 0.52],
        [0.52, 0.52],
      ].map(([x, z]) => (
        <Box key={`${x},${z}`} size={[0.14, 2.4, 0.14]} position={[x!, 1.35, z!]} color={JOBS.pink} />
      ))}
      <Box size={[0.95, 2.0, 0.95]} position={[0, 1.3, 0]} color={JOBS.sky} />
      <Box size={[0.96, 0.22, 0.96]} position={[0, 0.5, 0]} color={JOBS.pink} shade="flat" />
      <RoundBox size={[1.35, 0.3, 1.35]} r={0.3} position={[0, 2.66, 0]} color={JOBS.white} />
      <Box size={[0.9, 0.24, 0.06]} position={[0, 2.32, 0.55]} color={JOBS.white} shade="flat" />
      <Box size={[0.3, 0.45, 0.2]} position={[0, 1.5, -0.38]} color={JOBS.charcoal} shade="flat" />
    </group>
  );
}

function BikeRack() {
  return (
    <group>
      <Box size={[2.4, 0.08, 0.5]} position={[0, 0.04, 0]} color={JOBS.platinumDark} shade="flat" />
      {[-0.8, 0, 0.8].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box size={[0.06, 0.75, 0.06]} position={[0, 0.42, -0.2]} color={JOBS.charcoal} shade="flat" />
          <Box size={[0.06, 0.75, 0.06]} position={[0, 0.42, 0.2]} color={JOBS.charcoal} shade="flat" />
          <Box size={[0.06, 0.06, 0.46]} position={[0, 0.8, 0]} color={JOBS.charcoal} shade="flat" />
        </group>
      ))}
    </group>
  );
}

const FLOWERS = [JOBS.pink, JOBS.butter, JOBS.white, JOBS.pinkDeep];

function FlowerBed({ variant }: { variant: number }) {
  return (
    <group>
      <RoundBox size={[2.0, 0.3, 1.2]} r={0.45} position={[0, 0.15, 0]} color={JOBS.creamShade} shade="flat" />
      <RoundBox size={[1.7, 0.08, 0.9]} r={0.35} position={[0, 0.32, 0]} color={JOBS.hedge} shade="flat" />
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <Ico
          key={x}
          r={0.2}
          position={[x, 0.48, i % 2 ? 0.18 : -0.18]}
          color={pick(FLOWERS, i + variant)}
          shade="flat"
        />
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- houses */

const HOUSE_WALLS = [JOBS.white, JOBS.pinkSoft, JOBS.mint, JOBS.peach, JOBS.lilac, JOBS.platinum];
const HOUSE_ROOFS = [JOBS.pink, JOBS.skyDeep, JOBS.pinkDeep, JOBS.platinumDark, JOBS.butter];

function Win({ position, w = 0.9, h = 0.9 }: { position: V3; w?: number; h?: number }) {
  return (
    <group position={position}>
      <Box size={[w + 0.18, h + 0.18, 0.06]} color={JOBS.white} shade="flat" />
      <Box size={[w, h, 0.08]} color={JOBS.sky} shade="flat" />
    </group>
  );
}

/**
 * Small studio house that fills the gaps between content buildings. Three variants, faces local +Z (the road),
 * windows on all four sides so it reads from any camera side.
 */
function House({ variant }: { variant: number }) {
  const wall = pick(HOUSE_WALLS, variant);
  const roof = pick(HOUSE_ROOFS, variant * 2 + 1);
  const type = variant % 3;

  if (type === 1) {
    // Modern flat-roof studio with a big rounded window and an awning.
    const w = 5.4;
    const d = 4.4;
    const h = 3.3;
    return (
      <group>
        <RoundBox size={[w, h, d]} r={0.6} position={[0, h / 2, 0]} color={wall} />
        <RoundBox size={[w + 0.3, 0.3, d + 0.3]} r={0.7} position={[0, h + 0.15, 0]} color={roof} />
        <RoundPanel
          size={[2.6, 1.5, 0.08]}
          r={0.3}
          position={[-0.9, 1.9, d / 2 + 0.02]}
          color={JOBS.sky}
          shade="flat"
        />
        <Box size={[3.0, 0.14, 1.0]} position={[-0.9, 2.8, d / 2 + 0.5]} color={roof} />
        <Box size={[1.0, 2.0, 0.08]} position={[1.7, 1.0, d / 2 + 0.02]} color={JOBS.charcoal} shade="flat" />
        <Win position={[-1.2, 2.0, -d / 2 - 0.02]} w={1.4} />
        <Win position={[1.2, 2.0, -d / 2 - 0.02]} w={1.4} />
        <Box size={[0.08, 1.0, 1.4]} position={[w / 2 + 0.01, 2.0, 0]} color={JOBS.sky} shade="flat" />
        <Box size={[0.08, 1.0, 1.4]} position={[-w / 2 - 0.01, 2.0, 0]} color={JOBS.sky} shade="flat" />
        <RoundBox
          size={[1.6, 0.5, 0.6]}
          r={0.2}
          position={[-0.9, 0.25, d / 2 + 0.5]}
          color={JOBS.creamShade}
          shade="flat"
        />
        <Ico r={0.3} position={[-1.4, 0.65, d / 2 + 0.5]} color={JOBS.hedge} shade="flat" />
        <Ico r={0.3} position={[-0.4, 0.65, d / 2 + 0.5]} color={JOBS.hedge} shade="flat" />
      </group>
    );
  }

  if (type === 2) {
    // Two-storey townhouse, ridge along the front.
    const w = 4.2;
    const d = 4.0;
    const h = 4.8;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} color={wall} />
        <Gable size={[d + 0.5, 1.8, w + 0.4]} position={[0, h, 0]} rotation={[0, Math.PI / 2, 0]} color={roof} />
        <Box size={[1.0, 2.0, 0.08]} position={[-1.0, 1.0, d / 2 + 0.02]} color={JOBS.charcoal} shade="flat" />
        <Win position={[0.9, 1.4, d / 2 + 0.03]} />
        {[-1.0, 0.9].map((x) => (
          <Win key={x} position={[x, 3.5, d / 2 + 0.03]} />
        ))}
        {[-1.0, 0.9].map((x) => (
          <Win key={x} position={[x, 3.5, -d / 2 - 0.03]} />
        ))}
        <Win position={[0, 1.4, -d / 2 - 0.03]} w={1.6} />
        <Box size={[0.08, 0.9, 0.9]} position={[w / 2 + 0.02, 3.5, 0]} color={JOBS.sky} shade="flat" />
        <Box size={[0.08, 0.9, 0.9]} position={[-w / 2 - 0.02, 3.5, 0]} color={JOBS.sky} shade="flat" />
        <Box size={[1.6, 0.12, 0.7]} position={[-1.0, 2.15, d / 2 + 0.35]} color={roof} shade="flat" />
      </group>
    );
  }

  // Cottage studio: gable end to the road, chimney, window boxes.
  const w = 4.8;
  const d = 4.4;
  const h = 3.0;
  return (
    <group>
      <Box size={[w, h, d]} position={[0, h / 2, 0]} color={wall} />
      <Gable size={[w + 0.5, 1.9, d + 0.5]} position={[0, h, 0]} color={roof} />
      <Box size={[0.5, 1.4, 0.5]} position={[1.3, h + 1.2, -0.9]} color={JOBS.platinumDark} />
      <Box size={[1.0, 2.0, 0.08]} position={[0, 1.0, d / 2 + 0.02]} color={JOBS.charcoal} shade="flat" />
      <Win position={[-1.5, 1.7, d / 2 + 0.03]} />
      <Win position={[1.5, 1.7, d / 2 + 0.03]} />
      <RoundPanel
        size={[0.8, 0.8, 0.06]}
        r={0.4}
        position={[0, h + 0.75, d / 2 + 0.03]}
        color={JOBS.sky}
        shade="flat"
      />
      {[-1.5, 1.5].map((x) => (
        <Box key={x} size={[1.0, 0.25, 0.3]} position={[x, 1.12, d / 2 + 0.16]} color={JOBS.pink} shade="flat" />
      ))}
      <Win position={[-1.2, 1.7, -d / 2 - 0.03]} />
      <Win position={[1.2, 1.7, -d / 2 - 0.03]} />
      <Box size={[0.08, 0.9, 1.1]} position={[w / 2 + 0.02, 1.7, 0]} color={JOBS.sky} shade="flat" />
      <Box size={[0.08, 0.9, 1.1]} position={[-w / 2 - 0.02, 1.7, 0]} color={JOBS.sky} shade="flat" />
    </group>
  );
}

/* ----------------------------------------------------------------- trees */

const SQUASH: Record<number, V3> = { 0: [1.1, 0.95, 1.1], 1: [0.8, 1.6, 0.8], 2: [0.85, 1.35, 0.85] };

/** Same low-poly tree as kit/Trees (trunk + icosahedron crown), but merged with the rest of the decor. */
function Tree({ item, index }: { item: ScatterItem; index: number }) {
  const s = item.scale;
  const q = SQUASH[item.variant] ?? SQUASH[0]!;
  return (
    <group position={item.position} rotation-y={item.rotationY}>
      <Cyl r={[0.18 * s, 0.26 * s]} h={1.6 * s} seg={5} position={[0, 0.8 * s, 0]} color={JOBS.trunk} />
      <Ico
        r={1.25}
        position={[0, 2.6 * s * q[1], 0]}
        scale={[s * q[0], s * q[1], s * q[2]]}
        color={pick(JOBS.treeLeaves, index + item.variant)}
      />
    </group>
  );
}

export function TreeSet({ items }: { items: ScatterItem[] }) {
  return (
    <>
      {items.map((t, i) => (
        <Tree key={`${t.position[0].toFixed(2)},${t.position[2].toFixed(2)}`} item={t} index={i} />
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- paths */

export function Paths({ paths }: { paths: PathStrip[] }) {
  return (
    <>
      {paths.map((p) => (
        <group key={`${p.x.toFixed(2)},${p.z.toFixed(2)}`}>
          <Patch size={[p.width + 0.5, p.length]} position={[p.x, 0.016, p.z]} rotY={p.rotY} color={JOBS.creamShade} />
          <Patch size={[p.width, p.length]} position={[p.x, 0.021, p.z]} rotY={p.rotY} color={JOBS.cream} />
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------ dispatcher */

/** Desk computers are enlarged to sculpture size; studio houses stay a notch smaller than content buildings. */
const DESK_SCALE = 1.2;
const HOUSE_SCALE = 0.82;

function Scaled({
  s,
  Piece,
  variant = 0,
}: {
  s: number;
  Piece: (p: { variant: number }) => ReactElement;
  variant?: number;
}) {
  return (
    <group scale={s}>
      <Piece variant={variant} />
    </group>
  );
}

const PIECES: Record<DecorKind, (p: { variant: number }) => ReactElement | null> = {
  plaza: Plaza,
  fountain: Fountain,
  desktopWall: DesktopWall,
  waveform: WaveformPlinth,
  crt: () => <Scaled s={DESK_SCALE} Piece={DeskCrt} />,
  tower: () => <Scaled s={DESK_SCALE} Piece={DeskTower} />,
  laptop: () => <Scaled s={DESK_SCALE} Piece={DeskLaptop} />,
  picnic: PicnicTable,
  bench: Bench,
  lamp: Lamp,
  house: ({ variant }) => <Scaled s={HOUSE_SCALE} Piece={House} variant={variant} />,
  phoneBox: PhoneBox,
  bikeRack: BikeRack,
  flowerBed: FlowerBed,
};

export function DecorPiece({ item }: { item: DecorItem }) {
  const Piece = PIECES[item.kind];
  return (
    <group position={[item.x, 0, item.z]} rotation-y={item.rotY}>
      <Piece variant={item.variant} />
    </group>
  );
}

/* ------------------------------------------------------------- colliders */

/** Half extents and centre height of the bump box per kind (only what the car should bump into). */
const COLLIDERS: Partial<Record<DecorKind, { half: V3; y: number; z?: number }>> = {
  plaza: { half: [1.7, 1.6, 1.7], y: 1.6 },
  fountain: { half: [2.0, 0.6, 2.0], y: 0.6 },
  desktopWall: { half: [5.3, 3.2, 0.6], y: 3.2 },
  waveform: { half: [3.6, 1.0, 0.9], y: 1.0 },
  crt: { half: [1.7, 1.45, 1.9], y: 1.45, z: -0.12 },
  tower: { half: [1.9, 1.45, 1.8], y: 1.45, z: -0.12 },
  laptop: { half: [1.8, 1.2, 1.55], y: 1.2 },
  picnic: { half: [1.2, 0.5, 1.0], y: 0.5 },
  lamp: { half: [0.15, 1.8, 0.15], y: 1.8 },
  house: { half: [2.3, 1.9, 1.9], y: 1.9 },
  phoneBox: { half: [0.65, 1.4, 0.65], y: 1.4 },
};

/** One fixed body, simple cuboids (never trimesh). Nothing on the roads: the plan keeps every piece off them. */
export function DecorColliders({ items }: { items: DecorItem[] }) {
  return (
    <RigidBody type="fixed" colliders={false}>
      {items.map((it, i) => {
        const c = COLLIDERS[it.kind];
        if (!c) return null;
        const dz = c.z ?? 0;
        return (
          <CuboidCollider
            key={i}
            args={c.half}
            position={[it.x + Math.sin(it.rotY) * dz, c.y, it.z + Math.cos(it.rotY) * dz]}
            rotation={[0, it.rotY, 0]}
          />
        );
      })}
    </RigidBody>
  );
}

/* ------------------------------------------------------- waveform bars */

/** Rest heights of the 2011 voice-waveform bars (a symmetrical speech envelope). */
const BAR_COUNT = 15;
const BAR_GAP = 0.44;
const REST = Array.from({ length: BAR_COUNT }, (_, i) => {
  const t = i / (BAR_COUNT - 1);
  const envelope = Math.sin(Math.PI * t);
  const ripple = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.9 + 0.4));
  return 0.5 + 3.4 * envelope * ripple;
});
const BAR_BASE = 0.62;
const BAR_UNIT = 1.36; // capsule height at scale 1 (length 1 + 2 * radius 0.18)
const scratch = new THREE.Object3D();
const barColour = new THREE.Color();

/** Writes the bar matrices: rest pose when `time` is null, gently breathing otherwise. No allocations. */
function placeBars(mesh: THREE.InstancedMesh, time: number | null) {
  for (let i = 0; i < BAR_COUNT; i++) {
    const wobble = time === null ? 1 : 0.72 + 0.28 * Math.sin(time * 2.6 + i * 0.75) * Math.sin(time * 1.3 + i * 0.31);
    scratch.position.set((i - (BAR_COUNT - 1) / 2) * BAR_GAP, BAR_BASE, 0);
    scratch.scale.set(1, (REST[i]! * wobble) / BAR_UNIT, 1);
    scratch.updateMatrix();
    mesh.setMatrixAt(i, scratch.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * The voice-waveform sculpture's bars: one instanced mesh (1 draw call; no shadow, so no extra shadow pass).
 * They breathe gently like a voice level meter; with reduced motion they hold their rest heights.
 */
export function WaveformBars({ item }: { item: DecorItem }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.CapsuleGeometry(0.18, 1, 3, 8).translate(0, BAR_UNIT / 2, 0), []);
  const material = useMemo(() => new THREE.MeshLambertMaterial(), []);
  const atRest = useRef(false);
  const drawn = useRef(true);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    placeBars(mesh, null);
    for (let i = 0; i < BAR_COUNT; i++) {
      mesh.setColorAt(i, barColour.set(i % 2 ? JOBS.white : JOBS.pink));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // The rest pose is the tallest the bars get (wobble <= 1), so this sphere holds every animated frame and the
    // sculpture is frustum-culled normally (not drawn from the other islands).
    mesh.computeBoundingSphere();
    atRest.current = true;
    // Set while three draws it: the bars only animate while the sculpture was on screen last frame.
    mesh.onBeforeRender = () => {
      drawn.current = true;
    };
  }, []);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    if (motion.reduced) {
      if (!atRest.current) {
        placeBars(mesh, null);
        atRest.current = true;
      }
      return;
    }
    if (!drawn.current) return;
    drawn.current = false;
    atRest.current = false;
    placeBars(mesh, state.clock.elapsedTime);
  });

  return (
    <group position={[item.x, 0, item.z]} rotation-y={item.rotY}>
      <instancedMesh ref={ref} args={[geometry, material, BAR_COUNT]} receiveShadow />
    </group>
  );
}
