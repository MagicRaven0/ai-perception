"use client";

import { CAMPUS } from "./palette";
import { ArchRow, Box, Cyl, Dome } from "./parts";

/**
 * The AUS Main Building, simplified: a long symmetrical block on a plinth, a two-storey arcade of pointed
 * arches across the front, a tall central portal (iwan), a raised central dome on an octagonal drum, and four
 * corner pavilions with small domes. Sand-cream stone, pale dome, deep-shaded arches.
 * Local frame: origin at the footprint centre on the ground, the facade faces +Z.
 *
 * Footprint (for the collider): MAIN_HALF = half extents x / z including pavilions and portal.
 */
export const MAIN_HALF = { x: 12, z: 5.3, height: 6.9 } as const;

const PLINTH = 0.5;
const BODY_H = 4.6;
const TOP = PLINTH + BODY_H; // 5.1: top of the main walls
const FRONT = 4.0; // front face of the main body
/** Where the lantern sits on the main dome (just under its apex). */
const LANTERN = TOP + 2.95 + 3.5;

export function MainBuilding({ hi, accent }: { hi: boolean; accent: string }) {
  const { stone, stoneShade, recess, dome, plinth } = CAMPUS;
  return (
    <group>
      {/* Plinth and main mass */}
      <Box size={[24, PLINTH, 10.4]} position={[0, PLINTH / 2, 0]} color={plinth} />
      <Box size={[20.4, BODY_H, 8]} position={[0, PLINTH + BODY_H / 2, 0]} color={stoneShade} />
      {/* Arcade screen across the front (lighter stone in front of the shaded wall) */}
      <Box size={[20.4, BODY_H, 0.4]} position={[0, PLINTH + BODY_H / 2, FRONT + 0.2]} color={stone} />
      <Box size={[21, 0.35, 8.9]} position={[0, TOP + 0.175, 0.2]} color={stone} />

      {/* Lower arcade: 4 tall arches each side of the portal; upper loggia of small arches (High) */}
      {[-1, 1].map((s) => (
        <group key={s} position-x={s * 5.78}>
          <ArchRow
            count={4}
            width={0.95}
            spring={2.0}
            spacing={1.32}
            position={[0, PLINTH + 0.15, FRONT + 0.42]}
            color={recess}
          />
          {hi && (
            <ArchRow
              count={4}
              width={0.66}
              spring={0.55}
              spacing={1.32}
              position={[0, PLINTH + 3.35, FRONT + 0.42]}
              color={recess}
            />
          )}
        </group>
      ))}

      {/* Parapet merlons along the front (High) */}
      {hi &&
        Array.from({ length: 21 }, (_, i) => (
          <Box key={i} size={[0.42, 0.42, 0.3]} position={[-10 + i, TOP + 0.35 + 0.21, FRONT + 0.3]} color={stone} />
        ))}

      {/* Central portal (iwan) */}
      <Box size={[6, 6.6, 1.3]} position={[0, PLINTH + 3.3, FRONT + 0.65]} color={stone} />
      <Box size={[6.5, 0.4, 1.6]} position={[0, PLINTH + 6.6 + 0.2, FRONT + 0.65]} color={plinth} />
      <ArchRow
        count={1}
        width={3.3}
        spring={3.3}
        spacing={0}
        position={[0, PLINTH, FRONT + 1.31]}
        color={recess}
        rise={2.2}
      />

      {/* Raised centre: square base, octagonal drum with windows, dome, accent finial */}
      <Box size={[7.6, 1.0, 7.6]} position={[0, TOP + 0.35 + 0.5, -0.2]} color={stone} />
      <Cyl r={3.05} h={1.4} position={[0, TOP + 1.35 + 0.7, -0.2]} color={stone} segments={16} open />
      {hi && <DrumWindows y={TOP + 1.35 + 0.25} z={-0.2} />}
      {/* Cornice ring at the foot of the dome */}
      <Cyl r={3.35} h={0.2} position={[0, TOP + 2.75 + 0.1, -0.2]} color={plinth} segments={16} />
      <Dome
        r={3.15}
        position={[0, TOP + 2.95, -0.2]}
        color={dome}
        segments={hi ? 18 : 10}
        rings={hi ? 7 : 4}
        rise={1.18}
      />
      {/* Lantern on the dome, then the finial with its accent tip */}
      <Cyl r={0.42} h={0.6} position={[0, LANTERN + 0.3, -0.2]} color={stone} segments={8} open />
      <Dome r={0.5} position={[0, LANTERN + 0.6, -0.2]} color={dome} segments={8} rings={3} />
      <Cyl r={0.06} h={0.7} position={[0, LANTERN + 1.15 + 0.35, -0.2]} color={plinth} segments={5} />
      <Cyl
        r={[0.02, 0.18]}
        h={0.45}
        position={[0, LANTERN + 1.15 + 0.7 + 0.22, -0.2]}
        color={accent}
        segments={6}
        shade="glow"
      />

      {/* Corner pavilions with small domes */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * 10.2, 0, sz * 3.4]}>
            <Box size={[3.3, 6.0, 3.3]} position={[0, PLINTH + 3.0, 0]} color={stone} />
            <Box size={[3.7, 0.3, 3.7]} position={[0, PLINTH + 6.0 + 0.15, 0]} color={plinth} />
            <Dome r={1.3} position={[0, PLINTH + 6.3, 0]} color={dome} segments={hi ? 10 : 8} rings={hi ? 4 : 3} />
            {sz > 0 && (
              <>
                <ArchRow
                  count={1}
                  width={1.4}
                  spring={2.6}
                  spacing={0}
                  position={[0, PLINTH + 0.15, 1.66]}
                  color={recess}
                />
                {hi && (
                  <ArchRow
                    count={1}
                    width={0.9}
                    spring={0.7}
                    spacing={0}
                    position={[0, PLINTH + 4.2, 1.66]}
                    color={recess}
                  />
                )}
              </>
            )}
            {/* Outer side face (seen at an angle from the camera) */}
            <ArchRow
              count={1}
              width={1.4}
              spring={2.6}
              spacing={0}
              position={[sx * 1.66, PLINTH + 0.15, 0]}
              rotation={[0, (sx * Math.PI) / 2, 0]}
              color={recess}
            />
          </group>
        )),
      )}

      {/* Side arcades on the end walls between the pavilions */}
      {[-1, 1].map((s) => (
        <ArchRow
          key={s}
          count={2}
          width={1.0}
          spring={1.9}
          spacing={1.7}
          position={[s * 10.21, PLINTH + 0.15, 0]}
          rotation={[0, (s * Math.PI) / 2, 0]}
          color={recess}
        />
      ))}
    </group>
  );
}

/** Eight small arched windows round the drum, on its flat faces (16-sided drum, every other face). */
function DrumWindows({ y, z }: { y: number; z: number }) {
  const r = 3.05 * Math.cos(Math.PI / 16) + 0.02;
  return (
    <group position={[0, y, z]}>
      {Array.from({ length: 8 }, (_, k) => {
        const a = ((4 * k + 1) * Math.PI) / 16;
        return (
          <ArchRow
            key={k}
            count={1}
            width={0.55}
            spring={0.45}
            spacing={0}
            position={[Math.sin(a) * r, 0, Math.cos(a) * r]}
            rotation={[0, a, 0]}
            color={CAMPUS.recess}
          />
        );
      })}
    </group>
  );
}
