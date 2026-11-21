"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EraId } from "@/lib/content/schema";
import { useStore } from "@/lib/store";
import { motion } from "@/lib/three/motion";
import { PLANE_COLOURS } from "@/lib/three/palette";

/**
 * What the car becomes after driving off a runway, per era (generic low-poly shapes, no real markings):
 * The Past: a 1940s propeller plane. The Jobs Era: a twin-tail jet fighter. The Future: a flying car with
 * glowing hover rotors. Changing island mid-air swaps the model with a quick "pop" (shrink, swap, grow);
 * reduced motion swaps instantly. Local +Z is forward (same as the car).
 */
export function EraPlane() {
  const past = useRef<THREE.Group>(null);
  const jobs = useRef<THREE.Group>(null);
  const future = useRef<THREE.Group>(null);
  const prop = useRef<THREE.Group>(null);
  const rotors = useRef<THREE.Group>(null);
  const state = useRef({
    shown: useStore.getState().activeEra as EraId,
    target: useStore.getState().activeEra as EraId,
    t: 1,
  });

  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.activeEra !== prev.activeEra) state.current.target = s.activeEra;
      }),
    [],
  );

  useFrame(({ clock }, dt) => {
    const s = state.current;
    if (s.target !== s.shown && s.t >= 1) s.t = 0;
    let scale = 1;
    if (s.t < 1) {
      s.t = motion.reduced ? 1 : Math.min(1, s.t + dt / 0.6);
      if (s.t >= 0.5 && s.shown !== s.target) s.shown = s.target;
      scale = motion.reduced ? 1 : Math.abs(Math.cos(Math.PI * s.t));
      if (s.t >= 1) s.shown = s.target;
    }
    const byEra: [EraId, THREE.Group | null][] = [
      ["era-1", past.current],
      ["era-2", jobs.current],
      ["era-3", future.current],
    ];
    for (const [id, g] of byEra) {
      if (!g) continue;
      g.visible = id === s.shown;
      g.scale.setScalar(Math.max(0.05, scale));
    }
    if (prop.current) prop.current.rotation.z += dt * 30;
    if (rotors.current && !motion.reduced) rotors.current.position.y = Math.sin(clock.elapsedTime * 3) * 0.06;
  });

  const c1 = PLANE_COLOURS["era-1"];
  const c2 = PLANE_COLOURS["era-2"];
  const c3 = PLANE_COLOURS["era-3"];

  return (
    // 1.7x the car: planes are seen from further away and need to read at a glance.
    <group position-y={0.6} scale={1.7}>
      {/* The Past: 1940s propeller plane */}
      <group ref={past}>
        <mesh rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.38, 0.28, 3.4, 8]} />
          <meshLambertMaterial color={c1.body} flatShading />
        </mesh>
        <mesh position={[0, -0.05, 0.35]} castShadow>
          <boxGeometry args={[5.6, 0.1, 0.9]} />
          <meshLambertMaterial color={c1.body} />
        </mesh>
        <mesh position={[0, 0.02, -1.45]}>
          <boxGeometry args={[1.9, 0.07, 0.55]} />
          <meshLambertMaterial color={c1.body} />
        </mesh>
        <mesh position={[0, 0.38, -1.45]}>
          <boxGeometry args={[0.07, 0.65, 0.55]} />
          <meshLambertMaterial color={c1.trim} />
        </mesh>
        <mesh position={[0, 0.38, 0.1]}>
          <boxGeometry args={[0.45, 0.28, 0.7]} />
          <meshLambertMaterial color={c1.glass} />
        </mesh>
        <mesh position={[0, 0, 1.72]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.2, 0.3, 0.25, 8]} />
          <meshLambertMaterial color={c1.trim} />
        </mesh>
        <group ref={prop} position={[0, 0, 1.9]}>
          <mesh>
            <boxGeometry args={[1.5, 0.12, 0.04]} />
            <meshLambertMaterial color={c1.dark} />
          </mesh>
        </group>
      </group>

      {/* The Jobs Era: twin-tail jet fighter */}
      <group ref={jobs}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.5, 3.8]} />
          <meshLambertMaterial color={c2.body} />
        </mesh>
        <mesh position={[0, 0, 2.3]} rotation-x={Math.PI / 2}>
          <coneGeometry args={[0.36, 1, 6]} />
          <meshLambertMaterial color={c2.body} flatShading />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.35, -0.05, -0.2]} rotation-y={side * 0.5} castShadow>
            <boxGeometry args={[2.2, 0.08, 1.4]} />
            <meshLambertMaterial color={c2.body} />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.42, 0.5, -1.55]} rotation-z={side * -0.35}>
            <boxGeometry args={[0.07, 0.8, 0.8]} />
            <meshLambertMaterial color={c2.trim} />
          </mesh>
        ))}
        <mesh position={[0, 0.34, 0.9]}>
          <boxGeometry args={[0.45, 0.25, 0.9]} />
          <meshLambertMaterial color={c2.glass} />
        </mesh>
        <mesh position={[0, 0, -1.95]}>
          <boxGeometry args={[0.5, 0.3, 0.1]} />
          <meshLambertMaterial color={c2.glow} emissive={c2.glow} emissiveIntensity={1} />
        </mesh>
      </group>

      {/* The Future: flying car with four glowing hover rotors */}
      <group ref={future}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.42, 3]} />
          <meshLambertMaterial color={c3.body} />
        </mesh>
        <mesh position={[0, 0.42, -0.05]}>
          <boxGeometry args={[1.3, 0.44, 1.9]} />
          <meshLambertMaterial color={c3.glass} />
        </mesh>
        <group ref={rotors}>
          {(
            [
              [1.15, 1.1],
              [-1.15, 1.1],
              [1.15, -1.1],
              [-1.15, -1.1],
            ] as const
          ).map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 0.1, z]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.45, 0.09, 6, 16]} />
              <meshLambertMaterial color={c3.glow} emissive={c3.glow} emissiveIntensity={0.9} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
