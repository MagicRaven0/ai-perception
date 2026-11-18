"use client";

import { BallCollider, type IntersectionEnterPayload, type IntersectionExitPayload } from "@react-three/rapier";
import { useStore } from "@/lib/store";
import type { Vec3 } from "@/lib/three/layout";

/** True when a sensor event comes from the player's car (the vehicle body has userData.player). */
export function isPlayer(payload: IntersectionEnterPayload | IntersectionExitPayload): boolean {
  const data = payload.other.rigidBody?.userData as { player?: boolean } | undefined;
  return data?.player === true;
}

/**
 * Generic proximity sensor: a ball sensor that calls onEnter / onLeave only for the car.
 * Sensors write to the store on enter/leave only (PLAN 5.2), never every frame.
 */
export function ProximitySensor({
  position,
  radius,
  onEnter,
  onLeave,
}: {
  position: Vec3;
  radius: number;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <BallCollider
      sensor
      args={[radius]}
      position={position}
      onIntersectionEnter={(p) => isPlayer(p) && onEnter()}
      onIntersectionExit={(p) => isPlayer(p) && onLeave()}
    />
  );
}

/** Drive close to a building -> nearbyBuildingId (shows "Press E / Tap to open"). Never auto-opens. */
export function BuildingSensor({ id, position, radius }: { id: string; position: Vec3; radius: number }) {
  return (
    <ProximitySensor
      position={position}
      radius={radius}
      onEnter={() => useStore.getState().enterBuilding(id)}
      onLeave={() => useStore.getState().leaveBuilding(id)}
    />
  );
}

/** Signposts and figures: shows their text in the HUD while the car is close. */
export function SignSensor({ id, position, radius }: { id: string; position: Vec3; radius: number }) {
  return (
    <ProximitySensor
      position={position}
      radius={radius}
      onEnter={() => useStore.getState().enterSign(id)}
      onLeave={() => useStore.getState().leaveSign(id)}
    />
  );
}
