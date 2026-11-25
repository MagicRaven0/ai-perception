"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { ERA_ORDER, findBuilding, nearestEra, type Pose, type WorldLayout } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { hover, isFreeLook, look, orbit, player, recenterLook, setAutoDrive, turnLook } from "@/lib/three/transient";
import { pickWorldObject } from "@/lib/three/picking";
import { CAR_COLOURS } from "@/lib/three/palette";
import { CAMERA_AZIMUTH, CAMERA_DISTANCE, CAMERA_ELEVATION_DEG, CAMERA_SPAN } from "@/lib/three/camera";

/**
 * SHARED. High-angle isometric camera (latecheckout.studio look) that follows the car with a slow, floaty
 * ease and a little look-ahead. Snaps on teleports. With prefers-reduced-motion it follows without easing.
 * While a building drawer is open it frames the building beside the car, nudged left of the drawer.
 * 360° overview: drag on the world (mouse or one finger) or press Q / Z to orbit around the car; it stays where
 * you leave it. Driver's view (HUD eye button or V): a perspective camera in the driver's seat looking down the road; drag to
 * look around, all the way round and up or down; it stays where you leave it, and driving on eases it back (C
 * recenters). It works the same in the plane: the view follows climb and turn. The car or plane body is hidden, so
 * nothing blocks the view or wobbles; in the car a fixed dashboard shows which way the nose points. Reduced motion: no easing.
 * Free look (docs/VISION.md, added 22 Nov 2026): drag (left on the world, or right) turns and tilts; wheel or
 * pinch zooms (out to the whole island); Shift-drag, middle-drag or a two-finger drag pans; two-finger twist
 * turns. Recenter (HUD button or C) eases back to the default view; driving eases pan and zoom back after a pause.
 * Tilt stays between 18° and 80°, so the camera never goes below the ground or into a building.
 * Reads the transient channel every frame; re-renders only when the camera mode changes.
 */

const AZIMUTH = CAMERA_AZIMUTH;
const ELEVATION = THREE.MathUtils.degToRad(CAMERA_ELEVATION_DEG);
const DISTANCE = CAMERA_DISTANCE;
/** Free-look tilt limits (absolute elevation) and zoom-in limit (multiplier on the base zoom). */
const PITCH_MIN = THREE.MathUtils.degToRad(18) - ELEVATION;
const PITCH_MAX = THREE.MathUtils.degToRad(80) - ELEVATION;
const ZOOM_MAX = 2.2;
/** Driving eases pan and zoom back this long after the visitor's last camera input. */
const EASE_BACK_MS = 2500;

/** Camera offset from its target for a given orbit (written into `out`, no allocation). */
function offsetFor(yaw: number, out: THREE.Vector3, pitch = 0) {
  const a = AZIMUTH + yaw;
  const el = ELEVATION + pitch;
  return out.set(Math.cos(el) * Math.sin(a), Math.sin(el), Math.cos(el) * Math.cos(a)).multiplyScalar(DISTANCE);
}

/** Smallest zoom multiplier: the whole island the car is on fits the view. */
function minZoomFor(world: WorldLayout, width: number, height: number, zoomBase: number) {
  const r = world.islands[nearestEra(world, player.x, player.z)].geometry.radius;
  return Math.min(1, Math.min(width, height) / (2 * r + 12) / zoomBase);
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
const lookTarget = new THREE.Vector3();
const euler = new THREE.Euler();
const turn = new THREE.Quaternion();

/** First-person eye height above the vehicle's origin, and how far down the resting view points (radians). */
const CAR_EYE = 1.35;
const PLANE_EYE = 1.5;
const REST_PITCH = 0.1;
const PLANE_REST_PITCH = 0.24;

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
  // First person: smoothed heading, eye height and plane attitude.
  const drive = useRef({ heading: start.heading, y: 0, pitch: 0, bank: 0 });
  const cockpit = useRef<THREE.Group>(null);

  // Drag on the world (mouse or one finger): orbits the overview 360°, or looks around in the driver's seat.
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
    const d = drive.current;
    d.heading = player.heading;
    d.y = player.viewY + (player.flying ? PLANE_EYE : CAR_EYE);
    d.pitch = player.pitch;
    d.bank = 0;
    look.yaw = look.yawTarget = look.pitch = look.pitchTarget = 0;
    look.dragging = false;
  }, [mode]);
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let panning = false;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    // Farthest the pointer got from where it went down: a gesture that wandered is a drag, even if it came back.
    let travelled = 0;
    // Touch: every finger on the canvas, for two-finger pan / pinch / twist.
    const touches = new Map<number, { x: number; y: number }>();
    let pair: { cx: number; cy: number; dist: number; angle: number } | null = null;
    const pairOf = () => {
      const [a, b] = [...touches.values()];
      return {
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
      };
    };
    /** Pan the overview by a screen-space drag (grab-the-ground feel), clamped near the island. */
    const panBy = (dx: number, dy: number) => {
      const cam = getThree().camera as THREE.OrthographicCamera;
      const zoom = cam.zoom || 1;
      const a = AZIMUTH + orbit.yaw;
      const el = ELEVATION + orbit.pitch;
      const right = dx / zoom;
      const fwd = dy / zoom / Math.max(0.3, Math.sin(el));
      orbit.panTargetX += -Math.cos(a) * right - Math.sin(a) * fwd;
      orbit.panTargetZ += Math.sin(a) * right - Math.cos(a) * fwd;
      const r = world.islands[nearestEra(world, player.x, player.z)].geometry.radius * 1.2;
      const len = Math.hypot(orbit.panTargetX, orbit.panTargetZ);
      if (len > r) {
        orbit.panTargetX *= r / len;
        orbit.panTargetZ *= r / len;
      }
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 2) pair = pairOf();
      }
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
      travelled = 0;
      hover.active = false;
      dragging = true;
      panning = modeRef.current === "iso" && (e.button === 1 || e.shiftKey);
      look.dragging = modeRef.current === "driver";
      orbit.dragging = modeRef.current === "iso" && !panning;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" && touches.has(e.pointerId)) {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size >= 2 && pair && modeRef.current === "iso") {
          // Two fingers: drag pans, pinch zooms, twist turns.
          const now = pairOf();
          panBy(now.cx - pair.cx, now.cy - pair.cy);
          if (pair.dist > 0) orbit.zoomTarget *= now.dist / pair.dist;
          orbit.zoomTarget = Math.min(ZOOM_MAX, orbit.zoomTarget);
          let turn = now.angle - pair.angle;
          turn = Math.atan2(Math.sin(turn), Math.cos(turn));
          orbit.target -= turn;
          orbit.lastInput = performance.now();
          pair = now;
          lastX = e.clientX;
          lastY = e.clientY;
          return;
        }
      }
      if (!dragging) return;
      travelled = Math.max(travelled, Math.hypot(e.clientX - startX, e.clientY - startY));
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (modeRef.current === "driver") {
        turnLook(-dx * 0.006, -dy * 0.005);
      } else if (panning) {
        panBy(dx, dy);
        orbit.lastInput = performance.now();
      } else {
        orbit.target -= dx * 0.006;
        orbit.pitchTarget = THREE.MathUtils.clamp(orbit.pitchTarget + dy * 0.004, PITCH_MIN, PITCH_MAX);
        orbit.lastInput = performance.now();
      }
    };
    const up = (e?: PointerEvent) => {
      if (e?.pointerType === "touch") {
        touches.delete(e.pointerId);
        pair = touches.size >= 2 ? pairOf() : null;
        if (touches.size > 0) return;
      }
      dragging = false;
      panning = false;
      look.dragging = false;
      orbit.dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      if (modeRef.current !== "iso") return;
      e.preventDefault();
      orbit.zoomTarget = Math.min(ZOOM_MAX, orbit.zoomTarget * Math.exp(-e.deltaY * 0.0015));
      orbit.lastInput = performance.now();
    };
    // Right-drag turns the view: no browser menu on the canvas.
    const menu = (e: MouseEvent) => e.preventDefault();
    /** Cast the pointer into the world: the building or figure under it on this island, else the ground spot. */
    const aim = (e: PointerEvent) => {
      const { camera: cam } = getThree();
      const rect = el.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, cam);
      const onTeam = (x: number, z: number) =>
        Math.hypot(x - world.team.center[0], z - world.team.center[1]) < world.team.radius - 2;
      const here = onTeam(player.x, player.z) ? "team" : nearestEra(world, player.x, player.z);
      const object = here === "team" ? null : pickWorldObject(world, here, raycaster.ray);
      const ground_ = raycaster.ray.intersectPlane(ground, hit) ? hit : null;
      return { object, ground: ground_, here, onTeam };
    };
    /** Pointer moved with nothing pressed: highlight what a click would walk to, and tell the cursor. */
    const hoverMove = (e: PointerEvent) => {
      if (dragging || e.pointerType === "touch") return;
      const { object } = aim(e);
      if (object?.kind === "building") {
        const b = object.building;
        hover.active = true;
        hover.x = b.position[0];
        hover.z = b.position[2];
        hover.w = b.plot.width;
        hover.d = b.plot.depth;
        hover.rot = b.rotationY;
      } else if (object?.kind === "figure") {
        hover.active = true;
        hover.x = object.figure.position[0];
        hover.z = object.figure.position[2];
        hover.w = hover.d = 3.2;
        hover.rot = 0;
      } else hover.active = false;
      if (hover.active) el.dataset.hoverTarget = "";
      else delete el.dataset.hoverTarget;
    };
    const hoverLeave = () => {
      hover.active = false;
      delete el.dataset.hoverTarget;
    };
    // A short tap or click (not a drag) in the world: a building drives to its door and opens, a figure drives to
    // it, the ground drives there (tap-to-drive). Orbiting the camera never counts as a click.
    const tap = (e: PointerEvent) => {
      const wasTap = touches.size <= 1 && travelled < 8 && performance.now() - startT < 600;
      up(e);
      if (!wasTap || e.button > 0) return;
      const { object, ground: spot, here, onTeam } = aim(e);
      // The pointer is over a building or figure on this island: go to its door / to it.
      if (object?.kind === "building") {
        const b = object.building;
        setAutoDrive(b.approach.x, b.approach.z, b.id);
        return;
      }
      if (object?.kind === "figure") {
        setAutoDrive(object.figure.position[0], object.figure.position[2]);
        return;
      }
      if (!spot) return;
      // Only spots on the island the car is on (driving straight to another island would miss the bridge).
      const there = onTeam(spot.x, spot.z)
        ? "team"
        : ERA_ORDER.find((id) => {
            const g = world.islands[id].geometry;
            return Math.hypot(spot.x - g.center[0], spot.z - g.center[1]) < g.radius - 3;
          });
      if (!there) return;
      if (there !== here) {
        useStore.getState().showToast("Tap a spot on this island, or use the island buttons to travel.");
        return;
      }
      setAutoDrive(spot.x, spot.z);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", hoverMove);
    el.addEventListener("pointerleave", hoverLeave);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("contextmenu", menu);
    window.addEventListener("pointermove", move);
    el.addEventListener("pointerup", tap);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", hoverMove);
      el.removeEventListener("pointerleave", hoverLeave);
      hoverLeave();
      el.removeEventListener("pointerup", tap);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", menu);
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
      const snapped = seenTeleports.current !== player.teleports;
      seenTeleports.current = player.teleports;
      const snap = snapped || motion.reduced;
      // Heading: a short ease takes the edge off key-press steering.
      let diff = player.heading - d.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      d.heading = snap ? player.heading : d.heading + diff * (1 - Math.exp(-dt * 14));
      // Looking around is free and stays where you leave it; driving on eases it back after a short pause.
      const idle = performance.now() - look.lastInput > EASE_BACK_MS;
      if (snapped) recenterLook();
      else if (!look.dragging && idle && player.speed > 2 && (look.yawTarget !== 0 || look.pitchTarget !== 0))
        recenterLook();
      const kl = snap ? 1 : 1 - Math.exp(-dt * (look.dragging ? 30 : 8));
      look.yaw += (look.yawTarget - look.yaw) * kl;
      look.pitch += (look.pitchTarget - look.pitch) * kl;
      const turned = Math.abs(Math.sin(look.yawTarget / 2)) > 0.03 || Math.abs(look.pitchTarget) > 0.03;
      if (turned !== useStore.getState().freeLook) useStore.getState().setFreeLook(turned);

      // Height is smoothed on the ground (physics settles by millimetres); the plane's is already smooth.
      const y = player.viewY + (player.flying ? PLANE_EYE : CAR_EYE);
      d.y = snap || player.flying || Math.abs(y - d.y) > 1 ? y : d.y + (y - d.y) * (1 - Math.exp(-dt * 10));
      d.pitch += ((player.flying ? player.pitch * 0.6 : 0) - d.pitch) * (snap ? 1 : 1 - Math.exp(-dt * 6));
      d.bank +=
        ((player.flying && !motion.reduced ? player.bank * 0.5 : 0) - d.bank) * (snap ? 1 : 1 - Math.exp(-dt * 6));

      // The vehicle's frame (a camera looks down -Z, the vehicle faces +Z: half a turn), then the look-around.
      euler.set(d.pitch, d.heading + Math.PI, d.bank, "YXZ");
      cam.position.set(player.viewX, d.y, player.viewZ);
      cam.quaternion.setFromEuler(euler);
      if (cockpit.current) {
        // In the air you look down at the islands: the dashboard would be in the way.
        cockpit.current.visible = !player.flying;
        cockpit.current.position.copy(cam.position);
        cockpit.current.quaternion.copy(cam.quaternion);
      }
      euler.set(look.pitch - (player.flying ? PLANE_REST_PITCH : REST_PITCH), look.yaw, 0, "YXZ");
      cam.quaternion.multiply(turn.setFromEuler(euler));
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
    // Free look: tilt, zoom and pan ease toward their targets (instant with reduced motion).
    const k = motion.reduced ? 1 : 1 - Math.exp(-dt * 6);
    const minZoom = minZoomFor(world, size.width, size.height, zoomBase);
    orbit.zoomTarget = THREE.MathUtils.clamp(orbit.zoomTarget, minZoom, ZOOM_MAX);
    // Driving again eases pan and zoom back behind the car after a short pause in camera input.
    if (Math.abs(player.speed) > 2 && !orbit.dragging && performance.now() - orbit.lastInput > EASE_BACK_MS) {
      orbit.panTargetX = orbit.panTargetZ = 0;
      orbit.zoomTarget = 1;
    }
    orbit.pitch += (orbit.pitchTarget - orbit.pitch) * k;
    orbit.zoom += (orbit.zoomTarget - orbit.zoom) * k;
    orbit.panX += (orbit.panTargetX - orbit.panX) * k;
    orbit.panZ += (orbit.panTargetZ - orbit.panZ) * k;
    const free = isFreeLook();
    if (free !== useStore.getState().freeLook) useStore.getState().setFreeLook(free);

    offsetFor(orbit.yaw, offset, orbit.pitch);
    const a = AZIMUTH + orbit.yaw;
    screenRight.set(Math.cos(a), 0, -Math.sin(a));

    if (framing.current) {
      // Midpoint of car and building, pushed right in world space so it sits left of a 420px drawer.
      const drawerShift = size.width >= 768 ? 210 / (zoomBase * 1.15) : 0;
      desired.set(player.viewX, 0, player.viewZ).lerp(framing.current, 0.5).addScaledVector(screenRight, drawerShift);
    } else {
      // Look a little ahead of the car along its heading, more at speed.
      const ahead = Math.min(player.speed * 0.35, 6);
      // In the air the camera rises with the plane, so it stays in the middle of the view.
      desired.set(
        player.viewX + Math.sin(player.heading) * ahead,
        player.flying ? Math.max(0, player.viewY - 1) : 0,
        player.viewZ + Math.cos(player.heading) * ahead,
      );
    }

    const snapped = seenTeleports.current !== player.teleports;
    seenTeleports.current = player.teleports;
    // A teleport (fast travel, respawn) brings the view back to the car.
    if (snapped) orbit.panX = orbit.panZ = orbit.panTargetX = orbit.panTargetZ = 0;
    desired.x += orbit.panX;
    desired.z += orbit.panZ;
    if (snapped || motion.reduced) target.current.copy(desired);
    else target.current.lerp(desired, 1 - Math.exp(-dt * 2.2));

    cam.position.copy(target.current).add(offset);
    cam.lookAt(lookTarget.copy(target.current));

    const zoomGoal = zoomBase * (framing.current ? 1.15 : 1) * orbit.zoom;
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
          far={500}
          position={[player.viewX, player.viewY + CAR_EYE, player.viewZ]}
        />
      )}
      {mode === "driver" && (
        <group ref={cockpit}>
          <Cockpit />
        </group>
      )}
    </>
  );
}

/** A low dashboard and steering wheel, fixed to the vehicle (camera space: -Z is the nose). Never blocks the road. */
function Cockpit() {
  const era = useStore((s) => s.activeEra);
  const c = CAR_COLOURS[era];
  return (
    <group>
      <mesh position={[0, -0.74, -0.95]} rotation-x={0.25}>
        <boxGeometry args={[2.1, 0.14, 0.5]} />
        <meshLambertMaterial color={c.body} />
      </mesh>
      <mesh position={[0, -0.66, -1.12]}>
        <boxGeometry args={[2.1, 0.05, 0.12]} />
        <meshLambertMaterial color={c.trim} />
      </mesh>
      <mesh position={[0, -0.66, -0.78]} rotation-x={-0.5}>
        <torusGeometry args={[0.2, 0.025, 6, 20]} />
        <meshLambertMaterial color={c.wheel} />
      </mesh>
    </group>
  );
}
