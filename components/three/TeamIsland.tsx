"use client";

import { useMemo } from "react";
import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { PlacedStatue, TeamIsland as TeamIslandLayout } from "@/lib/three/layout";
import { ERA_PALETTE, SHARED, STATUE_ACCENTS } from "@/lib/three/palette";
import { SignSensor } from "./BuildingSensor";
import { StaticMerge } from "./kit/StaticMerge";
import { TextPanel } from "./kit/TextPanel";

/**
 * SHARED. The tiny team island north of The Jobs Era: one seated statue per group member (content/site.ts), each
 * with a symbol of that member's essay. Stone, faceless, generic bodies: nobody is a likeness (CLAUDE.md). Driving
 * close shows the name and essay in the HUD. Everything static: a few merged draw calls.
 */
const SLAB = 5;

export function TeamIsland({ team }: { team: TeamIslandLayout }) {
  const { center, radius } = team;
  const pal = ERA_PALETTE["era-2"];
  const soil = useMemo(() => `#${new THREE.Color(pal.ground).multiplyScalar(0.62).getHexString()}`, [pal.ground]);
  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CylinderCollider args={[SLAB / 2, radius]} position={[center[0], -SLAB / 2, center[1]]} />
        {team.edgeWalls.map((w, i) => (
          <CuboidCollider
            key={i}
            args={[0.3, 0.9, w.length / 2]}
            position={w.position}
            rotation={[0, w.rotationY, 0]}
          />
        ))}
      </RigidBody>
      <group position={[center[0], 0, center[1]]}>
        <StaticMerge>
          <mesh position={[0, -0.5, 0]} receiveShadow>
            <cylinderGeometry args={[radius, radius * 0.98, 1, 40, 1, true]} />
            <meshLambertMaterial color={soil} />
          </mesh>
          <mesh position={[0, -3.5, 0]} receiveShadow>
            <cylinderGeometry args={[radius * 0.98, radius * 0.5, 5, 40, 1, true]} />
            <meshLambertMaterial color={pal.cliff} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <circleGeometry args={[radius, 48]} />
            <meshLambertMaterial color={pal.ground} />
          </mesh>
          {/* Cream plaza, with a path to the bridge (the team island lies due north: the bridge is at +Z) */}
          <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
            <circleGeometry args={[radius * 0.76, 40]} />
            <meshLambertMaterial color={pal.road} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.021, radius * 0.85]} receiveShadow>
            <planeGeometry args={[7, radius * 0.4]} />
            <meshLambertMaterial color={pal.road} />
          </mesh>
          {TREES.map(([a, r, s], i) => (
            <group key={i} position={[Math.cos(a) * radius * r, 0, Math.sin(a) * radius * r]} scale={s}>
              <mesh position={[0, 0.8, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.26, 1.6, 5]} />
                <meshLambertMaterial color={SHARED.trunk} />
              </mesh>
              <mesh position={[0, 2.5, 0]} castShadow>
                <icosahedronGeometry args={[1.2, 0]} />
                <meshLambertMaterial color={i % 2 ? SHARED.leafDeep : pal.accent} flatShading />
              </mesh>
            </group>
          ))}
        </StaticMerge>
      </group>
      {team.statues.map((s, i) => (
        <Statue key={s.id} placed={s} accent={STATUE_ACCENTS[i % STATUE_ACCENTS.length]!} />
      ))}
    </>
  );
}

/** Angle, distance (of the radius) and scale: along the rim, never by the bridge (+Z). */
const TREES: [number, number, number][] = [
  [Math.PI * 1.1, 0.88, 1],
  [Math.PI * 1.28, 0.9, 0.8],
  [Math.PI * 1.5, 0.88, 1.15],
  [Math.PI * 1.72, 0.9, 0.85],
  [Math.PI * 1.9, 0.88, 1],
  [Math.PI * 0.12, 0.89, 0.75],
  [Math.PI * 0.88, 0.89, 0.8],
];

/** Seated faceless figure on a plinth with a name plate. Local +Z is the front. */
function Statue({ placed, accent }: { placed: PlacedStatue; accent: string }) {
  const stone = SHARED.statue;
  const shade = SHARED.statueShade;
  return (
    <>
      <group position={placed.position} rotation-y={placed.rotationY}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[1.7, 2, 1.5]} position={[0, 2, 0]} />
        </RigidBody>
        <StaticMerge>
          {/* Plinth */}
          <mesh position={[0, 0.2, 0]} receiveShadow>
            <boxGeometry args={[3.8, 0.4, 3.4]} />
            <meshLambertMaterial color={shade} />
          </mesh>
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.3, 1.3, 2.9]} />
            <meshLambertMaterial color={SHARED.cream} />
          </mesh>
          <mesh position={[0, 1.7, 0]} receiveShadow>
            <boxGeometry args={[3.5, 0.14, 3.1]} />
            <meshLambertMaterial color={accent} />
          </mesh>
          <group position={[-0.5, 1.77, -0.25]} scale={1.2}>
            {/* Stone armchair: seat, back and sides, so the figure clearly sits */}
            <mesh position={[0, 0.32, -0.05]} castShadow>
              <boxGeometry args={[1.5, 0.64, 1.1]} />
              <meshLambertMaterial color={shade} />
            </mesh>
            <mesh position={[0, 1.05, -0.7]} castShadow>
              <boxGeometry args={[1.7, 2.1, 0.3]} />
              <meshLambertMaterial color={shade} />
            </mesh>
            {[-0.74, 0.74].map((x) => (
              <mesh key={x} position={[x, 0.62, -0.05]} castShadow>
                <boxGeometry args={[0.24, 1.24, 1.1]} />
                <meshLambertMaterial color={shade} />
              </mesh>
            ))}
            {/* Thighs and shins */}
            {[-0.24, 0.24].map((x) => (
              <group key={x}>
                <mesh position={[x, 0.8, 0.42]} castShadow>
                  <boxGeometry args={[0.36, 0.34, 1.15]} />
                  <meshLambertMaterial color={stone} />
                </mesh>
                <mesh position={[x, 0.34, 0.86]}>
                  <boxGeometry args={[0.3, 0.68, 0.28]} />
                  <meshLambertMaterial color={stone} />
                </mesh>
                <mesh position={[x, 0.07, 1]}>
                  <boxGeometry args={[0.3, 0.14, 0.5]} />
                  <meshLambertMaterial color={stone} />
                </mesh>
              </group>
            ))}
            {/* Torso and a plain head: no face on purpose */}
            <mesh position={[0, 1.4, -0.2]} castShadow>
              <cylinderGeometry args={[0.44, 0.38, 1.1, 8]} />
              <meshLambertMaterial color={stone} flatShading />
            </mesh>
            <mesh position={[0, 2.3, -0.16]} castShadow>
              <icosahedronGeometry args={[0.4, 1]} />
              <meshLambertMaterial color={stone} flatShading />
            </mesh>
            {/* Arms: one on the knee, one reaching to the symbol beside the seat */}
            <mesh position={[-0.52, 1.3, 0.15]} rotation-x={-1.1}>
              <boxGeometry args={[0.2, 0.95, 0.22]} />
              <meshLambertMaterial color={stone} />
            </mesh>
            <mesh position={[0.6, 1.36, 0.15]} rotation={[-0.9, 0, 0.35]}>
              <boxGeometry args={[0.2, 0.95, 0.22]} />
              <meshLambertMaterial color={stone} />
            </mesh>
          </group>
          <group position={[1, 1.77, 0.55]}>
            <Symbol kind={placed.symbol} accent={accent} />
          </group>
        </StaticMerge>
        <TextPanel
          position={[0, 1, 1.46]}
          width={3}
          height={0.95}
          draw={(ctx, w, h, fonts) => {
            ctx.fillStyle = SHARED.ink;
            ctx.fillRect(0, 0, w, h);
            let size = h * 0.5;
            ctx.font = `700 ${size}px ${fonts.display}`;
            const tw = ctx.measureText(placed.name).width;
            if (tw > w * 0.9) size *= (w * 0.9) / tw;
            ctx.font = `700 ${size}px ${fonts.display}`;
            ctx.fillStyle = SHARED.snow;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(placed.name, w / 2, h * 0.54);
          }}
        />
      </group>
      <SignSensor id={placed.id} position={placed.position} radius={5} />
    </>
  );
}

/** What the member's essay is about, as one simple object. */
function Symbol({ kind, accent }: { kind: PlacedStatue["symbol"]; accent: string }) {
  const stone = SHARED.statue;
  const dark = SHARED.figureDark;
  switch (kind) {
    // Correcting AI: a big stop button on a stand.
    case "stop-button":
      return (
        <group>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.42, 1, 8]} />
            <meshLambertMaterial color={stone} flatShading />
          </mesh>
          <mesh position={[0, 1.06, 0]}>
            <cylinderGeometry args={[0.52, 0.52, 0.14, 12]} />
            <meshLambertMaterial color={dark} />
          </mesh>
          <mesh position={[0, 1.24, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.4, 0.26, 12]} />
            <meshLambertMaterial color={SHARED.car} emissive={SHARED.car} emissiveIntensity={0.25} />
          </mesh>
        </group>
      );
    // AI's potential: a light bulb.
    case "light-bulb":
      return (
        <group>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.28, 0.22, 0.64, 8]} />
            <meshLambertMaterial color={dark} />
          </mesh>
          <mesh position={[0, 1.15, 0]} castShadow>
            <icosahedronGeometry args={[0.62, 1]} />
            <meshLambertMaterial color={SHARED.sun} emissive={SHARED.sun} emissiveIntensity={0.5} flatShading />
          </mesh>
        </group>
      );
    // Out of control or badly trained: a small robot learning at the statue's side.
    case "robot":
      return (
        <group rotation-y={-0.5}>
          {[-0.2, 0.2].map((x) => (
            <mesh key={x} position={[x, 0.16, 0]}>
              <boxGeometry args={[0.22, 0.32, 0.34]} />
              <meshLambertMaterial color={dark} />
            </mesh>
          ))}
          <mesh position={[0, 0.68, 0]} castShadow>
            <boxGeometry args={[0.8, 0.74, 0.58]} />
            <meshLambertMaterial color={stone} />
          </mesh>
          <mesh position={[0, 1.34, 0]} castShadow>
            <boxGeometry args={[0.66, 0.5, 0.54]} />
            <meshLambertMaterial color={stone} />
          </mesh>
          <mesh position={[0, 1.36, 0.28]}>
            <boxGeometry args={[0.48, 0.16, 0.04]} />
            <meshLambertMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 1.75, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.34, 5]} />
            <meshLambertMaterial color={dark} />
          </mesh>
          <mesh position={[0, 1.96, 0]}>
            <icosahedronGeometry args={[0.09, 0]} />
            <meshLambertMaterial color={accent} />
          </mesh>
        </group>
      );
    default:
      return (
        <group position={[0, 0.5, 0]} rotation-y={-0.4}>
          {[0, 0.2, 0.4].map((y, i) => (
            <mesh key={y} position={[0, y - 0.4, 0]} rotation-y={i * 0.25} castShadow>
              <boxGeometry args={[0.8, 0.18, 0.6]} />
              <meshLambertMaterial color={i === 1 ? accent : stone} />
            </mesh>
          ))}
        </group>
      );
  }
}
