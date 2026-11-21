"use client";

import { CAMPUS } from "./palette";
import { ArchRow, Box, Cyl, Dome } from "./parts";

/**
 * One of the academic buildings lining the mall. AUS's college buildings are square, symmetrical blocks with
 * the same face on every side and a small dome on top, each standing in its own lawn: a stone cube on a
 * plinth, a projecting arched portico in the middle of each face, arched windows either side, and a dome on a
 * short drum. The back face (never seen from the camera) is left plain.
 * Local frame: origin at the footprint centre on the ground. HALL_HALF is the collider half size.
 */
export const HALL_HALF = { x: 3.7, z: 3.7, height: 2.5 } as const;

const SIZE = 6.4;
const H = 4.2;
const PL = 0.4;

export function AcademicHall({ hi, tone }: { hi: boolean; tone: string }) {
  const { stone, recess, dome, plinth } = CAMPUS;
  const half = SIZE / 2;
  // Faces with a portico: front (+Z) and both sides (one of them looks onto the mall).
  const faces: { key: string; ry: number }[] = [
    { key: "front", ry: 0 },
    { key: "right", ry: Math.PI / 2 },
    { key: "left", ry: -Math.PI / 2 },
  ];
  return (
    <group>
      <Box size={[SIZE + 0.8, PL, SIZE + 0.8]} position={[0, PL / 2, 0]} color={plinth} />
      <Box size={[SIZE, H, SIZE]} position={[0, PL + H / 2, 0]} color={tone} />
      <Box size={[SIZE + 0.4, 0.3, SIZE + 0.4]} position={[0, PL + H + 0.15, 0]} color={stone} />

      {faces.map((f) => (
        <group key={f.key} rotation-y={f.ry}>
          {/* Portico */}
          <Box size={[2.6, H + 0.6, 0.5]} position={[0, PL + (H + 0.6) / 2, half + 0.25]} color={stone} />
          <ArchRow count={1} width={1.5} spring={2.4} spacing={0} position={[0, PL, half + 0.51]} color={recess} />
          {/* Arched windows either side */}
          {[-1, 1].map((s) => (
            <ArchRow
              key={s}
              count={hi ? 2 : 1}
              width={0.62}
              spring={1.5}
              spacing={1.0}
              position={[s * (hi ? 2.3 : 2.4), PL + 0.7, half + 0.01]}
              color={recess}
            />
          ))}
        </group>
      ))}

      {/* Drum and dome */}
      <Cyl r={1.55} h={0.7} position={[0, PL + H + 0.3 + 0.35, 0]} color={stone} segments={hi ? 12 : 8} open />
      <Dome
        r={1.65}
        position={[0, PL + H + 0.3 + 0.7, 0]}
        color={dome}
        segments={hi ? 12 : 8}
        rings={hi ? 5 : 3}
        rise={1.12}
      />
    </group>
  );
}
