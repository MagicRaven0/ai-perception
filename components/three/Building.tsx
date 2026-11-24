"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { SOURCE_BOARD, type FigureLookInput, type PlacedBuilding } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { ERA_PALETTE, SHARED, type EraPalette } from "@/lib/three/palette";
import { BUILDING_MODELS, MODEL_HEIGHT, type BuildingModel } from "./buildings/registry";
import { BuildingSensor } from "./BuildingSensor";
import { StaticMerge } from "./kit/StaticMerge";
import { FacelessFigure } from "./Figure";
import { SourcesBoards } from "./SourcesBoards";
import { VideoScreen } from "./VideoScreen";

/**
 * SHARED. One building from content/buildings.ts, already positioned by lib/three/layout.ts.
 * Renders: box collider (so any model drives the same), the model for its kind (registry, or the `Model`
 * override an island passes), a floating beacon (brightens when the car is close, turns into a tick once
 * opened), the hosts of a podcast studio (one faceless figure per episode speaker) and the proximity sensor. Opening is always the visitor's choice (E / tap), never automatic.
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

  // The References building: boards in the island's centre instead of a house on the ring road.
  if (placed.sources) {
    return (
      <>
        <SourcesBoards placed={placed} rows={placed.sources} accent={pal.accent} />
        <group position={placed.position}>
          <Beacon id={placed.id} y={SOURCE_BOARD.height + 2.6} accent={pal.accent} />
        </group>
        <BuildingSensor id={placed.id} position={placed.sensor.position} radius={placed.sensor.radius} />
      </>
    );
  }

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
        {placed.hosts.length > 0 && <Hosts id={placed.id} looks={placed.hosts} plot={plot} />}
        {/* Above the beacon */}
        {placed.videoSrc && <VideoScreen id={placed.id} src={placed.videoSrc} y={top + 5.6} />}
      </group>
      <BuildingSensor id={placed.id} position={placed.sensor.position} radius={placed.sensor.radius} />
    </>
  );
}

/**
 * A podcast studio's speakers standing together by the door, left of it (the "coming soon" barrier is on the
 * right), just outside the collider. Faceless figures in each speaker's content look: no names, no likeness.
 * Built from the episode's speakers, so a third host (or a fictional guest) appears without a code change.
 * Static, so the group merges into one draw call.
 */
function Hosts({ id, looks, plot }: { id: string; looks: FigureLookInput[]; plot: { width: number; depth: number } }) {
  // Development only: lets the e2e tests count the figures at each studio.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __hostCounts?: Record<string, number> };
    (w.__hostCounts ??= {})[id] = looks.length;
  }, [id, looks.length]);
  const gap = 1.15;
  const cx = -plot.width * 0.28;
  const z = plot.depth * 0.34 + 0.9;
  const mid = (looks.length - 1) / 2;
  return (
    <StaticMerge>
      {looks.map((look, i) => (
        // Turned slightly towards each other, as if talking, while still facing the road.
        <group
          key={i}
          position={[cx + (i - mid) * gap, 0, z - Math.abs(i - mid) * 0.25]}
          rotation-y={(i - mid) * -0.35}
        >
          <FacelessFigure position={[0, 0, 0]} look={look} />
        </group>
      ))}
    </StaticMerge>
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
