"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import type { RunwayGeometry } from "@/lib/three/layout";
import { SHARED } from "@/lib/three/palette";
import { StaticMerge } from "./kit/StaticMerge";

/**
 * A short runway jutting off the island edge (docs/VISION.md, 21 Nov 2026). Low rails on both sides, open at the
 * far end: drive off the end and the car takes off as the era's plane (Vehicle). Dark asphalt, white centre
 * dashes and threshold stripes, cream edge lines, so it reads as a runway from the isometric camera.
 */
export function Runway({ runway }: { runway: RunwayGeometry }) {
  const { center, length, width, rotationY } = runway;
  const dashes = Math.floor((length - 10) / 6);
  return (
    <group position={[center[0], 0, center[1]]} rotation-y={rotationY}>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[width / 2, 0.5, length / 2]} position={[0, -0.5, 0]} />
        <CuboidCollider args={[0.25, 0.9, length / 2 - 4]} position={[-width / 2 - 0.25, 0.6, -4]} />
        <CuboidCollider args={[0.25, 0.9, length / 2 - 4]} position={[width / 2 + 0.25, 0.6, -4]} />
      </RigidBody>
      <StaticMerge>
        <mesh position={[0, -0.59, 0]} receiveShadow castShadow>
          <boxGeometry args={[width, 1.2, length]} />
          <meshLambertMaterial color={SHARED.runway} />
        </mesh>
        {/* Centre-line dashes */}
        {Array.from({ length: dashes }, (_, i) => (
          <mesh key={i} position={[0, 0.02, -length / 2 + 8 + i * 6]}>
            <boxGeometry args={[0.35, 0.02, 3]} />
            <meshLambertMaterial color={SHARED.snow} />
          </mesh>
        ))}
        {/* Threshold stripes at the far (take-off) end */}
        {[-3.6, -2.4, -1.2, 1.2, 2.4, 3.6].map((x) => (
          <mesh key={x} position={[x, 0.02, length / 2 - 3]}>
            <boxGeometry args={[0.6, 0.02, 4]} />
            <meshLambertMaterial color={SHARED.snow} />
          </mesh>
        ))}
        {/* Edge lines and low rails (open at the far end) */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * (width / 2 - 0.5), 0.02, 0]}>
              <boxGeometry args={[0.25, 0.02, length]} />
              <meshLambertMaterial color={SHARED.cream} />
            </mesh>
            <mesh position={[s * (width / 2 + 0.2), 0.45, -4]} castShadow>
              <boxGeometry args={[0.4, 0.9, length - 8]} />
              <meshLambertMaterial color={SHARED.bridgeRail} />
            </mesh>
          </group>
        ))}
      </StaticMerge>
    </group>
  );
}
