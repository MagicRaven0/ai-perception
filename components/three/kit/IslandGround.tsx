"use client";

import { useMemo } from "react";
import type { IslandGeometry } from "@/lib/three/layout";
import type { EraPalette } from "@/lib/three/palette";
import { StaticMerge } from "./StaticMerge";

/**
 * SHARED KIT (read-only for island agents: copy it into your island folder if you need changes).
 *
 * Visual island ground in the Late Checkout style: a round lawn on a slab with soft cliffs, a cream ring
 * road with soft curbs, and straight connector roads out to the bridges. Visual only: the physics ground,
 * edge walls and bridges live in World.tsx, so redesigning the visuals can never break driving.
 * Keep visuals inside geometry.radius so the minimap stays correct.
 */
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
  const curbW = 0.45;

  const connectors = useMemo(
    () =>
      bridgeAngles.map((angle) => {
        const from = roadRadius;
        const to = radius + 0.2;
        const mid = (from + to) / 2;
        return {
          angle,
          length: to - from,
          position: [Math.cos(angle) * mid, 0.021, Math.sin(angle) * mid] as [number, number, number],
        };
      }),
    [bridgeAngles, radius, roadRadius],
  );

  return (
    <group position={[cx, 0, cz]}>
      <StaticMerge>
        {/* Cliff: slightly tapered so the slab reads as a floating island */}
        <mesh position={[0, -slabDepth / 2, 0]} receiveShadow>
          <cylinderGeometry args={[radius, radius * 0.9, slabDepth, 48, 1, true]} />
          <meshLambertMaterial color={cliff ?? palette.cliff} />
        </mesh>
        <mesh position={[0, -slabDepth, 0]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[radius * 0.9, 48]} />
          <meshLambertMaterial color={cliff ?? palette.cliff} />
        </mesh>
        {/* Lawn */}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[radius, 64]} />
          <meshLambertMaterial color={ground ?? palette.ground} />
        </mesh>
        {/* Ring road + soft curbs */}
        <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
          <ringGeometry args={[inner, outer, 96]} />
          <meshLambertMaterial color={road ?? palette.road} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
          <ringGeometry args={[inner - curbW, inner, 96]} />
          <meshLambertMaterial color={curb ?? palette.curb} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
          <ringGeometry args={[outer, outer + curbW, 96]} />
          <meshLambertMaterial color={curb ?? palette.curb} />
        </mesh>
        {/* Connector roads to the bridges */}
        {connectors.map((c) => (
          <mesh key={c.angle} position={c.position} rotation={[-Math.PI / 2, 0, -c.angle + Math.PI / 2]} receiveShadow>
            <planeGeometry args={[roadWidth, c.length]} />
            <meshLambertMaterial color={road ?? palette.road} />
          </mesh>
        ))}
      </StaticMerge>
    </group>
  );
}
