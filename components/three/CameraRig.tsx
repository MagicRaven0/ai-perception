"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { findBuilding, type Pose, type WorldLayout } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { player } from "@/lib/three/transient";
import { CAMERA_AZIMUTH, CAMERA_DISTANCE, CAMERA_ELEVATION_DEG, CAMERA_SPAN } from "@/lib/three/camera";

/**
 * SHARED. High-angle isometric camera (latecheckout.studio look) that follows the car with a slow, floaty
 * ease and a little look-ahead. Snaps on teleports. With prefers-reduced-motion it follows without easing.
 * While a building drawer is open it frames the building beside the car, nudged left of the drawer.
 * Reads the transient channel every frame; subscribes to the store without re-rendering.
 */

const AZIMUTH = CAMERA_AZIMUTH;
const ELEVATION = THREE.MathUtils.degToRad(CAMERA_ELEVATION_DEG);
const DISTANCE = CAMERA_DISTANCE;
const OFFSET = new THREE.Vector3(
  Math.cos(ELEVATION) * Math.sin(AZIMUTH),
  Math.sin(ELEVATION),
  Math.cos(ELEVATION) * Math.cos(AZIMUTH),
).multiplyScalar(DISTANCE);
/** Screen-right in world space for this camera (used to keep a framed building clear of the drawer). */
const SCREEN_RIGHT = new THREE.Vector3(Math.cos(AZIMUTH), 0, -Math.sin(AZIMUTH));

const desired = new THREE.Vector3();
const look = new THREE.Vector3();

/**
 * Zoom (pixels per metre): a calm overview of about 104 x 65 m on desktop (the road ahead and a few buildings);
 * on narrow phones about 52 m across, so the car stays readable. See CAMERA_SPAN.
 */
function baseZoom(width: number, height: number) {
  return Math.min(width / (width < 640 ? CAMERA_SPAN.phone : CAMERA_SPAN.wide), height / CAMERA_SPAN.tall);
}

export function CameraRig({ world, start }: { world: WorldLayout; start: Pose }) {
  const camera = useRef<THREE.OrthographicCamera>(null);
  const size = useThree((s) => s.size);
  const target = useRef(new THREE.Vector3(start.x, 0, start.z));
  const seenTeleports = useRef(player.teleports);
  const framing = useRef<THREE.Vector3 | null>(null);

  // Drawer framing, without re-rendering this component.
  useEffect(() => {
    const apply = (id: string | null) => {
      const b = id ? findBuilding(world, id) : undefined;
      framing.current = b ? new THREE.Vector3(b.position[0], 0, b.position[2]) : null;
    };
    apply(useStore.getState().openBuildingId);
    return useStore.subscribe((s, prev) => {
      if (s.openBuildingId !== prev.openBuildingId) apply(s.openBuildingId);
    });
  }, [world]);

  useFrame((_, dt) => {
    const cam = camera.current;
    if (!cam) return;
    const zoomBase = baseZoom(size.width, size.height);

    if (framing.current) {
      // Midpoint of car and building, pushed right in world space so it sits left of a 420px drawer.
      const drawerShift = size.width >= 768 ? 210 / (zoomBase * 1.15) : 0;
      desired.set(player.x, 0, player.z).lerp(framing.current, 0.5).addScaledVector(SCREEN_RIGHT, drawerShift);
    } else {
      // Look a little ahead of the car along its heading, more at speed.
      const ahead = Math.min(player.speed * 0.35, 6);
      desired.set(player.x + Math.sin(player.heading) * ahead, 0, player.z + Math.cos(player.heading) * ahead);
    }

    const snapped = seenTeleports.current !== player.teleports;
    seenTeleports.current = player.teleports;
    if (snapped || motion.reduced) target.current.copy(desired);
    else target.current.lerp(desired, 1 - Math.exp(-dt * 2.2));

    cam.position.copy(target.current).add(OFFSET);
    cam.lookAt(look.copy(target.current));

    const zoomGoal = zoomBase * (framing.current ? 1.15 : 1);
    const z = snapped || motion.reduced ? zoomGoal : cam.zoom + (zoomGoal - cam.zoom) * (1 - Math.exp(-dt * 2));
    if (Math.abs(z - cam.zoom) > 1e-4) {
      cam.zoom = z;
      cam.updateProjectionMatrix();
    }
  });

  return (
    <OrthographicCamera
      ref={camera}
      makeDefault
      near={1}
      far={700}
      zoom={baseZoom(size.width, size.height)}
      position={[start.x + OFFSET.x, OFFSET.y, start.z + OFFSET.z]}
    />
  );
}
