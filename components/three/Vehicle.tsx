"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { FALL_Y, nearestEra, type Pose, type WorldLayout } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { useStore } from "@/lib/store";
import type { EraId } from "@/lib/content/schema";
import { CAR_HANDLING, EraCar } from "./car/EraCar";
import {
  attachKeyboard,
  autoDrive,
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
 */

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

export function Vehicle({ world, start }: { world: WorldLayout; start: Pose }) {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const [initialEra] = useState<EraId>(() => nearestEra(world, start.x, start.z));
  const era = useRef<EraId>(initialEra);
  const state = useRef({
    speed: 0,
    heading: start.heading,
    steer: 0,
    pitch: 0,
    roll: 0,
    lastSave: 0,
    prevSpeed: 0,
    stuckFor: 0,
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
      // Stuck (blocked by a building or wall) for 2.5 s: give up rather than push forever.
      s.stuckFor = Math.abs(s.speed) < 1.2 ? s.stuckFor + dt : 0;
      if (dist < 2.5 || s.stuckFor > 2.5) {
        autoDrive.active = false;
        s.stuckFor = 0;
      } else {
        let diff = Math.atan2(dx, dz) - s.heading;
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
    // First frame: tell the camera to snap to the car instead of easing in from elsewhere.
    if (!player.ready) player.teleports++;
    player.ready = true;

    // 7. Safety: fell off or left the world -> nearest island's spawn.
    const bounds = world.bounds;
    if (p.y < FALL_Y || p.x < bounds.minX || p.x > bounds.maxX || p.z < bounds.minZ || p.z > bounds.maxZ) {
      requestTeleport(world.islands[nearestEra(world, p.x, p.z)].spawn);
    }

    // 8. Remember the position every 2 s (sessionStorage) so a reload resumes here.
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
        <EraCar initialEra={initialEra} speedRef={state} />
      </group>
    </RigidBody>
  );
}

function approach(value: number, target: number, step: number) {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}
