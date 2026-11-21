"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { ERA_ORDER, findBuilding, nearestEra, type Pose, type WorldLayout } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { orbit, player, setAutoDrive } from "@/lib/three/transient";
import { CAMERA_AZIMUTH, CAMERA_DISTANCE, CAMERA_ELEVATION_DEG, CAMERA_SPAN } from "@/lib/three/camera";

/**
 * SHARED. High-angle isometric camera (latecheckout.studio look) that follows the car with a slow, floaty
 * ease and a little look-ahead. Snaps on teleports. With prefers-reduced-motion it follows without easing.
 * While a building drawer is open it frames the building beside the car, nudged left of the drawer.
 * 360° overview: drag on the world (mouse or one finger) or press Q / Z to orbit around the car; it stays where
 * you leave it. Driver's view (HUD eye button or V): a perspective camera in the driver's seat looking down the road; drag to
 * look around, released view eases back to straight ahead. Reduced motion: no easing, no look-ahead sway.
 * Reads the transient channel every frame; re-renders only when the camera mode changes.
 */

const AZIMUTH = CAMERA_AZIMUTH;
const ELEVATION = THREE.MathUtils.degToRad(CAMERA_ELEVATION_DEG);
const DISTANCE = CAMERA_DISTANCE;
/** Camera offset from its target for a given orbit (written into `out`, no allocation). */
function offsetFor(yaw: number, out: THREE.Vector3) {
  const a = AZIMUTH + yaw;
  return out
    .set(Math.cos(ELEVATION) * Math.sin(a), Math.sin(ELEVATION), Math.cos(ELEVATION) * Math.cos(a))
    .multiplyScalar(DISTANCE);
}
const OFFSET = offsetFor(0, new THREE.Vector3());
const offset = new THREE.Vector3();
/** Screen-right in world space for the current orbit (keeps a framed building clear of the drawer). */
const screenRight = new THREE.Vector3();

const desired = new THREE.Vector3();
// Tap-to-drive picking (scratch objects; picking runs only on a tap, not per frame).
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2);
const hit = new THREE.Vector3();
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
  const getThree = useThree((s) => s.get);
  // Driver's view: smoothed heading and the drag-to-look offset.
  const drive = useRef({ heading: start.heading, yaw: 0, pitch: 0, dragging: false, lastX: 0, lastY: 0 });

  // Drag on the world (mouse or one finger): orbits the overview 360°, or looks around in the driver's seat.
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
    const d = drive.current;
    d.heading = player.heading;
    d.yaw = d.pitch = 0;
  }, [mode]);
  useEffect(() => {
    const el = gl.domElement;
    const d = drive.current;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    const down = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
      dragging = true;
      d.dragging = true;
      orbit.dragging = modeRef.current === "iso";
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (modeRef.current === "driver") {
        d.yaw = THREE.MathUtils.clamp(d.yaw - dx * 0.005, -LOOK_LIMIT.yaw, LOOK_LIMIT.yaw);
        d.pitch = THREE.MathUtils.clamp(d.pitch - dy * 0.004, -LOOK_LIMIT.pitch, LOOK_LIMIT.pitch);
      } else {
        orbit.target -= dx * 0.006;
      }
    };
    const up = () => {
      dragging = false;
      d.dragging = false;
      orbit.dragging = false;
    };
    // A short tap or click (not a drag) on the ground: drive there by itself (tap-to-drive).
    const tap = (e: PointerEvent) => {
      const wasTap = Math.hypot(e.clientX - startX, e.clientY - startY) < 10 && performance.now() - startT < 400;
      up();
      if (!wasTap || e.button > 0) return;
      const { camera: cam } = getThree();
      const rect = el.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, cam);
      if (!raycaster.ray.intersectPlane(ground, hit)) return;
      // Only spots on the island the car is on (driving straight to another island would miss the bridge).
      const here = nearestEra(world, player.x, player.z);
      const there = ERA_ORDER.find((id) => {
        const g = world.islands[id].geometry;
        return Math.hypot(hit.x - g.center[0], hit.z - g.center[1]) < g.radius - 3;
      });
      if (!there) return;
      if (there !== here) {
        useStore.getState().showToast("Tap a spot on this island, or use the island buttons to travel.");
        return;
      }
      setAutoDrive(hit.x, hit.z);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    el.addEventListener("pointerup", tap);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", tap);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      up();
    };
  }, [gl, getThree, world]);

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

    // Orbit: follow the drag directly, ease toward key steps (instant with reduced motion).
    orbit.yaw =
      orbit.dragging || motion.reduced
        ? orbit.target
        : orbit.yaw + (orbit.target - orbit.yaw) * (1 - Math.exp(-dt * 6));
    offsetFor(orbit.yaw, offset);
    const a = AZIMUTH + orbit.yaw;
    screenRight.set(Math.cos(a), 0, -Math.sin(a));

    if (framing.current) {
      // Midpoint of car and building, pushed right in world space so it sits left of a 420px drawer.
      const drawerShift = size.width >= 768 ? 210 / (zoomBase * 1.15) : 0;
      desired.set(player.x, 0, player.z).lerp(framing.current, 0.5).addScaledVector(screenRight, drawerShift);
    } else {
      // Look a little ahead of the car along its heading, more at speed.
      const ahead = Math.min(player.speed * 0.35, 6);
      desired.set(player.x + Math.sin(player.heading) * ahead, 0, player.z + Math.cos(player.heading) * ahead);
    }

    const snapped = seenTeleports.current !== player.teleports;
    seenTeleports.current = player.teleports;
    if (snapped || motion.reduced) target.current.copy(desired);
    else target.current.lerp(desired, 1 - Math.exp(-dt * 2.2));

    cam.position.copy(target.current).add(offset);
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
