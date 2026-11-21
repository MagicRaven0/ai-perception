"use client";

import { lazy, memo, Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, CylinderCollider, Physics, RigidBody } from "@react-three/rapier";
import type { EraId } from "@/lib/content/schema";
import { ERA_ORDER, type BridgeGeometry, type IslandLayout, type Pose, type WorldLayout } from "@/lib/three/layout";
import { ERA_PALETTE, SHARED } from "@/lib/three/palette";
import { Atmosphere } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { IslandSensor } from "./IslandSensor";
import { Vehicle } from "./Vehicle";
import { StaticMerge } from "./kit/StaticMerge";
import type { IslandProps } from "./islands/types";

/**
 * SHARED. The whole world inside the canvas: atmosphere, physics, the three islands (each lazy-loaded in its
 * own chunk), bridges, invisible edge walls, island sensors, the car and the camera.
 * Physics ground lives here (not in island files), so island visuals can change without breaking driving.
 *
 * The islands and FirstFrame share ONE Suspense boundary: the world counts as ready (and the 20 s load
 * watchdog in ExploreClient stops) only once all three island chunks have arrived. A hung island chunk
 * therefore ends in the reading-mode fallback instead of an empty island. Island rule: anything that loads
 * slowly inside an island (GLTF, textures, photos) gets its OWN <Suspense> with a placeholder, so it never
 * holds up the first frame (see Figure.tsx).
 */

const ISLANDS: Record<EraId, React.LazyExoticComponent<React.ComponentType<IslandProps>>> = {
  "era-1": lazy(() => import("./islands/IslandPast")),
  "era-2": lazy(() => import("./islands/IslandJobsEra")),
  "era-3": lazy(() => import("./islands/IslandFuture")),
};

function World({ world, start, onFirstFrame }: { world: WorldLayout; start: Pose; onFirstFrame: () => void }) {
  return (
    <>
      <Atmosphere />
      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
        {ERA_ORDER.map((id) => (
          <IslandPhysics key={id} island={world.islands[id]} />
        ))}
        {world.bridges.map((b) => (
          <Bridge key={b.id} bridge={b} />
        ))}
        <Vehicle world={world} start={start} />
        <Suspense fallback={null}>
          {ERA_ORDER.map((id) => {
            const island = world.islands[id];
            const Island = ISLANDS[id];
            return (
              <Island
                key={id}
                era={id}
                layout={island}
                buildings={island.buildings}
                insights={island.insights}
                figures={island.figures}
                palette={ERA_PALETTE[id]}
              />
            );
          })}
          <FirstFrame onFirstFrame={onFirstFrame} />
        </Suspense>
      </Physics>
      <CameraRig world={world} start={start} />
    </>
  );
}

export default memo(World);

/** Slab collider + low invisible walls around the edge (open at bridges) + the island sensor. */
function IslandPhysics({ island }: { island: IslandLayout }) {
  const g = island.geometry;
  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CylinderCollider args={[g.slabDepth / 2, g.radius]} position={[g.center[0], -g.slabDepth / 2, g.center[1]]} />
        {island.edgeWalls.map((w, i) => (
          <CuboidCollider
            key={i}
            args={[0.3, 0.9, w.length / 2]}
            position={w.position}
            rotation={[0, w.rotationY, 0]}
          />
        ))}
      </RigidBody>
      <IslandSensor geometry={g} />
    </>
  );
}

/** Width of the soft cream curb band along each side of a bridge deck (the inner edge lines up with the island
 * connector-road curbs: road 7 m, so the curbs start 3.5 m from the centre line). */
const BRIDGE_CURB = 1;
/** Curb height: a hint of a step that catches the light, low enough that the car never looks sunk in it. */
const BRIDGE_CURB_H = 0.05;

/**
 * Cream deck with soft curbs and low parapets, flush with the island tops (Late Checkout style). The visuals are
 * merged (StaticMerge): one draw call on Low, three on High (deck + parapets, curbs, shadow pass) per bridge,
 * down from six. Physics is separate.
 */
function Bridge({ bridge }: { bridge: BridgeGeometry }) {
  const { center, length, width, rotationY } = bridge;
  const curbX = width / 2 - BRIDGE_CURB / 2;
  // The deck overlaps 3 m into each island (lib/three/layout.ts): the bridge curbs start at the island rim, where
  // the island's own connector-road curbs end.
  const curbLength = Math.max(0, length - 6);
  return (
    <group position={[center[0], 0, center[1]]} rotation-y={rotationY}>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[width / 2, 0.5, length / 2]} position={[0, -0.5, 0]} />
        <CuboidCollider args={[0.25, 0.9, length / 2]} position={[-width / 2 - 0.25, 0.6, 0]} />
        <CuboidCollider args={[0.25, 0.9, length / 2]} position={[width / 2 + 0.25, 0.6, 0]} />
      </RigidBody>
      <StaticMerge>
        {/* Deck top 1 cm above the lawn where it overlaps the islands (no z-fighting at the joins) */}
        <mesh position={[0, -0.59, 0]} receiveShadow castShadow>
          <boxGeometry args={[width, 1.2, length]} />
          <meshLambertMaterial color={SHARED.bridge} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            {/* Soft curb band (no shadow casting: a 5 cm step only makes shadow-map stipple) */}
            <mesh position={[s * curbX, 0.01 + BRIDGE_CURB_H / 2, 0]} receiveShadow>
              <boxGeometry args={[BRIDGE_CURB, BRIDGE_CURB_H, curbLength]} />
              <meshLambertMaterial color={SHARED.bridgeCurb} />
            </mesh>
            {/* Low parapet */}
            <mesh position={[s * (width / 2 + 0.2), 0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.4, 0.9, length]} />
              <meshLambertMaterial color={SHARED.bridgeRail} />
            </mesh>
          </group>
        ))}
      </StaticMerge>
    </group>
  );
}

/** Calls onFirstFrame once, after physics (WASM), the three islands and the scene have rendered a frame. */
function FirstFrame({ onFirstFrame }: { onFirstFrame: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onFirstFrame();
  });
  return null;
}
