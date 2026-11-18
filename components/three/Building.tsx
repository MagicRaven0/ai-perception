"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import type { PlacedBuilding } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { ERA_PALETTE, SHARED, type EraPalette } from "@/lib/three/palette";
import { BUILDING_MODELS, MODEL_HEIGHT, type BuildingModel } from "./buildings/registry";
import { BuildingSensor } from "./BuildingSensor";
import { StaticMerge } from "./kit/StaticMerge";

/**
 * SHARED. One building from content/buildings.ts, already positioned by lib/three/layout.ts.
 * Renders: box collider (so any model drives the same), the model for its kind (registry, or the `Model`
 * override an island passes), a floating beacon (brightens when the car is close, turns into a tick once
 * opened) and the proximity sensor. Opening is always the visitor's choice (E / tap), never automatic.
 */
export function Building({
  placed,
  Model,
  palette,
  height,
  merge = true,
}: {
  placed: PlacedBuilding;
  /** Island-owned model for this building (defaults to the registry model for its kind). */
  Model?: BuildingModel;
  /** Palette override (defaults to the era palette). */
  palette?: EraPalette;
  /** Beacon height override when a custom model is taller or shorter. */
  height?: number;
  /** Merge the model's static meshes into a few draw calls (default). Pass false for animated models. */
  merge?: boolean;
}) {
  const M = Model ?? BUILDING_MODELS[placed.kind];
  const pal = palette ?? ERA_PALETTE[placed.eraId];
  const { plot } = placed;
  const top = height ?? MODEL_HEIGHT[placed.kind];

  return (
    <>
      <group position={placed.position} rotation-y={placed.rotationY}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[plot.width * 0.38, 3, plot.depth * 0.34]} position={[0, 3, 0]} />
        </RigidBody>
        {/* Static model -> one or two draw calls (see kit/StaticMerge) */}
        <StaticMerge enabled={merge}>
          <M
            kind={placed.kind}
            eraId={placed.eraId}
            palette={pal}
            plot={plot}
            colourIndex={placed.colourIndex}
            comingSoon={placed.comingSoon}
          />
        </StaticMerge>
        <Beacon id={placed.id} y={top + 2.2} accent={pal.accent} />
      </group>
      <BuildingSensor id={placed.id} position={placed.sensor.position} radius={placed.sensor.radius} />
    </>
  );
}

const scaleTarget = new THREE.Vector3();

/** Floating diamond above the roof. Selects two booleans; animates in its own frame loop. */
function Beacon({ id, y, accent }: { id: string; y: number; accent: string }) {
  const nearby = useStore((s) => s.nearbyBuildingId === id);
  const visited = useStore((s) => s.visitedBuildingIds.includes(id));
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const m = ref.current;
    if (!m) return;
    const scale = nearby ? 1.35 : 1;
    if (motion.reduced) {
      // Reduced motion: no spin or bob; "nearby" still shows as the bigger, brighter beacon.
      m.position.y = y;
      m.scale.setScalar(scale);
      return;
    }
    m.rotation.y += dt * (nearby ? 2.2 : 0.8);
    m.position.y = y + Math.sin(state.clock.elapsedTime * 1.6 + y) * 0.25;
    m.scale.lerp(scaleTarget.setScalar(scale), 1 - Math.exp(-dt * 6));
  });

  return (
    <mesh ref={ref} position-y={y}>
      <octahedronGeometry args={[0.7, 0]} />
      <meshLambertMaterial
        color={visited ? SHARED.snow : accent}
        emissive={visited ? SHARED.snow : accent}
        emissiveIntensity={nearby ? 0.9 : 0.35}
        flatShading
      />
    </mesh>
  );
}
