"use client";

import { SOURCES_PAD, type PlacedBuilding } from "@/lib/three/layout";
import { SHARED } from "@/lib/three/palette";
import { StaticMerge } from "./kit/StaticMerge";

/**
 * SHARED. Where an island's sources are (its generated References building): a flat round marker in the centre area,
 * no boards. Stand on it and press E (or tap Open) to read the full APA entries and links in the drawer. Nothing to
 * crash into: the car drives straight onto it.
 */
export function SourcesSpot({ placed, accent }: { placed: PlacedBuilding; accent: string }) {
  const r = SOURCES_PAD.radius;
  return (
    <group position={placed.position}>
      <StaticMerge>
        <mesh position={[0, 0.07, 0]} receiveShadow>
          <cylinderGeometry args={[r, r + 0.1, 0.14, 24]} />
          <meshLambertMaterial color={SHARED.creamShade} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[r * 0.62, r * 0.82, 24]} />
          <meshLambertMaterial color={accent} />
        </mesh>
      </StaticMerge>
    </group>
  );
}
