"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { JOBS } from "@/lib/three/palettes/jobs-era";

/**
 * Jobs Era primitives. Everything on this island is built from these, so the island stays inside its draw-call
 * budget once kit/StaticMerge bakes it (one draw call per emissive-colour x shadow-flag group):
 * - shade "cast" (default): casts and receives shadows. Structures and anything taller than a person.
 * - shade "flat": receives only. Ground, paths and tiny props (no shadows from tiny props).
 * - glow: the island's single glow colour (JOBS.glow), no shadow flags. On Low it renders as plain colour, so
 *   the glow bucket (one extra call per merge root) disappears there.
 * Only these three combinations exist, so a merge root never has more than three buckets.
 */

export type V3 = [number, number, number];
export type Shade = "cast" | "flat";

const GLOW_INTENSITY = 0.75;

/** True when glow is drawn (High). The island provides it from the quality tier. */
const GlowContext = createContext(true);

export function GlowProvider({ on, children }: { on: boolean; children: ReactNode }) {
  return <GlowContext.Provider value={on}>{children}</GlowContext.Provider>;
}

type Common = {
  position?: V3;
  rotation?: V3;
  scale?: V3;
  color?: string;
  shade?: Shade;
  /** Uses the island glow colour (ignores `color`). */
  glow?: boolean;
};

function Mat({ color, glow }: { color?: string; glow?: boolean }) {
  const glowOn = useContext(GlowContext);
  if (glow) {
    return glowOn ? (
      <meshLambertMaterial color={JOBS.glow} emissive={JOBS.glow} emissiveIntensity={GLOW_INTENSITY} />
    ) : (
      <meshLambertMaterial color={JOBS.glow} />
    );
  }
  return <meshLambertMaterial color={color ?? JOBS.white} />;
}

function flags(shade: Shade = "cast", glow?: boolean) {
  if (glow) return { castShadow: false, receiveShadow: false };
  return { castShadow: shade === "cast", receiveShadow: true };
}

export function Box({ size, position, rotation, scale, color, shade, glow }: Common & { size: V3 }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} {...flags(shade, glow)}>
      <boxGeometry args={size} />
      <Mat color={color} glow={glow} />
    </mesh>
  );
}

export function Cyl({
  r,
  h,
  seg = 10,
  position,
  rotation,
  scale,
  color,
  shade,
  glow,
}: Common & { r: number | [number, number]; h: number; seg?: number }) {
  const [top, bottom] = Array.isArray(r) ? r : [r, r];
  return (
    <mesh position={position} rotation={rotation} scale={scale} {...flags(shade, glow)}>
      <cylinderGeometry args={[top, bottom, h, seg]} />
      <Mat color={color} glow={glow} />
    </mesh>
  );
}

export function Sphere({
  r,
  w = 10,
  h = 6,
  half,
  position,
  rotation,
  scale,
  color,
  shade,
  glow,
}: Common & { r: number; w?: number; h?: number; half?: boolean }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} {...flags(shade, glow)}>
      <sphereGeometry args={half ? [r, w, h, 0, Math.PI * 2, 0, Math.PI / 2] : [r, w, h]} />
      <Mat color={color} glow={glow} />
    </mesh>
  );
}

export function Ico({ r, position, rotation, scale, color, shade, glow }: Common & { r: number }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} {...flags(shade, glow)}>
      <icosahedronGeometry args={[r, 0]} />
      <Mat color={color} glow={glow} />
    </mesh>
  );
}

/** Flat disc lying on the ground (receives only). */
export function Disc({
  r,
  seg = 24,
  y = 0.015,
  position = [0, 0, 0],
  color,
}: {
  r: number;
  seg?: number;
  y?: number;
  position?: V3;
  color: string;
}) {
  return (
    <mesh position={[position[0], y, position[2]]} rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[r, seg]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

/** Flat ring lying on the ground (receives only). */
export function Ring({
  inner,
  outer,
  seg = 32,
  y = 0.02,
  position = [0, 0, 0],
  color,
}: {
  inner: number;
  outer: number;
  seg?: number;
  y?: number;
  position?: V3;
  color: string;
}) {
  return (
    <mesh position={[position[0], y, position[2]]} rotation-x={-Math.PI / 2} receiveShadow>
      <ringGeometry args={[inner, outer, seg]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

/** Flat rectangle lying on the ground (paths, parking lines). `rotY` turns it about Y. */
export function Patch({
  size,
  position,
  rotY = 0,
  color,
}: {
  size: [number, number];
  position: V3;
  rotY?: number;
  color: string;
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotY]} receiveShadow>
      <planeGeometry args={size} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

/* ------------------------------------------------------------ extrusions */

/** Geometry built once per `key` (its shape parameters) and disposed when it changes or on unmount. */
function useDisposable<T extends THREE.BufferGeometry>(make: () => T, key: string): T {
  // `make` is a fresh closure every render; `key` carries everything it depends on.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(() => make(), [key]);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

function roundedRect(w: number, d: number, r: number): THREE.Shape {
  const x = -w / 2;
  const y = -d / 2;
  const rr = Math.min(r, w / 2 - 0.01, d / 2 - 0.01);
  const s = new THREE.Shape();
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rr);
  s.lineTo(x + w, y + d - rr);
  s.quadraticCurveTo(x + w, y + d, x + w - rr, y + d);
  s.lineTo(x + rr, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - rr);
  s.lineTo(x, y + rr);
  s.quadraticCurveTo(x, y, x + rr, y);
  return s;
}

/**
 * Rounded-rectangle block, the island's signature "friendly interface" shape. Footprint w x d (rounded corners
 * of radius r), height h, centred on `position` like Box.
 */
export function RoundBox({ size, r = 0.6, position, rotation, color, shade, glow }: Common & { size: V3; r?: number }) {
  const [w, h, d] = size;
  const geo = useDisposable(
    () =>
      new THREE.ExtrudeGeometry(roundedRect(w, d, r), { depth: h, bevelEnabled: false, curveSegments: 3 })
        .rotateX(-Math.PI / 2)
        .translate(0, -h / 2, 0),
    `${w},${h},${d},${r}`,
  );
  return (
    <mesh geometry={geo} position={position} rotation={rotation} {...flags(shade, glow)}>
      <Mat color={color} glow={glow} />
    </mesh>
  );
}

/**
 * Upright rounded panel (a window, a screen, a sign): w wide, h tall, t thick along local Z, centred.
 */
export function RoundPanel({
  size,
  r = 0.3,
  position,
  rotation,
  color,
  shade,
  glow,
}: Common & { size: V3; r?: number }) {
  const [w, h, t] = size;
  const geo = useDisposable(
    () =>
      new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth: t, bevelEnabled: false, curveSegments: 3 }).translate(
        0,
        0,
        -t / 2,
      ),
    `${w},${h},${t},${r}`,
  );
  return (
    <mesh geometry={geo} position={position} rotation={rotation} {...flags(shade, glow)}>
      <Mat color={color} glow={glow} />
    </mesh>
  );
}

/** Any flat outline (XY points, counter-clockwise) extruded `depth` along local Z, centred on Z. */
export function Extruded({
  points,
  depth,
  position,
  rotation,
  scale,
  color,
  shade,
  glow,
}: Common & { points: readonly (readonly [number, number])[]; depth: number }) {
  const key = points.map((p) => p.join(",")).join(";");
  const geo = useDisposable(() => {
    const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }).translate(0, 0, -depth / 2);
  }, `${key}|${depth}`);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} scale={scale} {...flags(shade, glow)}>
      <Mat color={color} glow={glow} />
    </mesh>
  );
}

/** Gable roof: a triangular prism w wide (along X), d deep, rising h, sitting on y = 0 of its position. */
export function Gable({ size, position, rotation, color, shade }: Common & { size: V3 }) {
  const [w, h, d] = size;
  return (
    <Extruded
      points={[
        [-w / 2, 0],
        [w / 2, 0],
        [0, h],
      ]}
      depth={d}
      position={position}
      rotation={rotation}
      color={color}
      shade={shade}
    />
  );
}
