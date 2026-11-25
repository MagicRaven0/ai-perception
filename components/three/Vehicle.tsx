"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { RigidBodyType } from "@dimforge/rapier3d-compat";
import { FALL_Y, headingOf, nearestEra, type Pose, type WorldLayout } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { useStore } from "@/lib/store";
import type { EraId } from "@/lib/content/schema";
import { CAR_HANDLING, EraCar } from "./car/EraCar";
import { EraPlane } from "./car/EraPlane";
import {
  attachKeyboard,
  autoDrive,
  flight,
  input,
  player,
  requestTeleport,
  savePosition,
  takeTeleport,
} from "@/lib/three/transient";

/**
 * SHARED. The player's car: a small custom arcade car on a Rapier dynamic body (Bruno-style feel).
 *
 * Why not ecctrl's EcctrlVehicle: it was tried first (ecctrl 2.0.2 was installed; removed 21 Nov 2026 with the touch joystick). Its torque-driven wheels
 * hopped under throttle, flipped under hard braking, and kept their wheel spin across teleports (the car
 * lurched after fast travel). This controller is predictable and calm, which suits a class audience:
 * - the body only rotates about Y (it can never flip); gravity still applies and colliders still block;
 * - speed, steering and boost are simple eased values; the body mesh leans and bobs for the "floaty" feel.
 *
 * Interface (keep it if the controller is swapped again):
 * - IN:  lib/three/transient `input` (keyboard, joystick, touch buttons) and `takeTeleport()`;
 * - OUT: writes `player` (position, heading, speed, ready, teleports) every frame, never React state;
 * - respawns at the nearest island's spawn when it falls below FALL_Y or leaves the world bounds.
 *
 * Flight (21 Nov 2026): drive off the open end of an island's runway and the car becomes that era's plane
 * (EraPlane). The body turns kinematic and follows a calm arcade flight model: W / up climbs, S / down dives,
 * A D / left right turn, Shift boosts; it never flies below a safe height over the islands or out of the world.
 * L or the HUD "Land" button lands on the nearest island's runway as a car again.
 */

const DYNAMIC = 0 as RigidBodyType;
const KINEMATIC = 2 as RigidBodyType;
const FLY = { cruise: 17, boost: 28, turnRate: 1.0, minAlt: 9, maxAlt: 60, maxPitch: 0.45 };

const MAX_SPEED = 13;
const BOOST_SPEED = 20;
const REVERSE_SPEED = 6;
const ACCEL = 11;
const BOOST_ACCEL = 16;
const BRAKE = 20;
const COAST = 5;
/** Yaw rate at full lock (rad/s), reached from 4 m/s. */
const STEER_RATE = 2.1;

const BODY = { halfW: 0.85, halfL: 1.45 };

const up = new THREE.Vector3(0, 1, 0);
const quat = new THREE.Quaternion();
// Scratch vectors reused every frame (no allocations in useFrame). Rapier's own linvel() / translation()
// still return a new object per call; that happens inside its JS bindings and cannot be avoided here.
const ZERO = { x: 0, y: 0, z: 0 };
const vel = { x: 0, y: 0, z: 0 };
const pos = { x: 0, y: 0, z: 0 };
const view = new THREE.Vector3();

export function Vehicle({ world, start }: { world: WorldLayout; start: Pose }) {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const [initialEra] = useState<EraId>(() => nearestEra(world, start.x, start.z));
  const era = useRef<EraId>(initialEra);
  const carGroup = useRef<THREE.Group>(null);
  const planeGroup = useRef<THREE.Group>(null);
  const fly = useRef({ speed: 0, pitch: 0, bank: 0, swap: 1 });
  const state = useRef({
    speed: 0,
    heading: start.heading,
    steer: 0,
    pitch: 0,
    roll: 0,
    lastSave: 0,
    prevSpeed: 0,
    stuckFor: 0,
    /** Tap-to-drive unsticking: seconds left of backing out, and which way to swing round afterwards. */
    backFor: 0,
    detour: 0,
    detourUntil: 0,
  });

  useEffect(() => attachKeyboard(), []);
  // The era decides the car's look (EraCar) and a slightly different top speed; read without re-rendering.
  useEffect(() => {
    era.current = useStore.getState().activeEra;
    return useStore.subscribe((st) => {
      era.current = st.activeEra;
    });
  }, []);
  useEffect(
    () => () => {
      player.ready = false;
    },
    [],
  );

  useFrame((frame, rawDt) => {
    const b = body.current;
    if (!b) return;
    const dt = Math.min(rawDt, 1 / 20);
    const s = state.current;

    // 1. Teleports (fast travel, deep links, "I'm stuck").
    const t = takeTeleport();
    if (t) {
      pos.x = t.x;
      pos.y = t.y + 0.3;
      pos.z = t.z;
      b.setTranslation(pos, true);
      b.setLinvel(ZERO, true);
      s.speed = 0;
      s.heading = t.heading;
      player.teleports++;
    }

    // Car <-> plane swap: a quick shrink-and-grow "pop" (instant with reduced motion).
    const f = fly.current;
    f.swap = motion.reduced ? 1 : Math.min(1, f.swap + dt / 0.5);
    const pop = Math.max(0.05, Math.abs(Math.cos(Math.PI * f.swap)));
    // First person: the camera is inside, so the body (nose, roof, leaning) would only block the view.
    if (visual.current) visual.current.visible = useStore.getState().cameraMode !== "driver";
    if (carGroup.current) {
      carGroup.current.visible = !player.flying ? f.swap > 0.5 || f.swap === 1 : f.swap < 0.5;
      carGroup.current.scale.setScalar(pop);
    }
    if (planeGroup.current) {
      planeGroup.current.visible = player.flying ? f.swap > 0.5 || f.swap === 1 : f.swap < 0.5 && f.swap !== 1;
      planeGroup.current.scale.setScalar(pop);
    }

    if (player.flying) {
      // Land: back to a car on the nearest island's runway, facing the island.
      if (flight.landRequested) {
        flight.landRequested = false;
        const era = nearestEra(world, player.x, player.z);
        const r = world.runways[era];
        b.setBodyType(DYNAMIC, true);
        player.flying = false;
        f.swap = 0;
        useStore.getState().setFlying(false);
        requestTeleport({
          x: r.start[0] + r.dir[0] * 4,
          y: 1.2,
          z: r.start[1] + r.dir[1] * 4,
          heading: headingOf(-r.dir[0], -r.dir[1]),
        });
        return;
      }
      const climb = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
      const turn = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      // Soft limits: climb back up when low, level off when high, and turn back toward the islands at the edge.
      let pitchGoal = climb * FLY.maxPitch;
      if (player.y < FLY.minAlt) pitchGoal = Math.max(pitchGoal, 0.3);
      if (player.y > FLY.maxAlt) pitchGoal = Math.min(pitchGoal, 0);
      let turnIn = turn;
      const bnd = world.bounds;
      if (player.x < bnd.minX || player.x > bnd.maxX || player.z < bnd.minZ || player.z > bnd.maxZ) {
        let back = Math.atan2(-player.x, -player.z) - s.heading;
        back = Math.atan2(Math.sin(back), Math.cos(back));
        turnIn = THREE.MathUtils.clamp(back * 2, -1, 1);
      }
      f.pitch += (pitchGoal - f.pitch) * (1 - Math.exp(-dt * 3));
      f.bank += (turnIn * 0.6 - f.bank) * (1 - Math.exp(-dt * 4));
      s.heading += turnIn * FLY.turnRate * dt;
      f.speed += ((input.boost ? FLY.boost : FLY.cruise) - f.speed) * (1 - Math.exp(-dt * 1.5));
      pos.x = player.x + Math.sin(s.heading) * Math.cos(f.pitch) * f.speed * dt;
      pos.z = player.z + Math.cos(s.heading) * Math.cos(f.pitch) * f.speed * dt;
      pos.y = Math.max(1.5, player.y + Math.sin(f.pitch) * f.speed * dt);
      b.setNextKinematicTranslation(pos);
      b.setNextKinematicRotation(quat.setFromAxisAngle(up, s.heading));
      const v = visual.current;
      if (v) {
        v.rotation.set(-f.pitch, 0, -f.bank);
        v.position.y = 0.1;
      }
      player.x = pos.x;
      player.y = pos.y;
      player.z = pos.z;
      player.heading = s.heading;
      player.speed = f.speed;
      player.pitch = f.pitch;
      player.bank = f.bank;
      player.viewX = pos.x;
      player.viewY = pos.y;
      player.viewZ = pos.z;
      // The island below decides the plane's era (island sensors are on the ground).
      const below = nearestEra(world, pos.x, pos.z);
      if (below !== useStore.getState().activeEra) useStore.getState().setActiveEra(below);
      return;
    }

    // 2. Input: keyboard / arrow pad, or tap-to-drive when nothing is pressed.
    const joyThrottle = Math.abs(input.joyY) > 0.2 ? input.joyY : 0;
    let throttle = input.forward ? 1 : input.backward ? -1 : joyThrottle;
    let steerIn = THREE.MathUtils.clamp(
      (input.left ? 1 : 0) - (input.right ? 1 : 0) - (Math.abs(input.joyX) > 0.12 ? input.joyX : 0),
      -1,
      1,
    );
    if (autoDrive.active && throttle === 0 && steerIn === 0) {
      const dx = autoDrive.x - player.x;
      const dz = autoDrive.z - player.z;
      const dist = Math.hypot(dx, dz);
      const now = performance.now();
      if (s.backFor > 0) {
        // Backed into something: reverse straight for a moment, then swing round it (see below).
        s.backFor -= dt;
        throttle = -0.8;
        s.stuckFor = 0;
      } else {
        s.stuckFor = Math.abs(s.speed) < 1.2 ? s.stuckFor + dt : 0;
      }
      if (dist < autoDrive.arrive) {
        // Arrived. A click on a building drove to its door: now open it (the click was the visitor's choice).
        const open = autoDrive.openId;
        autoDrive.active = false;
        autoDrive.openId = null;
        s.stuckFor = 0;
        if (open) useStore.getState().openBuilding(open);
      } else if (s.stuckFor > 1.1) {
        // Blocked by a building or wall: back out and try again from a different angle, twice, then give up.
        s.stuckFor = 0;
        if (autoDrive.retries >= 2) {
          autoDrive.active = false;
          autoDrive.openId = null;
          useStore.getState().showToast("The car could not get there. Tap a spot on the road instead.");
        } else {
          autoDrive.retries++;
          s.backFor = 0.9;
          s.detour = autoDrive.retries === 1 ? 0.9 : -0.9;
          s.detourUntil = now + 2800;
        }
      } else if (s.backFor <= 0) {
        let diff = Math.atan2(dx, dz) + (now < s.detourUntil ? s.detour : 0) - s.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        steerIn = THREE.MathUtils.clamp(diff * 2.2, -1, 1);
        // Calm pace: slower in sharp turns and when arriving.
        throttle = Math.abs(diff) > 1.6 ? 0.45 : dist < 10 ? 0.5 : 0.85;
      }
    }
    const boosting = input.boost && throttle > 0;
    const top = (boosting ? BOOST_SPEED : MAX_SPEED) * CAR_HANDLING[era.current];

    // 3. Speed: accelerate, brake, reverse, coast. If something blocks the car, its speed follows reality.
    const lv = b.linvel();
    const actual = lv.x * Math.sin(s.heading) + lv.z * Math.cos(s.heading);
    if (!t && Math.abs(actual) < Math.abs(s.speed) - 1.5) s.speed = actual + Math.sign(s.speed) * 1.5;

    if (input.brake) s.speed = approach(s.speed, 0, BRAKE * dt);
    else if (throttle > 0) {
      s.speed =
        s.speed < 0
          ? approach(s.speed, 0, BRAKE * dt)
          : approach(s.speed, top * throttle, (boosting ? BOOST_ACCEL : ACCEL) * dt);
    } else if (throttle < 0) {
      s.speed =
        s.speed > 0.3
          ? approach(s.speed, 0, BRAKE * dt)
          : approach(s.speed, REVERSE_SPEED * throttle, ACCEL * 0.7 * dt);
    } else s.speed = approach(s.speed, 0, COAST * dt);

    // 4. Steering: eased, scaled by speed, reversed when backing up (like a real car).
    s.steer += (steerIn - s.steer) * (1 - Math.exp(-dt * 8));
    const grip = THREE.MathUtils.clamp(Math.abs(s.speed) / 4, 0, 1);
    const yawRate = s.steer * STEER_RATE * grip * (s.speed < 0 ? -1 : 1);
    s.heading += yawRate * dt;

    vel.x = Math.sin(s.heading) * s.speed;
    vel.y = lv.y;
    vel.z = Math.cos(s.heading) * s.speed;
    b.setLinvel(vel, true);
    b.setRotation(quat.setFromAxisAngle(up, s.heading), true);
    b.setAngvel(ZERO, true);

    // 5. Visual lean and wheel spin: leans back on throttle, into turns, and bobs a little at speed.
    const accel = (s.speed - s.prevSpeed) / Math.max(dt, 1e-3);
    s.prevSpeed = s.speed;
    const ease = 1 - Math.exp(-dt * 6);
    s.pitch += (THREE.MathUtils.clamp(-accel * 0.006, -0.08, 0.08) - s.pitch) * ease;
    s.roll += (THREE.MathUtils.clamp(-yawRate * s.speed * 0.006, -0.1, 0.1) - s.roll) * ease;
    const v = visual.current;
    if (v) {
      v.rotation.set(s.pitch, 0, s.roll);
      v.position.y = motion.reduced
        ? 0.1
        : 0.1 + Math.sin(frame.clock.elapsedTime * 9) * 0.012 * Math.min(Math.abs(s.speed), 8);
    }

    // 6. Publish to the transient channel.
    const p = b.translation();
    player.x = p.x;
    player.y = p.y;
    player.z = p.z;
    player.heading = s.heading;
    player.speed = Math.abs(s.speed);
    player.pitch = player.bank = 0;
    // Physics steps at 60 Hz; on a faster screen the raw position moves in jerks. The body's own object is
    // drawn between steps, so the first-person camera follows that instead.
    const drawn = visual.current?.parent;
    if (drawn) {
      drawn.getWorldPosition(view);
      player.viewX = view.x;
      player.viewY = view.y;
      player.viewZ = view.z;
    }
    // First frame: tell the camera to snap to the car instead of easing in from elsewhere.
    if (!player.ready) player.teleports++;
    player.ready = true;

    // 7. Take-off: past the open end of this island's runway, the car becomes a plane.
    const rw = world.runways[nearestEra(world, p.x, p.z)];
    const rx = p.x - rw.start[0];
    const rz = p.z - rw.start[1];
    const along = rx * rw.dir[0] + rz * rw.dir[1];
    const lateral = Math.abs(rx * rw.dir[1] - rz * rw.dir[0]);
    if (along > rw.length - 0.5 && lateral < rw.width / 2 + 3) {
      b.setBodyType(KINEMATIC, true);
      player.flying = true;
      autoDrive.active = false;
      fly.current.speed = Math.max(Math.abs(s.speed), 14);
      fly.current.pitch = 0.3;
      fly.current.swap = 0;
      useStore.getState().setFlying(true);
      useStore
        .getState()
        .showToast(
          "You're flying! Climb with W or ▲, dive with S or ▼, turn with A D or ◀ ▶. Press L or Land to come down.",
        );
      return;
    }

    // 8. Safety: fell off or left the world -> nearest island's spawn.
    const bounds = world.bounds;
    if (p.y < FALL_Y || p.x < bounds.minX || p.x > bounds.maxX || p.z < bounds.minZ || p.z > bounds.maxZ) {
      requestTeleport(world.islands[nearestEra(world, p.x, p.z)].spawn);
    }

    // 9. Remember the position every 2 s (sessionStorage) so a reload resumes here.
    if (frame.clock.elapsedTime - s.lastSave > 2) {
      s.lastSave = frame.clock.elapsedTime;
      savePosition();
    }
  });

  return (
    <RigidBody
      ref={body}
      name="player"
      userData={{ player: true }}
      colliders={false}
      position={[start.x, start.y + 0.3, start.z]}
      rotation={[0, start.heading, 0]}
      enabledRotations={[false, true, false]}
      canSleep={false}
      ccd
      linearDamping={0}
      angularDamping={0}
    >
      {/* One box from just above the ground; friction 0 so the car slides along walls instead of sticking */}
      <CuboidCollider args={[BODY.halfW, 0.45, BODY.halfL]} position={[0, 0.05, 0]} friction={0} restitution={0} />
      <group ref={visual} position-y={0.1}>
        <group ref={carGroup}>
          <EraCar initialEra={initialEra} speedRef={state} />
        </group>
        <group ref={planeGroup} visible={false}>
          <EraPlane />
        </group>
      </group>
    </RigidBody>
  );
}

function approach(value: number, target: number, step: number) {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}
