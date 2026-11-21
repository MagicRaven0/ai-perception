"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { IslandGeometry } from "@/lib/three/layout";
import type { EraPalette } from "@/lib/three/palette";
import { StaticMerge } from "./StaticMerge";

/**
 * SHARED KIT (read-only for island agents: copy it into your island folder if you need changes).
 *
 * Visual island ground in the Late Checkout style: a round lawn on a floating slab (grass lip, soft cliff,
 * tapered rock underside), a cream ring road with soft curbs, and straight connector roads out to the bridges,
 * curbed on both sides. Visual only: the physics ground, edge walls and bridges live in World.tsx, so
 * redesigning the visuals can never break driving. Keep visuals inside geometry.radius so the minimap stays
 * correct. Everything is static, receives shadows and is merged: one draw call on every tier (about 2k triangles).
 *
 * The curbs are flat bands with a thin darker line on the grass side: the "raised" soft edge is painted,
 * so the car never looks as if it sinks into them. The outer curb opens where a connector road leaves.
 */

const CURB_W = 0.5;
/** Painted contact line on the grass side of each curb. */
const LIP_W = 0.28;
const ARC_SEGMENTS = 96;

/** Darker shade of a palette colour (derived, so every colour still comes from the palette). */
function shade(hex: string, f: number): string {
  return `#${new THREE.Color(hex).multiplyScalar(f).getHexString()}`;
}

/** Arcs [from, to] (world angles, radians) round a full circle, leaving gaps of `half` either side of each gap angle. */
function arcsAround(gaps: number[], half: number): [number, number][] {
  if (gaps.length === 0) return [[0, Math.PI * 2]];
  const sorted = gaps.map((g) => ((g % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
  const arcs: [number, number][] = [];
  for (let i = 0; i < sorted.length; i++) {
    const from = sorted[i]! + half;
    const next = i + 1 < sorted.length ? sorted[i + 1]! : sorted[0]! + Math.PI * 2;
    const to = next - half;
    if (to > from) arcs.push([from, to]);
  }
  return arcs;
}

/**
 * A flat ring arc lying on the ground. ringGeometry is drawn in XY and laid flat with rotation-x = -PI/2, which
 * maps local angle t to world angle -t (world angle a: x = cos a, z = sin a).
 */
function GroundArc({
  inner,
  outer,
  from,
  to,
  y,
  color,
  receiveShadow = true,
}: {
  inner: number;
  outer: number;
  from: number;
  to: number;
  y: number;
  color: string;
  receiveShadow?: boolean;
}) {
  const segs = Math.max(4, Math.round((ARC_SEGMENTS * (to - from)) / (Math.PI * 2)));
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} receiveShadow={receiveShadow}>
      <ringGeometry args={[inner, outer, segs, 1, -to, to - from]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

export function IslandGround({
  geometry,
  palette,
  ground,
  road,
  curb,
  cliff,
}: {
  geometry: IslandGeometry;
  palette: EraPalette;
  /** Override colours (defaults come from the era palette). */
  ground?: string;
  road?: string;
  curb?: string;
  cliff?: string;
}) {
  const { center, radius, roadRadius, roadWidth, slabDepth, bridgeAngles } = geometry;
  const [cx, cz] = center;
  const inner = roadRadius - roadWidth / 2;
  const outer = roadRadius + roadWidth / 2;

  const colours = useMemo(() => {
    const g = ground ?? palette.ground;
    const c = cliff ?? palette.cliff;
    return {
      ground: g,
      road: road ?? palette.road,
      curb: curb ?? palette.curb,
      cliff: c,
      lip: shade(g, 0.8),
      soil: shade(g, 0.62),
      rock: shade(c, 0.78),
    };
  }, [ground, road, curb, cliff, palette]);

  const connectors = useMemo(
    () =>
      bridgeAngles.map((angle) => {
        const from = roadRadius;
        const to = radius + 0.2;
        const mid = (from + to) / 2;
        // Curbs run from the outer edge of the ring road out to the island edge.
        const curbFrom = outer;
        const curbTo = radius - 0.05;
        const curbMid = (curbFrom + curbTo) / 2;
        const dir = [Math.cos(angle), Math.sin(angle)] as const;
        // Sideways (perpendicular to the connector) in world XZ.
        const side = [-Math.sin(angle), Math.cos(angle)] as const;
        const at = (along: number, across: number, y: number) =>
          [dir[0] * along + side[0] * across, y, dir[1] * along + side[1] * across] as [number, number, number];
        return {
          angle,
          length: to - from,
          position: [dir[0] * mid, 0.021, dir[1] * mid] as [number, number, number],
          curbLength: curbTo - curbFrom,
          curbs: [-1, 1].map((s) => ({
            curb: at(curbMid, s * (roadWidth / 2 + CURB_W / 2), 0.031),
            lip: at(curbMid, s * (roadWidth / 2 + CURB_W + LIP_W / 2), 0.012),
          })),
        };
      }),
    [bridgeAngles, radius, roadRadius, roadWidth, outer],
  );

  // The outer curb (and its lip) leaves a gap where each connector road crosses it.
  const outerArcs = useMemo(
    () => arcsAround(bridgeAngles, (roadWidth / 2 + CURB_W + LIP_W) / (outer + CURB_W)),
    [bridgeAngles, roadWidth, outer],
  );

  return (
    <group position={[cx, 0, cz]}>
      <StaticMerge>
        {/* Floating slab: grass lip, cliff, then a tapered rock underside */}
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <cylinderGeometry args={[radius, radius * 0.985, 1, 48, 1, true]} />
          <meshLambertMaterial color={colours.soil} />
        </mesh>
        <mesh position={[0, -1 - (slabDepth - 1) / 2, 0]} receiveShadow>
          <cylinderGeometry args={[radius * 0.985, radius * 0.9, slabDepth - 1, 48, 1, true]} />
          <meshLambertMaterial color={colours.cliff} />
        </mesh>
        {/* receiveShadow on every part keeps the whole ground in ONE merge group (one draw call on every tier) */}
        <mesh position={[0, -slabDepth - 2.5, 0]} receiveShadow>
          <cylinderGeometry args={[radius * 0.9, radius * 0.5, 5, 48, 1, true]} />
          <meshLambertMaterial color={colours.rock} />
        </mesh>
        <mesh position={[0, -slabDepth - 5, 0]} rotation-x={Math.PI / 2} receiveShadow>
          <circleGeometry args={[radius * 0.5, 32]} />
          <meshLambertMaterial color={colours.rock} />
        </mesh>
        {/* Lawn */}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[radius, 64]} />
          <meshLambertMaterial color={colours.ground} />
        </mesh>
        {/* Ring road */}
        <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
          <ringGeometry args={[inner, outer, ARC_SEGMENTS]} />
          <meshLambertMaterial color={colours.road} />
        </mesh>
        {/* Inner curb + its painted contact line on the grass */}
        <GroundArc inner={inner - CURB_W} outer={inner} from={0} to={Math.PI * 2} y={0.03} color={colours.curb} />
        <GroundArc
          inner={inner - CURB_W - LIP_W}
          outer={inner - CURB_W}
          from={0}
          to={Math.PI * 2}
          y={0.012}
          color={colours.lip}
        />
        {/* Outer curb, open at the connector roads */}
        {outerArcs.map(([from, to]) => (
          <group key={from}>
            <GroundArc inner={outer} outer={outer + CURB_W} from={from} to={to} y={0.03} color={colours.curb} />
            <GroundArc
              inner={outer + CURB_W}
              outer={outer + CURB_W + LIP_W}
              from={from}
              to={to}
              y={0.012}
              color={colours.lip}
            />
          </group>
        ))}
        {/* Connector roads to the bridges, curbed on both sides */}
        {connectors.map((c) => (
          <group key={c.angle}>
            <mesh position={c.position} rotation={[-Math.PI / 2, 0, -c.angle + Math.PI / 2]} receiveShadow>
              <planeGeometry args={[roadWidth, c.length]} />
              <meshLambertMaterial color={colours.road} />
            </mesh>
            {c.curbs.map((k, i) => (
              <group key={i}>
                <mesh position={k.curb} rotation={[-Math.PI / 2, 0, -c.angle + Math.PI / 2]} receiveShadow>
                  <planeGeometry args={[CURB_W, c.curbLength]} />
                  <meshLambertMaterial color={colours.curb} />
                </mesh>
                <mesh position={k.lip} rotation={[-Math.PI / 2, 0, -c.angle + Math.PI / 2]} receiveShadow>
                  <planeGeometry args={[LIP_W, c.curbLength]} />
                  <meshLambertMaterial color={colours.lip} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </StaticMerge>
    </group>
  );
}
