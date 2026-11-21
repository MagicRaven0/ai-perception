"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * Campus building blocks. Every part is a plain Lambert mesh, so <StaticMerge> bakes the whole campus into a
 * handful of draw calls. The merge groups meshes by (emissive colour, castShadow, receiveShadow), so every
 * part here picks one of exactly three "shades" and nothing else:
 *
 * - "solid": casts and receives shadows (buildings, palms, the sign). 2 calls on High (colour + shadow pass).
 * - "flat":  receives only (ground overlays, arch recesses, small props). 1 call.
 * - "glow":  era accent glow, no shadows. 1 call. Always the same colour and intensity (one bucket).
 *
 * On Low (no shadows) "solid" and "flat" share one call.
 */

export type V3 = [number, number, number];
export type Shade = "solid" | "flat" | "glow";

/** One glow intensity for every glowing part, so they all land in one merge bucket. */
export const GLOW_INTENSITY = 0.85;

function shadowFlags(shade: Shade) {
  return { castShadow: shade === "solid", receiveShadow: shade !== "glow" };
}

function Material({ color, shade }: { color: string; shade: Shade }) {
  return shade === "glow" ? (
    <meshLambertMaterial color={color} emissive={color} emissiveIntensity={GLOW_INTENSITY} />
  ) : (
    <meshLambertMaterial color={color} />
  );
}

export function Box({
  size,
  position,
  rotation,
  color,
  shade = "solid",
}: {
  size: V3;
  position: V3;
  rotation?: V3;
  color: string;
  shade?: Shade;
}) {
  return (
    <mesh position={position} rotation={rotation} {...shadowFlags(shade)}>
      <boxGeometry args={size} />
      <Material color={color} shade={shade} />
    </mesh>
  );
}

export function Cyl({
  r,
  h,
  position,
  color,
  segments = 8,
  open = false,
  rotation,
  shade = "solid",
}: {
  r: number | [number, number];
  h: number;
  position: V3;
  color: string;
  segments?: number;
  /** No caps (saves triangles when the ends are hidden). */
  open?: boolean;
  rotation?: V3;
  shade?: Shade;
}) {
  const [top, bottom] = Array.isArray(r) ? r : [r, r];
  return (
    <mesh position={position} rotation={rotation} {...shadowFlags(shade)}>
      <cylinderGeometry args={[top, bottom, h, segments, 1, open]} />
      <Material color={color} shade={shade} />
    </mesh>
  );
}

/** Half sphere sitting on `position` (its base), raised by `rise` (1 = round, > 1 = slightly pointed). */
export function Dome({
  r,
  position,
  color,
  segments = 12,
  rings = 5,
  rise = 1.15,
  shade = "solid",
}: {
  r: number;
  position: V3;
  color: string;
  segments?: number;
  rings?: number;
  rise?: number;
  shade?: Shade;
}) {
  return (
    <mesh position={position} scale={[1, rise, 1]} {...shadowFlags(shade)}>
      <sphereGeometry args={[r, segments, rings, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Material color={color} shade={shade} />
    </mesh>
  );
}

/**
 * Flat pointed-arch outline (the deep shade of an arch opening), base centre at the origin, facing +Z.
 * Few curve segments on purpose: about 8 triangles per arch.
 */
function archGeometry(width: number, spring: number, rise: number) {
  const w = width / 2;
  const s = new THREE.Shape();
  s.moveTo(-w, 0);
  s.lineTo(w, 0);
  s.lineTo(w, spring);
  s.quadraticCurveTo(w, spring + rise * 0.78, 0, spring + rise);
  s.quadraticCurveTo(-w, spring + rise * 0.78, -w, spring);
  s.closePath();
  return new THREE.ShapeGeometry(s, 3);
}

/**
 * A row of arch openings centred on `position` (base line), facing +Z (rotate the parent to face elsewhere).
 * Arch recesses never cast shadows ("flat"), so they share the ground's merge bucket.
 */
export function ArchRow({
  count,
  width,
  spring,
  spacing,
  position,
  rotation,
  color,
  rise = width * 0.62,
}: {
  count: number;
  width: number;
  /** Height of the straight sides. */
  spring: number;
  /** Centre-to-centre distance. */
  spacing: number;
  position: V3;
  rotation?: V3;
  color: string;
  rise?: number;
}) {
  const geometry = useMemo(() => archGeometry(width, spring, rise), [width, spring, rise]);
  // Shared by every arch in the row (dispose={null} below), so it is freed here, once.
  useEffect(() => () => geometry.dispose(), [geometry]);
  const start = -((count - 1) * spacing) / 2;
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} geometry={geometry} position-x={start + i * spacing} receiveShadow dispose={null}>
          <meshLambertMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}
