"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
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
 * Driver's view (HUD eye button or V): a perspective camera in the driver's seat looking down the road; drag to
 * look around, released view eases back to straight ahead. Reduced motion: no easing, no look-ahead sway.
 * Reads the transient channel every frame; re-renders only when the camera mode changes.
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
const seat = new THREE.Vector3();

/** Driver's seat, in car space (x right, y up, z forward), and how far you can look around by dragging. */
const SEAT = { y: 1.35, z: 0.05, ahead: 12 };
const LOOK_LIMIT = { yaw: 1.3, pitch: 0.45 };

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
  const driverCam = useRef<THREE.PerspectiveCamera>(null);
  const mode = useStore((s) => s.cameraMode);
  const gl = useThree((s) => s.gl);
  // Driver's view: smoothed heading and the drag-to-look offset.
  const drive = useRef({ heading: start.heading, yaw: 0, pitch: 0, dragging: false, lastX: 0, lastY: 0 });

  // Drag to look around (mouse or one finger on the canvas). Only while in the driver's seat.
  useEffect(() => {
    if (mode !== "driver") return;
    const el = gl.domElement;
    const d = drive.current;
    const down = (e: PointerEvent) => {
      d.dragging = true;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!d.dragging) return;
      d.yaw = THREE.MathUtils.clamp(d.yaw - (e.clientX - d.lastX) * 0.005, -LOOK_LIMIT.yaw, LOOK_LIMIT.yaw);
      d.pitch = THREE.MathUtils.clamp(d.pitch - (e.clientY - d.lastY) * 0.004, -LOOK_LIMIT.pitch, LOOK_LIMIT.pitch);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    };
    const up = () => {
      d.dragging = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    d.heading = player.heading;
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      d.dragging = false;
      d.yaw = d.pitch = 0;
    };
  }, [mode, gl]);

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
    if (mode === "driver") {
      const cam = driverCam.current;
      if (!cam) return;
      const d = drive.current;
      // Follow the car's heading with a short ease so turning feels smooth; snap on teleports.
      const snapped = seenTeleports.current !== player.teleports;
      seenTeleports.current = player.teleports;
      let diff = player.heading - d.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      d.heading = snapped || motion.reduced ? player.heading : d.heading + diff * (1 - Math.exp(-dt * 10));
      // Released drag eases back to straight ahead.
      if (!d.dragging) {
        const back = motion.reduced ? 1 : 1 - Math.exp(-dt * 3);
        d.yaw -= d.yaw * back;
        d.pitch -= d.pitch * back;
      }
      const h = d.heading;
      seat.set(player.x + Math.sin(h) * SEAT.z, player.y + SEAT.y, player.z + Math.cos(h) * SEAT.z);
      cam.position.copy(seat);
      const lookH = h + d.yaw;
      look.set(
        seat.x + Math.sin(lookH) * SEAT.ahead,
        seat.y - 1.2 + Math.sin(d.pitch) * SEAT.ahead,
        seat.z + Math.cos(lookH) * SEAT.ahead,
      );
      cam.lookAt(look);
      return;
    }

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
    <>
      <OrthographicCamera
        ref={camera}
        makeDefault={mode === "iso"}
        near={1}
        far={700}
        zoom={baseZoom(size.width, size.height)}
        position={[start.x + OFFSET.x, OFFSET.y, start.z + OFFSET.z]}
      />
      {mode === "driver" && (
        <PerspectiveCamera
          ref={driverCam}
          makeDefault
          fov={size.width < 640 ? 75 : 62}
          near={0.1}
          far={260}
          position={[player.x, player.y + SEAT.y, player.z]}
        />
      )}
    </>
  );
}
