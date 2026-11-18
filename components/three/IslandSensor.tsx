"use client";

import { CylinderCollider } from "@react-three/rapier";
import { useStore } from "@/lib/store";
import type { IslandGeometry } from "@/lib/three/layout";
import { isPlayer } from "./BuildingSensor";

/**
 * One big sensor per island. Entering sets activeEra (sky, fog, light, music and the HUD follow).
 * Exits are ignored: activeEra is never empty, and bridges briefly overlap two sensors.
 */
export function IslandSensor({ geometry }: { geometry: IslandGeometry }) {
  const [cx, cz] = geometry.center;
  return (
    <CylinderCollider
      sensor
      args={[6, geometry.radius - 2]}
      position={[cx, 4, cz]}
      onIntersectionEnter={(p) => isPlayer(p) && useStore.getState().setActiveEra(geometry.eraId)}
    />
  );
}
