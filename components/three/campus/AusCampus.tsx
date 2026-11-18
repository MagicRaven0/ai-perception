"use client";

/**
 * AUS MINI CAMPUS (The Future, centre plot). Placeholder by the foundation build.
 *
 * Owner: the Future island agent (or a dedicated campus agent). May freely change this file and add files
 * under components/three/campus/. Keep the named export `AusCampus` and its props.
 *
 * Input: position (centre of the plot, y = 0), radius (keep everything inside it: the ring road starts
 * about 6 m outside), palette (era-3 palette).
 *
 * Vision (docs/VISION.md): the full campus, simplified, with the AUS name and logo. Online photos are
 * modelling reference only. The logo needs permission and a credit in content/credits.ts before it ships;
 * until then the sign below is a blank plate. Decor colliders: fixed <RigidBody> + cuboids only, and the
 * inner lawn is open, so every solid building needs a simple collider like the ones below.
 * Budget: this is a SHARE of The Future island's budget (IslandFuture.tsx), not extra: <= 20k triangles and
 * <= 14 draw calls on High (shadow pass included), <= 8k triangles and <= 6 draw calls on Low. Read the tier
 * with useStore(selectTier) to drop detail on Low; wrap static parts in <StaticMerge>.
 */

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import type { Vec3 } from "@/lib/three/layout";
import { SHARED, type EraPalette } from "@/lib/three/palette";
import { Block } from "../buildings/registry";
import { StaticMerge } from "../kit/StaticMerge";

export function AusCampus({ position, radius, palette }: { position: Vec3; radius: number; palette: EraPalette }) {
  const r = radius;
  return (
    <group position={position}>
      {/* Plaza */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.025} receiveShadow>
        <circleGeometry args={[r, 48]} />
        <meshLambertMaterial color={palette.road} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.035}>
        <ringGeometry args={[r - 0.6, r, 64]} />
        <meshBasicMaterial color={palette.accent} />
      </mesh>

      {/* Simple box colliders so the car bumps into the buildings instead of driving through */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[r * 0.55, 2.5, r * 0.2]} position={[0, 2.5, -r * 0.25]} />
        <CuboidCollider args={[r * 0.16, 2, r * 0.35]} position={[-r * 0.62, 2, r * 0.2]} />
        <CuboidCollider args={[r * 0.16, 2, r * 0.35]} position={[r * 0.62, 2, r * 0.2]} />
      </RigidBody>

      <StaticMerge>
        {/* Main building: long block with a central dome and arches (simplified placeholder) */}
        <Block size={[r * 1.1, 5, r * 0.4]} position={[0, 2.5, -r * 0.25]} color={SHARED.cream} />
        <mesh position={[0, 5, -r * 0.25]} castShadow>
          <sphereGeometry args={[r * 0.17, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshLambertMaterial color={SHARED.cream} />
        </mesh>
        <mesh position={[0, 5 + r * 0.17, -r * 0.25]}>
          <sphereGeometry args={[0.4, 8, 6]} />
          <meshLambertMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.8} />
        </mesh>
        {[-0.4, -0.2, 0, 0.2, 0.4].map((f) => (
          <Block
            key={f}
            size={[1.6, 2.8, 0.15]}
            position={[r * f, 1.4, -r * 0.05 + 0.08]}
            color={SHARED.ink}
            shadow={false}
          />
        ))}

        {/* Two wings */}
        {[-1, 1].map((s) => (
          <Block
            key={s}
            size={[r * 0.32, 4, r * 0.7]}
            position={[s * r * 0.62, 2, r * 0.2]}
            color={SHARED.creamShade}
          />
        ))}

        {/* Name sign: blank plate until the AUS name/logo artwork is approved and credited */}
        <Block size={[6, 1.4, 0.3]} position={[0, 0.9, r * 0.55]} color={SHARED.snow} />
        <Block size={[6.4, 0.2, 0.4]} position={[0, 0.1, r * 0.55]} color={palette.accent} emissive />
      </StaticMerge>
    </group>
  );
}
