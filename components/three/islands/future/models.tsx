"use client";

import type { ReactNode } from "react";
import type { BuildingKind } from "@/lib/content/schema";
import type { BuildingModel, BuildingModelProps } from "../../buildings/registry";
import { pick } from "@/lib/three/palette";
import { FUTURE_PALETTE as FP } from "@/lib/three/palettes/future";
import { Glow, Solid } from "./kit";

/**
 * The Future's building models, one per kind (docs/VISION.md table), in the data-city style: pale concrete
 * and graphite volumes on a lit plinth, lime light strips, opaque glass. Each keeps the kind's tell from the
 * shared registry (mic on the roof, two chairs in an open-roofed glass booth, shelves, dome + antenna, marquee + screen,
 * picture frames, joystick + cabinets) so the same kind reads the same on every island.
 *
 * Contract (components/three/buildings/registry.tsx): faces local +Z (the road), sits on y = 0, stays inside
 * the plot, and the main volume roughly fills the box collider Building.tsx adds (0.76 x 0.68 of the plot).
 * Draw calls: every piece is a kit <Solid> or <Glow> primitive, and <Glow> shares the Solid bucket (see kit.tsx),
 * so <Building>'s merge makes ONE mesh per building whatever the detail: one draw call plus its shadow pass,
 * plus the shared beacon. Small pieces use <Solid> too: a receive-only bucket would cost one more call each.
 */

/** Main volume footprint inside the plot (same proportions as the registry models). */
function body(plot: BuildingModelProps["plot"], fw = 0.72, fd = 0.62) {
  return { w: plot.width * fw, d: plot.depth * fd };
}

/** Low concrete plinth with a lime light line along the road edge. */
function Plinth({ w, d, front }: { w: number; d: number; front: number }) {
  return (
    <>
      <Solid s={[w + 1.4, 0.3, d + 1.4]} p={[0, 0.15, 0]} c={FP.concreteShade} />
      <Solid s={[w + 1.4, 0.16, front - d / 2]} p={[0, 0.08, d / 2 + (front - d / 2) / 2]} c={FP.paving} />
      <Glow s={[w + 1.4, 0.06, 0.08]} p={[0, 0.32, d / 2 + 0.7]} />
    </>
  );
}

/** Coming-soon barrier: two graphite posts and a lime-striped bar. */
function Barrier({ z }: { z: number }) {
  return (
    <group position={[2.6, 0, z]}>
      <Solid s={[0.14, 0.9, 0.14]} p={[-0.8, 0.45, 0]} c={FP.graphite} />
      <Solid s={[0.14, 0.9, 0.14]} p={[0.8, 0.45, 0]} c={FP.graphite} />
      <Solid s={[1.9, 0.24, 0.1]} p={[0, 0.78, 0]} c={FP.graphite} />
      {[-0.6, 0, 0.6].map((x) => (
        <Glow key={x} s={[0.3, 0.26, 0.12]} p={[x, 0.78, 0]} />
      ))}
    </group>
  );
}

function Shell({ p, front, children }: { p: BuildingModelProps; front: number; children: ReactNode }) {
  return (
    <group>
      {children}
      {p.comingSoon && <Barrier z={front + 1.2} />}
    </group>
  );
}

/** Wall colour for this building (pale concrete variants). */
const wall = (p: BuildingModelProps, k = 0) => pick(FP.buildings, p.colourIndex + k);

/** Parapet + lime light line at the top of a volume. */
function Crown({ w, d, h }: { w: number; d: number; h: number }) {
  return (
    <>
      <Solid s={[w + 0.3, 0.4, d + 0.3]} p={[0, h + 0.2, 0]} c={FP.graphite} />
      <Glow s={[w + 0.32, 0.08, 0.06]} p={[0, h + 0.05, d / 2 + 0.16]} />
    </>
  );
}

/* --------------------------------------------------------------- models */

/** Podcast studio: glass-fronted box, ON AIR light, equaliser bars and a giant studio mic on the roof. */
export function FuturePodcast(p: BuildingModelProps) {
  const { w, d } = body(p.plot);
  const h = 4.2;
  const front = p.plot.depth / 2 - 0.6;
  return (
    <Shell p={p} front={d / 2}>
      <Plinth w={w} d={d} front={front} />
      <Solid s={[w, h, d]} p={[0, h / 2 + 0.3, 0]} c={wall(p)} />
      <Crown w={w} d={d} h={h + 0.3} />
      {/* Glass front and door */}
      <Solid s={[w * 0.62, h * 0.62, 0.1]} p={[-w * 0.12, h * 0.42 + 0.3, d / 2 + 0.05]} c={FP.glassDark} />
      <Solid s={[1.3, 2.3, 0.12]} p={[w * 0.32, 1.45, d / 2 + 0.06]} c={FP.graphite} />
      {/* ON AIR sign */}
      <Solid s={[2.1, 0.75, 0.16]} p={[w * 0.32, 3.25, d / 2 + 0.1]} c={FP.graphite} />
      <Glow s={[1.8, 0.48, 0.1]} p={[w * 0.32, 3.25, d / 2 + 0.2]} />
      {/* Equaliser bars on the glass */}
      {[0.6, 1.1, 1.6, 0.9, 1.3, 0.5].map((bar, i) => (
        <Glow key={i} s={[0.28, bar, 0.06]} p={[-w * 0.36 + i * 0.5, 0.9 + bar / 2, d / 2 + 0.14]} />
      ))}
      {/* Roof mic: stand, yoke, body with lime grille rings */}
      <group position={[-w * 0.1, h + 0.7, -d * 0.05]}>
        <Solid s={[0.9, 0.2, 0.9]} p={[0, 0.1, 0]} c={FP.graphite} shape="cyl8" />
        <Solid s={[0.1, 1.3, 0.1]} p={[0, 0.85, 0]} c={FP.graphite} shape="cyl8" />
        <Solid s={[1.7, 0.14, 0.2]} p={[0, 1.5, 0]} c={FP.graphite} />
        {[-1, 1].map((s) => (
          <Solid key={s} s={[0.14, 1.3, 0.2]} p={[s * 0.85, 2.1, 0]} c={FP.graphite} />
        ))}
        <Solid s={[0.62, 1.7, 0.62]} p={[0, 2.55, 0]} c={FP.concreteShade} shape="cyl12" />
        <Solid s={[0.62, 0.62, 0.62]} p={[0, 3.4, 0]} c={FP.concreteShade} shape="dome" />
        {[2.0, 2.45, 2.9].map((y) => (
          <Glow key={y} s={[0.65, 0.09, 0.65]} p={[0, y, 0]} shape="cyl12" />
        ))}
      </group>
    </Shell>
  );
}

/**
 * Interview booth: glass pavilion on a plinth with an open slatted roof and knee-high walls, so the two big chairs
 * facing each other and the table mic read from the high camera on every side, including from behind (outer-ring
 * buildings show the camera their back). Same cue as the booth on the other islands.
 */
export function FutureInterview(p: BuildingModelProps) {
  const { w, d } = body(p.plot, 0.66, 0.56);
  const h = 3.4;
  const front = p.plot.depth / 2 - 0.6;
  const top = h + 0.45;
  const posts: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  const slats = 4;
  return (
    <Shell p={p} front={d / 2}>
      <Plinth w={w} d={d} front={front} />
      {/* Frame posts, knee-high glass walls at the back and sides (low, so the chairs show over them) */}
      {posts.map(([sx, sz]) => (
        <Solid key={`${sx}${sz}`} s={[0.22, h, 0.22]} p={[(sx * w) / 2, h / 2 + 0.3, (sz * d) / 2]} c={FP.graphite} />
      ))}
      <Solid s={[w, 1.0, 0.1]} p={[0, 0.8, -d / 2]} c={FP.glass} />
      {[-1, 1].map((s) => (
        <Solid key={s} s={[0.1, 1.0, d * 0.9]} p={[(s * w) / 2, 0.8, 0]} c={FP.glass} />
      ))}
      {/* Open roof: a frame round the edge with a lime underglow, pale slats across it */}
      {[-1, 1].map((s) => (
        <Solid key={`fz${s}`} s={[w + 0.8, 0.35, 0.45]} p={[0, top, (s * (d + 0.35)) / 2]} c={wall(p)} />
      ))}
      {[-1, 1].map((s) => (
        <Solid key={`fx${s}`} s={[0.45, 0.35, d + 0.8]} p={[(s * (w + 0.35)) / 2, top, 0]} c={wall(p)} />
      ))}
      {[-1, 1].map((s) => (
        <Glow key={`gz${s}`} s={[w + 0.82, 0.08, 0.1]} p={[0, top - 0.21, (s * (d + 0.8)) / 2]} />
      ))}
      {Array.from({ length: slats }, (_, i) => (
        <Solid
          key={i}
          s={[w, 0.14, 0.3]}
          p={[0, top + 0.06, -d / 2 + (d * (i + 1)) / (slats + 1)]}
          c={FP.concreteShade}
        />
      ))}
      {/* Two big chairs facing each other, side-on to the road, on a pale rug */}
      <Solid s={[w * 0.8, 0.04, d * 0.62]} p={[0, 0.32, 0.1]} c={FP.paving} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * w * 0.25, 0.3, 0.1]} rotation-y={(-s * Math.PI) / 2} scale={1.3}>
          <Solid s={[1.0, 0.45, 0.95]} p={[0, 0.35, 0]} c={s < 0 ? FP.pink : FP.orange} />
          <Solid s={[1.0, 1.0, 0.2]} p={[0, 0.85, -0.42]} c={s < 0 ? FP.pink : FP.orange} />
          {[-1, 1].map((a) => (
            <Solid key={a} s={[0.16, 0.4, 0.9]} p={[a * 0.5, 0.65, 0]} c={s < 0 ? FP.pink : FP.orange} />
          ))}
          <Solid s={[0.12, 0.12, 0.12]} p={[0, 0.06, 0]} c={FP.graphite} />
        </group>
      ))}
      {/* Table with a mic on it */}
      <Solid s={[0.5, 0.06, 0.5]} p={[0, 0.95, 0.1]} c={FP.graphite} shape="cyl12" />
      <Solid s={[0.08, 0.6, 0.08]} p={[0, 0.62, 0.1]} c={FP.graphite} shape="cyl8" />
      <Solid s={[0.04, 0.4, 0.04]} p={[0, 1.18, 0.1]} c={FP.graphite} shape="cyl8" />
      <Glow s={[0.12, 0.12, 0.12]} p={[0, 1.42, 0.1]} shape="ball" />
      {/* Recording light on the back of the roof frame */}
      <Solid s={[0.5, 0.3, 0.5]} p={[w * 0.32, top + 0.32, -(d + 0.35) / 2]} c={FP.graphite} />
      <Glow s={[0.26, 0.26, 0.26]} p={[w * 0.32, top + 0.6, -(d + 0.35) / 2]} shape="ball" />
    </Shell>
  );
}

/** Archive: long data vault, a front of lit shelves, storage silos on the roof, filing cabinets outside. */
export function FutureArchive(p: BuildingModelProps) {
  const { w, d } = body(p.plot, 0.8, 0.6);
  const h = 3.8;
  const front = p.plot.depth / 2 - 0.6;
  const shelves = [0.9, 1.75, 2.6];
  return (
    <Shell p={p} front={d / 2}>
      <Plinth w={w} d={d} front={front} />
      <Solid s={[w, h, d]} p={[0, h / 2 + 0.3, 0]} c={wall(p, 1)} />
      <Crown w={w} d={d} h={h + 0.3} />
      {/* Shelf wall: graphite frame, shelves, file blocks, lime index lines */}
      <Solid s={[w * 0.82, h * 0.78, 0.2]} p={[0, h * 0.45 + 0.3, d / 2 + 0.1]} c={FP.graphite} />
      {shelves.map((y, row) => (
        <group key={y} position={[0, y + 0.3, d / 2 + 0.22]}>
          <Solid s={[w * 0.78, 0.08, 0.3]} p={[0, -0.05, 0]} c={FP.graphiteSoft} />
          {Array.from({ length: 9 }, (_, i) => (
            <Solid
              key={i}
              s={[0.5, 0.55 + ((i + row) % 3) * 0.08, 0.26]}
              p={[-w * 0.35 + (i * w * 0.7) / 8, 0.3, 0]}
              c={(i + row) % 3 === 0 ? FP.manila : (i + row) % 3 === 1 ? FP.concrete : FP.sky}
            />
          ))}
          <Glow s={[w * 0.78, 0.05, 0.05]} p={[0, 0.02, 0.18]} />
        </group>
      ))}
      {/* Storage silos */}
      {[-0.3, 0, 0.3].map((f) => (
        <group key={f} position={[w * f, h + 0.5, -d * 0.12]}>
          <Solid s={[0.7, 1.6, 0.7]} p={[0, 0.8, 0]} c={FP.concreteShade} shape="cyl12" />
          <Glow s={[0.72, 0.1, 0.72]} p={[0, 1.2, 0]} shape="cyl12" />
        </group>
      ))}
      {/* Filing cabinets by the entrance */}
      {[0, 1].map((i) => (
        <group key={i} position={[-w * 0.4 + i * 1.05, 0.3, d / 2 + 1.2]}>
          <Solid s={[0.9, 1.5, 0.75]} p={[0, 0.75, 0]} c={FP.graphiteSoft} />
          {[0.35, 0.75, 1.15].map((y) => (
            <Glow key={y} s={[0.4, 0.06, 0.04]} p={[0, y, 0.39]} />
          ))}
        </group>
      ))}
    </Shell>
  );
}

/** Research lab: concrete block, ribbon window, observatory dome, a dish and a lattice antenna. */
export function FutureLab(p: BuildingModelProps) {
  const { w, d } = body(p.plot);
  const h = 4.4;
  const front = p.plot.depth / 2 - 0.6;
  const r = Math.min(w, d) * 0.3;
  return (
    <Shell p={p} front={d / 2}>
      <Plinth w={w} d={d} front={front} />
      <Solid s={[w, h, d]} p={[0, h / 2 + 0.3, 0]} c={wall(p, 2)} />
      <Crown w={w} d={d} h={h + 0.3} />
      <Solid s={[w * 0.9, 1.0, 0.1]} p={[0, h * 0.66 + 0.3, d / 2 + 0.05]} c={FP.glassDark} />
      <Solid s={[1.8, 2.3, 0.12]} p={[0, 1.45, d / 2 + 0.06]} c={FP.graphite} />
      <Glow s={[2.2, 0.1, 0.1]} p={[0, 2.7, d / 2 + 0.1]} />
      {/* Observatory dome with slit and a lime ring */}
      <group position={[-w * 0.18, h + 0.7, -d * 0.05]}>
        <Solid s={[r + 0.2, 0.5, r + 0.2]} p={[0, 0.25, 0]} c={FP.graphite} shape="cyl12" />
        <Solid s={[r, r, r]} p={[0, 0.5, 0]} c={FP.paving} shape="dome" />
        <Solid s={[0.45, r * 0.95, 0.2]} p={[0, 0.5 + r * 0.55, r * 0.55]} r={[-0.75, 0, 0]} c={FP.graphite} />
        <Glow s={[r + 0.22, 0.08, r + 0.22]} p={[0, 0.52, 0]} shape="cyl12" />
      </group>
      {/* Dish */}
      <group position={[w * 0.3, h + 0.7, d * 0.18]}>
        <Solid s={[0.14, 0.9, 0.14]} p={[0, 0.45, 0]} c={FP.graphite} />
        <Solid s={[1.0, 0.35, 1.0]} p={[0, 1.0, 0]} r={[2.5, 0.6, 0]} c={FP.concrete} shape="dome" />
      </group>
      {/* Lattice antenna with a glowing tip */}
      <group position={[w * 0.3, h + 0.7, -d * 0.28]}>
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <Solid
              key={`${sx}${sz}`}
              s={[0.08, 3.4, 0.08]}
              p={[sx * 0.18, 1.7, sz * 0.18]}
              r={[sz * -0.05, 0, sx * 0.05]}
              c={FP.graphite}
            />
          )),
        )}
        {[0.8, 1.6, 2.4].map((y) => (
          <Solid key={y} s={[0.4, 0.06, 0.4]} p={[0, y, 0]} c={FP.graphite} />
        ))}
        <Glow s={[0.26, 0.26, 0.26]} p={[0, 3.55, 0]} shape="ball" />
      </group>
    </Shell>
  );
}

/** Cinema: tall front, a marquee with a row of lights, a big rooftop screen with a play mark, posters. */
export function FutureCinema(p: BuildingModelProps) {
  const { w, d } = body(p.plot, 0.75, 0.66);
  const h = 5.2;
  const front = p.plot.depth / 2 - 0.6;
  return (
    <Shell p={p} front={d / 2}>
      <Plinth w={w} d={d} front={front} />
      <Solid s={[w, h, d]} p={[0, h / 2 + 0.3, 0]} c={wall(p, 1)} />
      <Crown w={w} d={d} h={h + 0.3} />
      {/* Marquee */}
      <Solid s={[w * 0.92, 1.1, 1.3]} p={[0, h * 0.58, d / 2 + 0.65]} c={FP.graphite} />
      <Glow s={[w * 0.92, 0.08, 0.08]} p={[0, h * 0.58 - 0.5, d / 2 + 1.32]} />
      {Array.from({ length: 11 }, (_, i) => (
        <Glow key={i} s={[0.16, 0.16, 0.06]} p={[-w * 0.41 + (i * w * 0.82) / 10, h * 0.58 + 0.25, d / 2 + 1.32]} />
      ))}
      <Solid s={[w * 0.7, 0.4, 0.06]} p={[0, h * 0.58 - 0.12, d / 2 + 1.32]} c={FP.paving} />
      <Solid s={[2.6, 2.4, 0.12]} p={[0, 1.5, d / 2 + 0.06]} c={FP.glassDark} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * w * 0.36, 1.6, d / 2 + 0.08]}>
          <Solid s={[1.2, 1.7, 0.1]} p={[0, 0, 0]} c={FP.graphite} />
          <Solid s={[0.95, 1.4, 0.06]} p={[0, 0, 0.06]} c={s < 0 ? FP.pink : FP.sky} />
        </group>
      ))}
      {/* Rooftop screen with a play mark */}
      <group position={[0, h + 0.7, -d * 0.15]}>
        <Solid s={[0.3, 1.2, 0.3]} p={[-w * 0.3, 0.6, 0]} c={FP.graphite} />
        <Solid s={[0.3, 1.2, 0.3]} p={[w * 0.3, 0.6, 0]} c={FP.graphite} />
        <Solid s={[w * 0.82, 2.6, 0.3]} p={[0, 2.3, 0]} c={FP.graphite} />
        <Solid s={[w * 0.74, 2.2, 0.1]} p={[0, 2.3, 0.18]} c={FP.glassDark} />
        <Glow s={[0.62, 0.12, 0.62]} p={[0.1, 2.3, 0.25]} r={[Math.PI / 2, Math.PI / 2, 0]} shape="tri" />
      </group>
    </Shell>
  );
}

/** Gallery: saw-tooth roof with lit edges, three big frames with simple abstract art, a sculpture outside. */
export function FutureGallery(p: BuildingModelProps) {
  const { w, d } = body(p.plot);
  const h = 3.8;
  const front = p.plot.depth / 2 - 0.6;
  const art = [FP.pink, FP.sky, FP.orange];
  return (
    <Shell p={p} front={d / 2}>
      <Plinth w={w} d={d} front={front} />
      <Solid s={[w, h, d]} p={[0, h / 2 + 0.3, 0]} c={wall(p, 3)} />
      {[-1, 0, 1].map((i) => (
        <group key={i} position={[(i * w) / 3, h + 0.3, 0]}>
          <Solid s={[w / 3 - 0.1, 0.25, d * 0.66]} p={[0, 0.75, 0]} r={[0, 0, 0.5]} c={FP.graphite} />
          <Glow s={[0.08, 1.4, d * 0.66]} p={[w / 6 - 0.25, 0.7, 0]} />
        </group>
      ))}
      {[-1, 0, 1].map((i) => (
        <group key={i} position={[i * w * 0.32, h * 0.5 + 0.3, d / 2 + 0.08]}>
          <Solid s={[w * 0.27, h * 0.56, 0.16]} p={[0, 0, 0]} c={FP.graphite} />
          <Solid s={[w * 0.23, h * 0.48, 0.08]} p={[0, 0, 0.08]} c={FP.paving} />
          <Solid s={[w * 0.12, h * 0.22, 0.06]} p={[-w * 0.04, h * 0.08, 0.13]} c={art[(i + 3 + p.colourIndex) % 3]} />
          <Solid s={[w * 0.08, w * 0.08, 0.06]} p={[w * 0.06, -h * 0.1, 0.13]} c={art[(i + 4 + p.colourIndex) % 3]} />
        </group>
      ))}
      <Glow s={[w, 0.08, 0.08]} p={[0, h * 0.1 + 0.3, d / 2 + 0.12]} />
      {/* Sculpture: stacked turned cubes */}
      <group position={[-w * 0.4, 0.3, d / 2 + 1.3]}>
        <Solid s={[0.8, 0.5, 0.8]} p={[0, 0.25, 0]} c={FP.concreteShade} />
        <Solid s={[0.6, 0.6, 0.6]} p={[0, 0.8, 0]} r={[0.6, 0.6, 0]} c={FP.pink} />
        <Solid s={[0.4, 0.4, 0.4]} p={[0, 1.35, 0]} r={[0.3, 1.1, 0.4]} c={FP.sky} />
      </group>
    </Shell>
  );
}

/** One face of the roof marquee (faces local +Z, leans back): a graphite frame round a lit screen with pixel blocks. */
function MarqueePanel() {
  return (
    <group position={[0, 0, 0.9]} rotation-x={-0.42}>
      <Solid s={[3.4, 2.0, 0.18]} p={[0, 1.0, 0]} c={FP.night} />
      <Glow s={[3.0, 1.6, 0.04]} p={[0, 1.0, 0.1]} />
      {(
        [
          [-0.9, 1.25, FP.pink],
          [-0.55, 1.25, FP.pink],
          [-0.55, 0.9, FP.pink],
          [0.4, 0.75, FP.night],
          [0.75, 0.75, FP.night],
          [0.75, 1.1, FP.night],
          [1.1, 0.75, FP.pink],
        ] as const
      ).map(([x, y, c]) => (
        <Solid key={`${x},${y}`} s={[0.32, 0.32, 0.04]} p={[x, y, 0.14]} c={c} />
      ))}
    </group>
  );
}

/**
 * Arcade: neon stripes, two arcade cabinets by the door, and on the roof (which the camera always sees, whatever
 * way the plot faces) a lime neon outline, a two-sided lit marquee and a giant joystick.
 */
export function FutureArcade(p: BuildingModelProps) {
  const { w, d } = body(p.plot);
  const h = 4;
  const front = p.plot.depth / 2 - 0.6;
  return (
    <Shell p={p} front={d / 2}>
      <Plinth w={w} d={d} front={front} />
      <Solid s={[w, h, d]} p={[0, h / 2 + 0.3, 0]} c={FP.graphiteSoft} />
      <Crown w={w} d={d} h={h + 0.3} />
      {/* Neon: two lime bands, a zig-zag above the door */}
      <Glow s={[w + 0.08, 0.16, d + 0.08]} p={[0, h - 0.3, 0]} />
      <Glow s={[w + 0.08, 0.08, d + 0.08]} p={[0, h - 0.7, 0]} />
      {[-2, -1, 0, 1, 2].map((i) => (
        <Glow key={i} s={[0.8, 0.12, 0.08]} p={[i * 0.62, 2.95, d / 2 + 0.08]} r={[0, 0, i % 2 === 0 ? 0.5 : -0.5]} />
      ))}
      <Solid s={[2.0, 2.3, 0.12]} p={[0, 1.45, d / 2 + 0.06]} c={FP.night} />
      {/* Cabinets */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * w * 0.33, 0.3, d / 2 + 1.0]}>
          <Solid s={[0.95, 1.9, 0.8]} p={[0, 0.95, 0]} c={s < 0 ? FP.pink : FP.sky} />
          <Solid s={[0.75, 0.6, 0.1]} p={[0, 1.4, 0.38]} r={[-0.2, 0, 0]} c={FP.night} />
          <Glow s={[0.6, 0.45, 0.04]} p={[0, 1.4, 0.44]} r={[-0.2, 0, 0]} />
          <Solid s={[0.95, 0.12, 0.45]} p={[0, 0.95, 0.5]} c={FP.graphite} />
        </group>
      ))}
      {/* Roof neon: a lime outline along the parapet top */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <Glow s={[w + 0.34, 0.14, 0.14]} p={[0, h + 0.77, sd * (d / 2 + 0.08)]} />
          <Glow s={[0.14, 0.14, d + 0.3]} p={[sd * (w / 2 + 0.08), h + 0.77, 0]} />
        </group>
      ))}
      {/* Two-sided marquee (A-frame), so a lit screen faces the camera from any heading */}
      <group position={[-w * 0.26, h + 0.7, 0]}>
        <MarqueePanel />
        <group rotation-y={Math.PI}>
          <MarqueePanel />
        </group>
      </group>
      {/* Giant joystick */}
      <group position={[w * 0.12 + 0.6, h + 0.7, -d * 0.05]}>
        <Solid s={[2.4, 0.7, 1.8]} p={[0, 0.35, 0]} c={FP.night} />
        <Glow s={[0.28, 0.28, 0.28]} p={[0.75, 0.75, 0.45]} shape="ball" />
        <Solid s={[0.18, 1.8, 0.18]} p={[-0.25, 1.5, 0]} r={[0, 0, 0.18]} c={FP.graphite} shape="cyl8" />
        <Solid s={[0.6, 0.6, 0.6]} p={[-0.42, 2.45, 0]} c={FP.pink} shape="ball" />
      </group>
    </Shell>
  );
}

/** Future model per building kind (passed to <Building Model=...>). */
export const FUTURE_MODELS: Record<BuildingKind, BuildingModel> = {
  podcast: FuturePodcast,
  interview: FutureInterview,
  documents: FutureArchive,
  research: FutureLab,
  video: FutureCinema,
  animation: FutureGallery,
  experience: FutureArcade,
};

/** Rough top of each Future model (for the beacon). */
export const FUTURE_MODEL_HEIGHT: Record<BuildingKind, number> = {
  podcast: 8.6,
  interview: 4.4,
  documents: 6.4,
  research: 8.8,
  video: 9.4,
  animation: 5.6,
  experience: 7.8,
};
