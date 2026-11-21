"use client";

import { CAMPUS } from "./palette";
import { Box, Cyl, type V3 } from "./parts";

/**
 * Campus grounds in the campus frame (+Z = entrance, towards the camera; -Z = Main Building):
 * a lawn disc with a cream kerb ring, the forecourt, two walks down the mall, a long reflecting pool with three
 * fountain basins, bougainvillea beds, benches, lamps, date palms, the entrance plaza and the expert spot.
 * All static: merged by the parent <StaticMerge>.
 */

/** Shared positions (also used for colliders and the fountain jets). */
export const GROUNDS = {
  mainZ: -12.2,
  hallX: 12.3,
  hallZ: [-1.2, 8.0] as const,
  pool: { z: 4.6, length: 15, width: 3.8 },
  fountainZ: [0.5, 4.6, 8.7] as const,
  sign: { z: 16.2 },
  expert: { x: 6.7, z: -5.7 },
} as const;

const Y = { lawn: 0.03, path: 0.05 } as const;

function Flat({ size, position, color }: { size: [number, number]; position: [number, number]; color: string }) {
  return (
    <mesh position={[position[0], Y.path, position[1]]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={size} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

export function Grounds({ radius, hi, accent }: { radius: number; hi: boolean; accent: string }) {
  const { paving, kerb, lawn, plinth, water, flower, metal, wood } = CAMPUS;
  const { pool } = GROUNDS;
  const lamps: number[] = hi ? [-1.5, 4.6, 10.7] : [-1.5, 10.7];
  return (
    <group>
      {/* Lawn and kerb */}
      <mesh position-y={Y.lawn} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[radius - 0.5, hi ? 48 : 32]} />
        <meshLambertMaterial color={lawn} />
      </mesh>
      <mesh position-y={Y.path} rotation-x={-Math.PI / 2} receiveShadow>
        <ringGeometry args={[radius - 0.6, radius, hi ? 48 : 32]} />
        <meshLambertMaterial color={kerb} />
      </mesh>

      {/* Paving: forecourt, mall walks, spurs to the halls, entrance plaza */}
      <Flat size={[25, 3.4]} position={[0, -5.9]} color={paving} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Flat size={[2, 17.6]} position={[s * 5.2, 4.4]} color={paving} />
          {GROUNDS.hallZ.map((z) => (
            <Flat key={z} size={[2.4, 2.2]} position={[s * 7.3, z]} color={paving} />
          ))}
        </group>
      ))}
      <Flat size={[17, 7.2]} position={[0, 15.8]} color={paving} />

      {/* Reflecting pool with three fountain basins (jets: FountainJets, outside the merge) */}
      <Box size={[pool.width, 0.3, pool.length]} position={[0, 0.15, pool.z]} color={plinth} shade="flat" />
      <Box size={[pool.width - 0.6, 0.06, pool.length - 0.6]} position={[0, 0.31, pool.z]} color={water} shade="flat" />
      {GROUNDS.fountainZ.map((z) => (
        <group key={z} position-z={z}>
          <Cyl r={1.05} h={0.5} position={[0, 0.25, 0]} color={plinth} segments={hi ? 12 : 8} shade="flat" />
          <Cyl r={0.82} h={0.06} position={[0, 0.51, 0]} color={water} segments={hi ? 12 : 8} shade="flat" />
        </group>
      ))}

      {/* Bougainvillea beds beside the pool and at the plaza */}
      {[-1, 1].map((s) => (
        <group key={s}>
          {[2.55, 6.65].map((z) => (
            <Box key={z} size={[0.7, 0.35, 3.0]} position={[s * 2.6, 0.175, z]} color={flower} shade="flat" />
          ))}
          <Box size={[0.8, 0.35, 4.2]} position={[s * 9.2, 0.175, 16.2]} color={flower} shade="flat" />
        </group>
      ))}

      {/* Benches facing the pool */}
      {hi &&
        [-1, 1].map((s) =>
          [2.55, 6.65].map((z) => <Bench key={`${s}${z}`} position={[s * 4.55, 0, z]} side={s} color={wood} />),
        )}

      {/* Lamps along the walks (glowing heads in the era accent) */}
      {[-1, 1].map((s) =>
        lamps.map((z) => (
          <group key={`${s}${z}`} position={[s * 6.0, 0, z]}>
            <Cyl r={0.06} h={2.8} position={[0, 1.4, 0]} color={metal} segments={5} shade="flat" />
            <Box size={[0.3, 0.3, 0.3]} position={[0, 2.95, 0]} color={accent} shade="glow" />
            <Box size={[0.42, 0.08, 0.42]} position={[0, 3.14, 0]} color={metal} shade="flat" />
          </group>
        )),
      )}

      {/* Date palms */}
      {(hi ? PALMS : PALMS.slice(0, 8)).map((p, i) => (
        <Palm key={i} position={[p[0], 0, p[1]]} scale={p[2]} lean={p[3]} fronds={hi ? 7 : 5} />
      ))}

      <ExpertSpot position={[GROUNDS.expert.x, 0, GROUNDS.expert.z]} accent={accent} />
    </group>
  );
}

/** x, z, scale, lean (radians, about the palm's own x axis after a yaw from the index). */
const PALMS: [number, number, number, number][] = [
  // Along the mall (kept on Low)
  [-7.0, -2.9, 1.0, 0.05],
  [7.0, -2.9, 1.0, -0.05],
  [-7.0, 2.1, 0.92, 0.07],
  [7.0, 2.1, 0.95, 0.04],
  [-7.0, 5.3, 1.05, -0.04],
  [7.0, 5.3, 1.0, 0.06],
  [-7.0, 10.3, 0.95, 0.05],
  [7.0, 10.3, 1.02, -0.06],
  // Plaza, between the halls and beside the Main Building (High only)
  [-9.6, 13.4, 1.1, 0.08],
  [9.6, 13.4, 1.08, -0.08],
  [-17.4, 3.5, 0.95, 0.1],
  [17.4, 3.5, 0.9, -0.1],
  [-15.0, -9.6, 1.05, 0.06],
  [15.0, -9.6, 1.0, -0.06],
  [-12.6, 14.4, 0.9, 0.05],
  [12.6, 14.4, 0.92, -0.05],
];

function Palm({ position, scale, lean, fronds }: { position: V3; scale: number; lean: number; fronds: number }) {
  const { palmTrunk, palmLeaf, palmLeafLight } = CAMPUS;
  const h = 4.1;
  return (
    <group position={position} scale={scale} rotation={[lean, position[0] * 0.7, lean * 0.6]}>
      <Cyl r={[0.13, 0.21]} h={h} position={[0, h / 2, 0]} color={palmTrunk} segments={5} open />
      <group position-y={h}>
        {Array.from({ length: fronds }, (_, i) => (
          <group key={i} rotation-y={(i / fronds) * Math.PI * 2}>
            <group rotation-x={i % 2 ? 0.42 : 0.26}>
              <Box size={[0.5, 0.06, 2.1]} position={[0, 0, 1.0]} color={i % 2 ? palmLeaf : palmLeafLight} />
            </group>
          </group>
        ))}
        <Box size={[0.42, 0.34, 0.42]} position={[0, -0.12, 0]} color={palmTrunk} />
      </group>
    </group>
  );
}

function Bench({ position, side, color }: { position: V3; side: number; color: string }) {
  // Faces the pool: the back rest is on the walk side (away from x = 0).
  return (
    <group position={position}>
      <Box size={[0.48, 0.08, 1.4]} position={[0, 0.45, 0]} color={color} shade="flat" />
      <Box size={[0.07, 0.42, 1.4]} position={[side * 0.22, 0.72, 0]} color={color} shade="flat" />
      <Box size={[0.42, 0.42, 0.08]} position={[0, 0.21, 0.6]} color={CAMPUS.metal} shade="flat" />
      <Box size={[0.42, 0.42, 0.08]} position={[0, 0.21, -0.6]} color={CAMPUS.metal} shade="flat" />
    </group>
  );
}

/**
 * Reserved spot for the local expert (Professor Aqeel is represented elsewhere by a faceless figure; this is
 * only a marked pad with a blank plaque, so no name or claim is shown here). A small round pad, a thin glowing
 * ring, and a sloped blank plaque on a stone lectern.
 */
function ExpertSpot({ position, accent }: { position: V3; accent: string }) {
  return (
    <group position={position}>
      <Cyl r={1.4} h={0.12} position={[0, 0.06, 0]} color={CAMPUS.plinth} segments={12} shade="flat" />
      <Cyl r={1.46} h={0.05} position={[0, 0.1, 0]} color={accent} segments={12} open shade="glow" />
      <Box size={[0.9, 0.85, 0.35]} position={[0, 0.12 + 0.425, -0.75]} color={CAMPUS.stone} shade="flat" />
      <Box
        size={[0.8, 0.5, 0.05]}
        position={[0, 0.12 + 0.85 + 0.12, -0.62]}
        rotation={[-0.6, 0, 0]}
        color={CAMPUS.kerb}
        shade="flat"
      />
    </group>
  );
}
