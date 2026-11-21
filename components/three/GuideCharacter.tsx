"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { useStore } from "@/lib/store";
import type { Vec3 } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { ERA_PALETTE, SHARED } from "@/lib/three/palette";
import { ProximitySensor } from "./BuildingSensor";
import { StaticMerge } from "./kit/StaticMerge";

/** Emissive intensity shared by the visor, the antenna tip and the beacon (one merge bucket). */
const GLOW = 0.8;
/** The robot is drawn larger than life so it reads from the road (about 4.7 m to the antenna tip). */
const SCALE = 1.5;

/**
 * SHARED. The chatbot guide on The Future (docs/VISION.md): a friendly low-poly robot with a glowing visor.
 * It is not a real person and has no human face. Driving close shows "Press E / Tap to talk"; the HUD then
 * dispatches window "open-chat", which opens the site-wide chat panel (components/ai/ChatLauncher).
 * A lime diamond beacon floats above it (it bobs with the body; still under reduced motion), so the guide is
 * easy to spot from a distance. Small prop: no shadows (no shadow-pass call).
 */
export function GuideCharacter({
  position,
  rotationY,
  sensorRadius,
}: {
  position: Vec3;
  rotationY: number;
  sensorRadius: number;
}) {
  const near = useStore((s) => s.nearGuide);
  const body = useRef<THREE.Group>(null);
  const accent = ERA_PALETTE["era-3"].accent;

  useFrame((state) => {
    const g = body.current;
    if (!g) return;
    if (motion.reduced) {
      // Reduced motion: hover still, facing the road.
      g.position.y = 0.35;
      g.rotation.y = 0;
      return;
    }
    const t = state.clock.elapsedTime;
    g.position.y = 0.35 + Math.sin(t * 2) * 0.15;
    g.rotation.y = near ? Math.sin(t * 3) * 0.25 : Math.sin(t * 0.6) * 0.4;
  });

  return (
    <>
      <group position={position} rotation-y={rotationY}>
        {/* Soft pad it hovers over */}
        <mesh position-y={0.04} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.5 * SCALE, 24]} />
          <meshBasicMaterial color={accent} transparent opacity={near ? 0.55 : 0.25} />
        </mesh>
        <group ref={body}>
          <StaticMerge>
            <group scale={SCALE}>
              <mesh position-y={1.2}>
                <capsuleGeometry args={[0.7, 0.8, 4, 12]} />
                <meshLambertMaterial color={SHARED.snow} />
              </mesh>
              {/* Visor (no face, just a glowing screen) */}
              {/* The visor, the antenna tip and the beacon share one emissive colour and intensity, so the merge bakes them
                into a single glow bucket: the robot is 2 draw calls (body + glow), plus the pad. */}
              <mesh position={[0, 1.55, 0.55]}>
                <boxGeometry args={[0.9, 0.35, 0.3]} />
                <meshLambertMaterial color={SHARED.ink} emissive={accent} emissiveIntensity={GLOW} />
              </mesh>
              <mesh position={[0, 2.55, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
                <meshLambertMaterial color={SHARED.ink} />
              </mesh>
              <mesh position={[0, 2.85, 0]}>
                <sphereGeometry args={[0.14, 8, 6]} />
                <meshLambertMaterial color={accent} emissive={accent} emissiveIntensity={GLOW} />
              </mesh>
              {/* Beacon: a floating diamond, same glow bucket */}
              <mesh position={[0, 3.75, 0]} scale={[0.42, 0.62, 0.42]}>
                <octahedronGeometry args={[1, 0]} />
                <meshLambertMaterial color={accent} emissive={accent} emissiveIntensity={GLOW} />
              </mesh>
            </group>
          </StaticMerge>
        </group>
      </group>
      <ProximitySensor
        position={position}
        radius={sensorRadius}
        onEnter={() => useStore.getState().setNearGuide(true)}
        onLeave={() => useStore.getState().setNearGuide(false)}
      />
    </>
  );
}
