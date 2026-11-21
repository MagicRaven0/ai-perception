"use client";

import type { ReactNode } from "react";
import type { BuildingKind } from "@/lib/content/schema";
import { pick } from "@/lib/three/palette";
import { JOBS } from "@/lib/three/palettes/jobs-era";
import type { BuildingModel, BuildingModelProps } from "../../buildings/registry";
import { Box, Cyl, Extruded, RoundBox, RoundPanel, Sphere, type V3 } from "./parts";

/**
 * THE JOBS ERA building models, one per kind, passed to the shared <Building Model={...}>.
 * Human-scale design-studio architecture: white / platinum rounded-rectangle volumes (the era's friendly
 * interface shape), pink trims, big windows. Each kind keeps the recognisable cue it has on every island
 * (mic, two chairs, files, dome + dish, marquee + screen, frames, joystick + neon), restyled for 1984-2011.
 *
 * Contract (buildings/registry.tsx): faces local +Z (the road), sits on y = 0, stays inside the 10 x 10 plot,
 * main body inside the shared 7.6 x 6.8 collider box. All parts are "cast" (one shadow bucket) or glow, so a
 * merged model costs 2 calls (+1 glow) on High and 1 (+0) on Low. No text, no logos.
 */

const FRONT = 3.1; // front face of the 6.2-deep body

function Plinth() {
  return <RoundBox size={[7.5, 0.3, 6.7]} r={0.8} position={[0, 0.15, 0]} color={JOBS.creamShade} />;
}

/**
 * Studio body: rounded-rectangle block on the plinth, with a contrasting roof cap. Outer-ring buildings face the
 * island centre, so about half of them show their back or side to the camera: the back always gets a window
 * pair and a back door, and the sides (unless the model dresses them itself) a window each.
 */
function Body({ h, wall, roof, sides = true }: { h: number; wall: string; roof: string; sides?: boolean }) {
  return (
    <>
      <Plinth />
      <RoundBox size={[7.1, h, 6.2]} r={0.7} position={[0, 0.3 + h / 2, 0]} color={wall} />
      <RoundBox size={[7.4, 0.32, 6.5]} r={0.8} position={[0, 0.3 + h + 0.16, 0]} color={roof} />
      <BackAndSides h={h} sides={sides} />
    </>
  );
}

/** Back windows + back door (faces -Z) and one window per side wall. */
function BackAndSides({ h, sides = true }: { h: number; sides?: boolean }) {
  const y = Math.min(2.3, 0.3 + h * 0.55);
  return (
    <>
      <group rotation-y={Math.PI}>
        <Window x={-1.6} y={y} w={1.7} h={1.2} />
        <Door x={1.7} w={1.1} color={JOBS.platinumDark} />
      </group>
      {sides &&
        [-1, 1].map((s) => (
          <group key={s} rotation-y={(s * Math.PI) / 2}>
            <Window x={0} y={y} w={1.9} h={1.2} z={3.55} />
          </group>
        ))}
    </>
  );
}

function Door({ x = 0, w = 1.3, color = JOBS.charcoal }: { x?: number; w?: number; color?: string }) {
  return (
    <>
      <RoundPanel size={[w + 0.3, 2.4, 0.1]} r={0.25} position={[x, 1.5, FRONT + 0.03]} color={JOBS.white} />
      <RoundPanel size={[w, 2.2, 0.1]} r={0.2} position={[x, 1.42, FRONT + 0.08]} color={color} />
    </>
  );
}

/** Rounded window with a white frame and a mullion. */
function Window({ x, y, w, h, z = FRONT }: { x: number; y: number; w: number; h: number; z?: number }) {
  return (
    <>
      <RoundPanel size={[w + 0.3, h + 0.3, 0.1]} r={0.3} position={[x, y, z + 0.03]} color={JOBS.white} />
      <RoundPanel size={[w, h, 0.1]} r={0.22} position={[x, y, z + 0.08]} color={JOBS.sky} />
      <Box size={[0.1, h, 0.08]} position={[x, y, z + 0.14]} color={JOBS.white} />
    </>
  );
}

/** "Text coming soon": a small pink-and-white striped A-frame sign beside the entrance. */
function ComingSoon({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <group position={[3.75, 0, 4.4]} rotation-y={-0.3}>
      {[-0.4, 0.4].map((x) => (
        <Box key={x} size={[0.1, 0.9, 0.1]} position={[x, 0.45, 0]} color={JOBS.white} />
      ))}
      <Box size={[1.0, 0.18, 0.08]} position={[0, 0.72, 0.05]} color={JOBS.pink} />
      <Box size={[1.0, 0.18, 0.08]} position={[0, 0.4, 0.05]} color={JOBS.pink} />
      <Box size={[1.0, 0.14, 0.06]} position={[0, 0.56, 0.04]} color={JOBS.white} />
    </group>
  );
}

function Shell({ p, children }: { p: BuildingModelProps; children: ReactNode }) {
  return (
    <group>
      {children}
      <ComingSoon show={p.comingSoon} />
    </group>
  );
}

const wallOf = (p: BuildingModelProps, k = 0) => pick(p.palette.buildings, p.colourIndex + k);
const roofOf = (p: BuildingModelProps, k = 0) => pick(p.palette.roofs, p.colourIndex + k);

/* ------------------------------------------------------------------ podcast */

/** Podcast studio: rounded studio, a lit ON-AIR lightbox (symbol only) and a giant desk mic on the roof. */
export function JobsPodcast(p: BuildingModelProps) {
  const h = 3.6;
  const top = 0.3 + h + 0.32;
  return (
    <Shell p={p}>
      <Body h={h} wall={wallOf(p)} roof={JOBS.pink} sides={false} />
      <Window x={-1.5} y={2.1} w={3} h={1.7} />
      <Door x={2} />
      {/* ON AIR lightbox: dark frame, glowing face, no lettering */}
      <RoundPanel size={[1.9, 0.7, 0.12]} r={0.2} position={[2, 3.35, FRONT + 0.06]} color={JOBS.ink} />
      <RoundPanel size={[1.6, 0.45, 0.1]} r={0.15} position={[2, 3.35, FRONT + 0.14]} glow />
      {/* Acoustic panels on the side walls */}
      {[-1.6, 0, 1.6].map((z) => (
        <Box key={z} size={[0.12, 1.6, 1.1]} position={[3.58, 2.1, z]} color={JOBS.pinkSoft} />
      ))}
      {/* Giant desk microphone */}
      <group position={[-1.3, top, -0.6]}>
        <Cyl r={[0.8, 1]} h={0.3} seg={14} position={[0, 0.15, 0]} color={JOBS.charcoal} />
        <Cyl r={0.12} h={1.4} seg={8} position={[0, 1, 0]} color={JOBS.platinumDark} />
        <Box size={[1.7, 0.16, 0.24]} position={[0, 1.7, 0]} color={JOBS.pink} />
        {[-0.82, 0.82].map((x) => (
          <Box key={x} size={[0.16, 1.2, 0.24]} position={[x, 2.25, 0]} color={JOBS.pink} />
        ))}
        <group position={[0, 2.75, 0]} rotation-x={-0.2}>
          <Cyl r={0.62} h={1.4} seg={14} color={JOBS.platinum} />
          <Sphere r={0.62} w={14} h={6} half position={[0, 0.7, 0]} color={JOBS.platinum} />
          <Sphere r={0.62} w={14} h={6} half position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]} color={JOBS.platinum} />
          {[-0.35, 0.05, 0.45].map((y) => (
            <Cyl key={y} r={0.65} h={0.1} seg={14} position={[0, y, 0]} color={JOBS.charcoal} />
          ))}
        </group>
      </group>
    </Shell>
  );
}

/* ---------------------------------------------------------------- interview */

function LoungeChair({ position, rotY, color }: { position: V3; rotY: number; color: string }) {
  return (
    <group position={position} rotation-y={rotY}>
      <RoundBox size={[1.2, 0.45, 1.2]} r={0.25} position={[0, 0.55, 0]} color={color} />
      {/* Tall back: its silhouette shows between the roof slats from the high camera */}
      <RoundBox size={[1.2, 1.6, 0.28]} r={0.12} position={[0, 1.45, -0.48]} color={color} />
      {[-0.62, 0.62].map((x) => (
        <Box key={x} size={[0.18, 0.55, 1.1]} position={[x, 0.75, 0]} color={JOBS.white} />
      ))}
      <Cyl r={0.08} h={0.35} seg={6} position={[0, 0.17, 0]} color={JOBS.charcoal} />
    </group>
  );
}

/**
 * Interview booth: a glass pavilion with an open slatted roof and knee-high walls, so the two big lounge chairs
 * facing each other (and the table mics between them) read from the high camera on every side, including from
 * behind (outer-ring buildings show the camera their back). Same cue as the booth on the other islands.
 */
export function JobsInterview(p: BuildingModelProps) {
  const roof = roofOf(p);
  const top = 3.75;
  return (
    <Shell p={p}>
      <Plinth />
      <RoundBox size={[7, 0.12, 6.2]} r={0.7} position={[0, 0.36, 0]} color={JOBS.wood} />
      {/* Knee-high back and side walls, glass above (white mullions only, so the chairs show through) */}
      <Box size={[7, 1.0, 0.3]} position={[0, 0.8, -2.95]} color={wallOf(p, 1)} />
      <Box size={[6.8, 0.12, 0.12]} position={[0, 2.4, -2.95]} color={JOBS.white} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 3.4, 0, 0]}>
          <Box size={[0.24, 1.0, 5.6]} position={[0, 0.8, -0.1]} color={wallOf(p, 1)} />
          {[-2.85, 0, 2.75].map((z) => (
            <Box key={z} size={[0.24, 3.3, 0.24]} position={[0, 1.95, z]} color={JOBS.white} />
          ))}
        </group>
      ))}
      <Box size={[0.24, 3.3, 0.24]} position={[0, 1.95, -2.95]} color={JOBS.white} />
      {/* Open roof: a coloured frame round the edge and white pergola slats across it */}
      {[-1, 1].map((s) => (
        <Box key={`fz${s}`} size={[7.4, 0.32, 0.4]} position={[0, top, s * 2.95]} color={roof} />
      ))}
      {[-1, 1].map((s) => (
        <Box key={`fx${s}`} size={[0.4, 0.32, 6.3]} position={[s * 3.5, top, 0]} color={roof} />
      ))}
      {[-1.8, -0.6, 0.6, 1.8].map((z) => (
        <Box key={z} size={[6.8, 0.16, 0.22]} position={[0, top + 0.04, z]} color={JOBS.white} />
      ))}
      {/* Pale rug, two big chairs in two saturated colours (deep pink and orange, like the booth on The Future, so
          they never blend into each other or the rug), a round table with two small mics */}
      <Cyl r={2.3} h={0.04} seg={20} position={[0, 0.44, 0.2]} color={JOBS.cream} />
      <group position={[-1.75, 0.3, 0.2]} scale={1.3}>
        <LoungeChair position={[0, 0, 0]} rotY={Math.PI / 2 - 0.35} color={JOBS.pinkDeep} />
      </group>
      <group position={[1.75, 0.3, 0.2]} scale={1.3}>
        <LoungeChair position={[0, 0, 0]} rotY={-Math.PI / 2 + 0.35} color={JOBS.orange} />
      </group>
      <Cyl r={0.55} h={0.08} seg={12} position={[0, 1.0, 0.2]} color={JOBS.white} />
      <Cyl r={0.07} h={0.6} seg={6} position={[0, 0.68, 0.2]} color={JOBS.charcoal} />
      {[-0.24, 0.24].map((x) => (
        <group key={x} position={[x, 1.04, 0.2]}>
          <Cyl r={0.03} h={0.35} seg={5} position={[0, 0.17, 0]} color={JOBS.charcoal} />
          <Sphere r={0.1} w={6} h={4} position={[0, 0.4, 0]} color={JOBS.charcoal} />
        </group>
      ))}
    </Shell>
  );
}

/* ------------------------------------------------------------------ archive */

/** Archive: a records office whose front is a giant filing cabinet, with a floppy disk standing on the roof. */
export function JobsArchive(p: BuildingModelProps) {
  const h = 4.1;
  const top = 0.3 + h + 0.32;
  return (
    <Shell p={p}>
      <Body h={h} wall={wallOf(p, 1)} roof={roofOf(p, 1)} />
      <Door x={-2.5} w={1.2} />
      {/* Filing-cabinet drawers */}
      {[1.15, 2.4, 3.65].map((y) => (
        <group key={y} position={[0.95, y, FRONT]}>
          <RoundPanel size={[4.4, 1.1, 0.22]} r={0.12} position={[0, 0, 0.11]} color={JOBS.platinum} />
          <Box size={[1.3, 0.18, 0.18]} position={[0, -0.12, 0.28]} color={JOBS.charcoal} />
          <Box size={[0.8, 0.3, 0.06]} position={[0, 0.25, 0.24]} color={JOBS.white} />
        </group>
      ))}
      {/* Floppy disk on the roof: square body, metal shutter, blank label */}
      <group position={[0, top + 1.55, -0.9]} rotation-x={-0.35}>
        <Box size={[3, 3, 0.3]} color={JOBS.charcoal} />
        <Box size={[1.5, 1.1, 0.08]} position={[0, 0.95, 0.17]} color={JOBS.platinum} />
        <Box size={[1.5, 1.1, 0.08]} position={[0, 0.95, -0.17]} color={JOBS.platinum} />
        <Box size={[0.35, 0.7, 0.06]} position={[0.25, 1.0, 0.23]} color={JOBS.charcoal} />
        <Box size={[2.3, 1.3, 0.08]} position={[0, -0.6, 0.17]} color={JOBS.white} />
        <Box size={[1.9, 0.12, 0.04]} position={[0, -0.4, 0.22]} color={JOBS.pink} />
      </group>
      <Box size={[1.6, 0.25, 0.8]} position={[0, top + 0.12, -0.6]} color={JOBS.platinumDark} />
      {/* Document boxes stacked by the door */}
      <Box size={[1, 0.6, 0.8]} position={[-2.6, 0.6, 4.1]} color={JOBS.beige} />
      <Box size={[1, 0.6, 0.8]} position={[-2.6, 1.2, 4.1]} color={JOBS.white} />
      <Box size={[0.9, 0.55, 0.7]} position={[-1.5, 0.58, 4.1]} color={JOBS.beigeShade} />
    </Shell>
  );
}

/* ---------------------------------------------------------------------- lab */

/** Research lab: white studio with a ribbon window, an observatory dome, a satellite dish and an antenna. */
export function JobsLab(p: BuildingModelProps) {
  const h = 3.8;
  const top = 0.3 + h + 0.32;
  return (
    <Shell p={p}>
      <Body h={h} wall={wallOf(p, 2)} roof={roofOf(p, 2)} />
      <RoundPanel size={[6.2, 1.1, 0.1]} r={0.4} position={[0, 3.05, FRONT + 0.05]} color={JOBS.sky} />
      {[-1.6, 0, 1.6].map((x) => (
        <Box key={x} size={[0.1, 1.1, 0.08]} position={[x, 3.05, FRONT + 0.12]} color={JOBS.white} />
      ))}
      <Door x={0} w={1.8} />
      <Box size={[2.8, 0.18, 1.2]} position={[0, 2.75, FRONT + 0.6]} color={JOBS.pink} />
      {/* Observatory dome with a pink slit */}
      <Sphere r={1.7} w={16} h={6} half position={[-1.6, top, -0.8]} color={JOBS.platinum} />
      <Box size={[0.4, 1.2, 0.4]} position={[-1.6, top + 1.25, -0.8]} rotation={[0, 0, 0.0]} color={JOBS.pink} />
      <Cyl r={1.8} h={0.3} seg={16} position={[-1.6, top + 0.12, -0.8]} color={JOBS.white} />
      {/* Satellite dish */}
      <group position={[1.8, top, -0.4]}>
        <Cyl r={0.14} h={1} seg={6} position={[0, 0.5, 0]} color={JOBS.charcoal} />
        <group position={[0, 1.25, 0]} rotation={[0.75, 0, 0]}>
          <Cyl r={[1.2, 0.25]} h={0.45} seg={14} color={JOBS.white} />
          <Cyl r={0.04} h={1.1} seg={4} position={[0, 0.65, 0]} color={JOBS.charcoal} />
          <Sphere r={0.12} w={6} h={4} position={[0, 1.2, 0]} color={JOBS.pink} />
        </group>
      </group>
      {/* Antenna with a glowing tip */}
      <Cyl r={0.07} h={2.6} seg={5} position={[2.8, top + 1.3, -2.2]} color={JOBS.charcoal} />
      <Sphere r={0.22} w={8} h={5} position={[2.8, top + 2.65, -2.2]} glow />
    </Shell>
  );
}

/* ------------------------------------------------------------------- cinema */

/** Cinema: tall front with a big screen showing a play symbol, a lit marquee canopy and poster frames. */
export function JobsCinema(p: BuildingModelProps) {
  const h = 5;
  const top = 0.3 + h + 0.32;
  return (
    <Shell p={p}>
      <Body h={h} wall={wallOf(p, 1)} roof={roofOf(p)} />
      {/* Facade screen with a play triangle */}
      <RoundPanel size={[5.6, 2.6, 0.12]} r={0.35} position={[0, 3.95, FRONT + 0.05]} color={JOBS.white} />
      <RoundPanel size={[5.2, 2.2, 0.1]} r={0.28} position={[0, 3.95, FRONT + 0.11]} color={JOBS.screen} />
      <Extruded
        points={[
          [-0.45, -0.6],
          [0.65, 0],
          [-0.45, 0.6],
        ]}
        depth={0.08}
        position={[0, 3.95, FRONT + 0.2]}
        glow
      />
      {/* Marquee canopy with a lit edge */}
      <Box size={[5.4, 0.45, 1.5]} position={[0, 2.5, FRONT + 0.75]} color={JOBS.white} />
      <Box size={[5.4, 0.2, 0.1]} position={[0, 2.5, FRONT + 1.52]} glow />
      <Box size={[0.1, 0.2, 1.4]} position={[-2.72, 2.5, FRONT + 0.8]} glow />
      <Box size={[0.1, 0.2, 1.4]} position={[2.72, 2.5, FRONT + 0.8]} glow />
      <Door x={0} w={2} />
      {/* Poster frames */}
      {[
        [-2.6, JOBS.pink],
        [2.6, JOBS.skyDeep],
      ].map(([x, c]) => (
        <group key={x as number} position={[x as number, 1.35, FRONT]}>
          <RoundPanel size={[1.1, 1.6, 0.1]} r={0.1} position={[0, 0, 0.05]} color={JOBS.white} />
          <RoundPanel size={[0.85, 1.3, 0.1]} r={0.08} position={[0, 0, 0.1]} color={c as string} />
          <Cyl
            r={0.22}
            h={0.06}
            seg={10}
            position={[0, 0.2, 0.17]}
            rotation={[Math.PI / 2, 0, 0]}
            color={JOBS.butter}
          />
        </group>
      ))}
      {/* Film strip on the roof */}
      <group position={[0, top + 0.6, -1.4]}>
        <Box size={[4.6, 1.1, 0.25]} color={JOBS.charcoal} />
        {[-1.8, -1.08, -0.36, 0.36, 1.08, 1.8].map((x) => (
          <group key={x}>
            <Box size={[0.3, 0.16, 0.06]} position={[x, 0.38, 0.13]} color={JOBS.white} />
            <Box size={[0.3, 0.16, 0.06]} position={[x, -0.38, 0.13]} color={JOBS.white} />
          </group>
        ))}
        <Box size={[0.25, 0.6, 0.6]} position={[-1.6, -0.75, 0]} color={JOBS.platinumDark} />
        <Box size={[0.25, 0.6, 0.6]} position={[1.6, -0.75, 0]} color={JOBS.platinumDark} />
      </group>
    </Shell>
  );
}

/* ------------------------------------------------------------------ gallery */

/** Framed landscape picture (sun and hills) on a wall face at z, facing local +Z. */
function Picture({
  x,
  y,
  z,
  w = 3.4,
  h = 2.4,
  sky = JOBS.sky,
  hills = JOBS.mint,
}: {
  x: number;
  y: number;
  z: number;
  w?: number;
  h?: number;
  sky?: string;
  hills?: string;
}) {
  const iw = w - 0.4;
  const ih = h - 0.4;
  const hill: [number, number][] = [
    [-1.5, -1],
    [1.5, -1],
    [1.5, -0.6],
    [0.3, 0.3],
    [-0.6, -0.3],
    [-1.5, 0.1],
  ];
  return (
    <group position={[x, y, z]}>
      <RoundPanel size={[w, h, 0.16]} r={0.12} position={[0, 0, 0.08]} color={JOBS.ink} />
      <Box size={[iw, ih, 0.06]} position={[0, 0, 0.18]} color={sky} />
      <Cyl
        r={ih * 0.19}
        h={0.06}
        seg={12}
        position={[iw * 0.27, ih * 0.22, 0.22]}
        rotation={[Math.PI / 2, 0, 0]}
        color={JOBS.butter}
      />
      <Extruded
        points={hill.map(([px, py]) => [(px * iw) / 3, (py * ih) / 2] as [number, number])}
        depth={0.06}
        position={[0, 0, 0.24]}
        color={hills}
      />
    </group>
  );
}

/**
 * Gallery: saw-tooth roof with glazed faces and big picture frames on EVERY wall (front, back and both sides),
 * with an easel outside. The plot's heading is the foundation's choice, so the model cannot count on its front
 * being the side the camera sees: from any heading at least one framed wall faces the camera.
 */
export function JobsGallery(p: BuildingModelProps) {
  const h = 3.5;
  const top = 0.3 + h;
  const teeth = [JOBS.pink, JOBS.sky, JOBS.butter];
  return (
    <Shell p={p}>
      <Plinth />
      <RoundBox size={[7.1, h, 6.2]} r={0.7} position={[0, 0.3 + h / 2, 0]} color={wallOf(p, 3)} />
      {/* Back: a big frame and the back door */}
      <group rotation-y={Math.PI}>
        <Picture x={-1.0} y={2.15} z={FRONT} w={3.2} h={2.2} sky={JOBS.peach} hills={JOBS.pinkDeep} />
        <Door x={1.9} w={1.1} color={JOBS.platinumDark} />
      </group>
      {/* Sides: one big frame each */}
      {[-1, 1].map((s) => (
        <group key={s} rotation-y={(s * Math.PI) / 2}>
          <Picture
            x={0}
            y={2.15}
            z={3.55}
            w={3.6}
            h={2.2}
            sky={s < 0 ? JOBS.lilac : JOBS.sky}
            hills={s < 0 ? JOBS.mint : JOBS.skyDeep}
          />
        </group>
      ))}
      {/* Saw-tooth roof: three teeth with glass on the steep face */}
      {teeth.map((c, i) => {
        const x = -2.35 + i * 2.35;
        return (
          <group key={i} position={[x, top, 0]}>
            <Extruded
              points={[
                [-1.15, 0],
                [1.15, 0],
                [1.15, 1.25],
              ]}
              depth={5.6}
              color={c}
            />
            <Box size={[0.06, 1.0, 5.2]} position={[1.17, 0.58, 0]} color={JOBS.skyDeep} />
          </group>
        );
      })}
      {/* Big central frame: a simple landscape (sun and hills) */}
      <Picture x={0.7} y={2.05} z={FRONT} />
      {/* Small pixel-art frame */}
      <group position={[-2.55, 2.6, FRONT]}>
        <Box size={[1.3, 1.3, 0.14]} position={[0, 0, 0.07]} color={JOBS.white} />
        {[
          [-0.25, 0.25, JOBS.pink],
          [0.25, 0.25, JOBS.butter],
          [-0.25, -0.25, JOBS.skyDeep],
          [0.25, -0.25, JOBS.pink],
        ].map(([x, y, c]) => (
          <Box
            key={`${x},${y}`}
            size={[0.45, 0.45, 0.06]}
            position={[x as number, y as number, 0.16]}
            color={c as string}
          />
        ))}
      </group>
      <Door x={-2.55} w={1.1} />
      {/* Easel with a canvas */}
      <group position={[-3.4, 0, 4.3]} rotation-y={0.4}>
        <Box size={[0.08, 1.9, 0.08]} position={[-0.35, 0.95, 0]} rotation={[0, 0, 0.12]} color={JOBS.wood} />
        <Box size={[0.08, 1.9, 0.08]} position={[0.35, 0.95, 0]} rotation={[0, 0, -0.12]} color={JOBS.wood} />
        <Box size={[0.08, 1.8, 0.08]} position={[0, 0.9, -0.35]} rotation={[0.35, 0, 0]} color={JOBS.wood} />
        <Box size={[0.9, 0.7, 0.06]} position={[0, 1.35, 0.06]} color={JOBS.white} />
        <Box size={[0.5, 0.3, 0.04]} position={[0.05, 1.38, 0.1]} color={JOBS.pink} />
      </group>
    </Shell>
  );
}

/* ------------------------------------------------------------------- arcade */

function Cabinet({ x }: { x: number }) {
  return (
    <group position={[x, 0, 3.95]}>
      <Box size={[0.9, 1.6, 0.75]} position={[0, 0.8, 0]} color={JOBS.charcoal} />
      <Box size={[0.9, 0.35, 0.9]} position={[0, 1.25, 0.12]} color={JOBS.platinum} />
      <Box size={[0.7, 0.55, 0.08]} position={[0, 1.75, 0.3]} rotation={[-0.25, 0, 0]} color={JOBS.screenLit} />
      <Box size={[0.9, 0.3, 0.75]} position={[0, 2.15, 0]} glow />
      <Cyl r={0.05} h={0.25} seg={5} position={[-0.15, 1.53, 0.35]} color={JOBS.ink} />
      <Sphere r={0.09} w={6} h={4} position={[-0.15, 1.68, 0.35]} color={JOBS.pink} />
    </group>
  );
}

/** Arcade: pink studio with a neon band, a pixel screen, a giant joystick on the roof and two cabinets. */
export function JobsArcade(p: BuildingModelProps) {
  const h = 3.8;
  const top = 0.3 + h + 0.32;
  return (
    <Shell p={p}>
      <Body h={h} wall={JOBS.pinkSoft} roof={JOBS.white} />
      <RoundBox size={[7.25, 0.22, 6.35]} r={0.75} position={[0, 3.35, 0]} glow />
      {/* Pixel screen */}
      <RoundPanel size={[3.4, 1.7, 0.12]} r={0.25} position={[0.6, 2.1, FRONT + 0.05]} color={JOBS.white} />
      <RoundPanel size={[3.0, 1.35, 0.1]} r={0.2} position={[0.6, 2.1, FRONT + 0.11]} color={JOBS.screen} />
      {[
        [-0.5, 0.2],
        [-0.2, -0.1],
        [0.1, 0.2],
        [0.4, -0.1],
        [0.7, 0.2],
        [1.0, -0.1],
        [1.6, 0.25],
      ].map(([x, y]) => (
        <Box key={`${x}`} size={[0.24, 0.24, 0.05]} position={[x!, 2.1 + y!, FRONT + 0.19]} glow />
      ))}
      <Door x={-2.4} w={1.3} />
      {/* Checkered entrance mat */}
      {[0, 1, 2, 3].map((i) =>
        [0, 1].map((j) => (
          <Box
            key={`${i}-${j}`}
            size={[0.5, 0.05, 0.5]}
            position={[-3.15 + i * 0.5, 0.33, FRONT + 0.4 + j * 0.5]}
            color={(i + j) % 2 ? JOBS.ink : JOBS.white}
          />
        )),
      )}
      {/* Giant joystick */}
      <group position={[-0.6, top, -0.8]}>
        <RoundBox size={[3, 0.6, 2.2]} r={0.4} position={[0, 0.3, 0]} color={JOBS.charcoal} />
        <group position={[-0.5, 0.6, 0]} rotation={[0.15, 0, 0.25]}>
          <Cyl r={0.16} h={2} seg={8} position={[0, 1, 0]} color={JOBS.platinum} />
          <Sphere r={0.6} w={12} h={8} position={[0, 2.1, 0]} color={JOBS.pink} />
        </group>
        <Cyl r={0.35} h={0.25} seg={12} position={[0.8, 0.7, 0.4]} color={JOBS.butter} />
        <Cyl r={0.35} h={0.25} seg={12} position={[0.9, 0.7, -0.5]} color={JOBS.skyDeep} />
      </group>
      <Cabinet x={-0.1} />
      <Cabinet x={1.2} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ exports */

export const JOBS_MODELS: Record<BuildingKind, BuildingModel> = {
  podcast: JobsPodcast,
  interview: JobsInterview,
  documents: JobsArchive,
  research: JobsLab,
  video: JobsCinema,
  animation: JobsGallery,
  experience: JobsArcade,
};

/** Model tops, for the beacon above each building. */
export const JOBS_MODEL_HEIGHT: Record<BuildingKind, number> = {
  podcast: 7.9,
  interview: 4,
  documents: 6.6,
  research: 7.3,
  video: 6.5,
  animation: 5.1,
  experience: 7.4,
};
