"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { Vec3 } from "@/lib/three/layout";
import { motion } from "@/lib/three/motion";
import { pick } from "@/lib/three/palette";
import { TIERS, type Tier } from "@/lib/three/quality";
import type { ScatterItem } from "@/lib/three/scatter";
import { FUTURE_PALETTE as FP } from "@/lib/three/palettes/future";
import { StaticMerge } from "../../kit/StaticMerge";
import {
  cityTowers,
  lotBox,
  MAINFRAME,
  monolithSpecs,
  plazaFrame,
  plazaToLot,
  RACK,
  rackFront,
  rackSlots,
  type BlinkPoint,
  type MonolithSpec,
  type TowerSpec,
} from "./designs";
import { BarText, Glow, Phos, SevenSeg, Solid } from "./kit";
import { LOT_FRONT, type Lot } from "./lots";

/**
 * The Future's static decor: the data city around the content buildings (towers, polling monoliths, the
 * "1956 vs now" comparison plaza, the server yard), street lamps along the lot fronts and the guide's welcome
 * plaza, and the trees. Everything sits under ONE <StaticMerge>, built only from kit <Solid>/<Glow>/<Phos>
 * pieces, which all share one bucket (kit.tsx), so the whole city costs one draw call plus its shadow pass
 * however much detail it has. The blinking lights live outside the merge (<Blinkers>, one instanced call).
 */

type GuideSpot = { position: Vec3; rotationY: number };

export function FutureDecor({
  lots,
  tier,
  heights,
  guide,
  trees,
}: {
  lots: Lot[];
  tier: Tier;
  heights: number[] | null;
  guide?: GuideSpot;
  trees: ScatterItem[];
}) {
  return (
    <StaticMerge>
      <MergedTrees items={trees} tier={tier} />
      {lots.map((lot) => (
        <group key={lot.id} position={lot.position} rotation-y={lot.rotationY}>
          <LotFront lot={lot} tier={tier} />
          {lot.use === "monoliths" && <Monoliths lot={lot} heights={heights} />}
          {lot.use === "comparison" && <TurnedPlaza lot={lot} tier={tier} />}
          {lot.use === "servers" && <ServerYard lot={lot} tier={tier} />}
          {lot.use === "city" && cityTowers(lot, tier).map((t, i) => <Tower key={i} t={t} />)}
        </group>
      ))}
      {guide && (
        <group position={guide.position} rotation-y={guide.rotationY}>
          <GuidePlaza tier={tier} />
        </group>
      )}
    </StaticMerge>
  );
}

/* --------------------------------------------------------------- trees */

/**
 * Late Checkout trees (round, pine, tall round; lime and yellow-green crowns) built from kit pieces, so they
 * join the decor merge: no extra draw calls at all (kit <Trees> would add four on High). Low draws fewer.
 */
function MergedTrees({ items, tier }: { items: ScatterItem[]; tier: Tier }) {
  const keep = TIERS[tier].decorDensity;
  const visible = keep >= 1 ? items : items.filter((_, i) => (i * 0.618) % 1 < keep);
  return (
    <>
      {visible.map((t, i) => {
        const k = t.scale;
        const pine = t.variant === 1;
        const [cx, cy] = pine ? [1.06, 2.1] : t.variant === 2 ? [1.1, 1.75] : [1.4, 1.25];
        // Crown sits on the trunk: cone centred on its middle, icosahedron overlapping the trunk top.
        const y = pine ? 1.4 + cy / 2 : 1.3 + cy * 0.75;
        return (
          <group key={i} position={t.position} rotation-y={t.rotationY}>
            <Solid s={[0.26 * k, 1.7 * k, 0.26 * k]} p={[0, 0.85 * k, 0]} c={FP.trunk} />
            <Solid
              s={[cx * k, cy * k, cx * k]}
              p={[0, y * k, 0]}
              c={pick(FP.treeLeaves, i + t.variant)}
              shape={pine ? "cone6" : "crown"}
            />
          </group>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------- street pieces */

/** Street lamp: arm along local +X, lime head. */
function Lamp({ p, r = 0 }: { p: Vec3; r?: number }) {
  return (
    <group position={p} rotation-y={r}>
      <Solid s={[0.3, 0.2, 0.3]} p={[0, 0.1, 0]} c={FP.graphite} />
      <Solid s={[0.1, 3.4, 0.1]} p={[0, 1.7, 0]} c={FP.graphite} />
      <Solid s={[0.75, 0.08, 0.08]} p={[0.33, 3.38, 0]} c={FP.graphite} />
      <Glow s={[0.46, 0.12, 0.26]} p={[0.62, 3.3, 0]} />
    </group>
  );
}

/** Bench facing local +Z. */
function Bench({ p, r = 0, seat = FP.concrete }: { p: Vec3; r?: number; seat?: string }) {
  return (
    <group position={p} rotation-y={r}>
      <Solid s={[1.7, 0.12, 0.52]} p={[0, 0.46, 0]} c={seat} />
      <Solid s={[1.7, 0.42, 0.1]} p={[0, 0.78, -0.22]} c={seat} />
      {[-0.65, 0.65].map((x) => (
        <Solid key={x} s={[0.12, 0.42, 0.46]} p={[x, 0.21, 0]} c={FP.graphite} />
      ))}
    </group>
  );
}

/** Round planter with a little low-poly tree (Late Checkout lime crowns). */
function Planter({ p, tone = 0 }: { p: Vec3; tone?: number }) {
  return (
    <group position={p}>
      <Solid s={[0.55, 0.6, 0.55]} p={[0, 0.3, 0]} c={FP.concreteShade} shape="cyl8" />
      <Solid s={[0.08, 0.7, 0.08]} p={[0, 0.9, 0]} c={FP.trunk} />
      <Solid s={[0.62, 0.7, 0.62]} p={[0, 1.45, 0]} c={pick(FP.treeLeaves, tone)} shape="crown" />
    </group>
  );
}

/** Pavement strip along the road side of every lot, with two lamps facing the road. */
function LotFront({ lot, tier }: { lot: Lot; tier: Tier }) {
  const { xMax } = lotBox(lot);
  const z = LOT_FRONT - 0.9;
  return (
    <>
      <Solid s={[xMax * 2 + 0.8, 0.06, 1.5]} p={[0, 0.03, z]} c={FP.paving} />
      <Glow s={[xMax * 2 + 0.8, 0.03, 0.08]} p={[0, 0.07, z + 0.75]} />
      <Lamp p={[-xMax + 0.2, 0, z - 0.2]} r={-Math.PI / 2} />
      {tier === "high" && <Lamp p={[xMax - 0.2, 0, z - 0.2]} r={-Math.PI / 2} />}
    </>
  );
}

/* --------------------------------------------------------------- city */

function Tower({ t }: { t: TowerSpec }) {
  if (t.style === "pavilion") return <Pavilion t={t} />;
  const slab = t.style === "slab";
  const wall = slab ? FP.graphite : pick(FP.buildings, t.tone);
  const podium = 1.2;
  const bandStep = slab ? 2.2 : 1.5;
  const bands = Math.max(1, Math.floor((t.h - podium - 0.8) / bandStep));
  return (
    <group position={[t.x, 0, t.z]}>
      <Solid s={[t.w + 1.4, 0.12, t.d + 1.4]} p={[0, 0.06, 0]} c={FP.paving} />
      <Solid s={[t.w + 0.5, podium, t.d + 0.5]} p={[0, podium / 2, 0]} c={slab ? FP.graphiteSoft : FP.concreteShade} />
      <Solid s={[t.w, t.h - podium, t.d]} p={[0, podium + (t.h - podium) / 2, 0]} c={wall} />
      {Array.from({ length: bands }, (_, i) => {
        const y = podium + 0.9 + i * bandStep;
        return slab ? (
          <Glow key={i} s={[t.w + 0.06, 0.12, t.d + 0.06]} p={[0, y, 0]} />
        ) : (
          <Solid key={i} s={[t.w + 0.06, 0.62, t.d + 0.06]} p={[0, y, 0]} c={t.tone % 2 ? FP.glass : FP.glassDark} />
        );
      })}
      {/* Lime corner light strip (road side) */}
      <Glow s={[0.14, t.h - podium - 0.4, 0.14]} p={[t.w / 2 - 0.02, podium + (t.h - podium) / 2, t.d / 2 - 0.02]} />
      {/* Roof: cap, plant box, antenna */}
      <Solid s={[t.w + 0.2, 0.3, t.d + 0.2]} p={[0, t.h + 0.15, 0]} c={slab ? FP.graphiteSoft : FP.graphite} />
      <Solid s={[t.w * 0.4, 0.8, t.d * 0.35]} p={[-t.w * 0.18, t.h + 0.7, -t.d * 0.18]} c={FP.concreteShade} />
      {t.tone % 3 === 0 && (
        // Rooftop garden
        <>
          <Solid s={[t.w * 0.38, 0.35, t.d * 0.3]} p={[t.w * 0.2, t.h + 0.47, -t.d * 0.22]} c={FP.leaves[0]!} />
          <Solid s={[0.55, 0.6, 0.55]} p={[t.w * 0.25, t.h + 1.0, -t.d * 0.22]} c={FP.treeLeaves[3]!} shape="crown" />
        </>
      )}
      {t.antenna && (
        <>
          <Solid s={[0.5, 0.3, 0.5]} p={[t.w * 0.2, t.h + 0.45, t.d * 0.15]} c={FP.graphite} />
          <Solid s={[0.09, 2.6, 0.09]} p={[0, t.h + 1.6, 0]} c={FP.graphite} />
        </>
      )}
    </group>
  );
}

/** Low glass pavilion with a concrete roof, a lime fascia line and solar panels. */
function Pavilion({ t }: { t: TowerSpec }) {
  const panels = Math.max(1, Math.floor(t.w / 2.2));
  return (
    <group position={[t.x, 0, t.z]}>
      <Solid s={[t.w + 1.2, 0.12, t.d + 1.2]} p={[0, 0.06, 0]} c={FP.paving} />
      <Solid s={[t.w - 0.4, t.h - 0.35, t.d - 0.4]} p={[0, (t.h - 0.35) / 2, 0]} c={FP.glass} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Solid
            key={`${sx}${sz}`}
            s={[0.22, t.h - 0.35, 0.22]}
            p={[(sx * (t.w - 0.4)) / 2, (t.h - 0.35) / 2, (sz * (t.d - 0.4)) / 2]}
            c={FP.concrete}
          />
        )),
      )}
      <Solid s={[t.w, 0.35, t.d]} p={[0, t.h - 0.17, 0]} c={pick(FP.buildings, t.tone)} />
      <Glow s={[t.w + 0.02, 0.07, 0.04]} p={[0, t.h - 0.28, t.d / 2 + 0.01]} />
      {t.w > 4 &&
        Array.from({ length: panels }, (_, i) => (
          <Solid
            key={i}
            s={[1.8, 0.06, t.d * 0.6]}
            p={[(i - (panels - 1) / 2) * 2.1, t.h + 0.25, 0]}
            r={[-0.3, 0, 0]}
            c={FP.glassDark}
          />
        ))}
    </group>
  );
}

/* ----------------------------------------------------------- monoliths */

function Monoliths({ lot, heights }: { lot: Lot; heights: number[] | null }) {
  const specs = monolithSpecs(lot, heights);
  const span = specs.length > 0 ? specs[specs.length - 1]!.x - specs[0]!.x + specs[0]!.w : 0;
  return (
    <>
      {/* Plinth with a lime edge line */}
      <Solid s={[span + 1.4, 0.5, 2.8]} p={[0, 0.25, -3.6]} c={FP.concreteShade} />
      <Glow s={[span + 1.42, 0.06, 0.06]} p={[0, 0.42, -2.2]} />
      {specs.map((m, i) => (
        <Monolith key={i} m={m} />
      ))}
      {/* A viewing spot in front */}
      <Solid s={[span + 1.4, 0.06, 2.6]} p={[0, 0.03, -0.6]} c={FP.paving} />
      <Bench p={[-2.2, 0.03, 0.2]} r={Math.PI} />
      <Bench p={[2.2, 0.03, 0.2]} r={Math.PI} />
    </>
  );
}

function Monolith({ m }: { m: MonolithSpec }) {
  const base = 0.5;
  const front = m.z + m.d / 2 + 0.03;
  return (
    <group position={[m.x, 0, 0]}>
      <Solid s={[m.w, m.h, m.d]} p={[0, base + m.h / 2, m.z]} c={FP.graphite} />
      <Glow s={[m.w + 0.08, 0.2, m.d + 0.08]} p={[0, base + m.h + 0.1, m.z]} />
      {/* Vertical lime seam up the face */}
      <Glow s={[0.08, m.h - 0.6, 0.04]} p={[-m.w / 2 + 0.22, base + m.h / 2, front]} />
      {m.placeholder ? (
        // Hatched "data coming" band (the site's placeholder look): heights here are not data.
        <>
          <Solid s={[m.w - 0.2, 1.3, 0.04]} p={[0, base + 1.2, front]} c={FP.night} />
          {[-0.5, -0.17, 0.17, 0.5].map((f) => (
            <Glow key={f} s={[0.1, 1.15, 0.03]} p={[f * (m.w - 0.9), base + 1.2, front + 0.03]} r={[0, 0, 0.6]} />
          ))}
        </>
      ) : (
        <Glow s={[m.w - 0.2, 0.12, 0.04]} p={[0, base + m.h - 0.5, front]} />
      )}
    </group>
  );
}

/* --------------------------------------------------------- server yard */

function ServerYard({ lot, tier }: { lot: Lot; tier: Tier }) {
  const box = lotBox(lot);
  const racks = rackSlots(lot, tier);
  const front = rackFront(lot);
  const rows = [...new Set(racks.map((r) => r.z))];
  const xs = racks.map((r) => r.x);
  const span = Math.max(...xs) - Math.min(...xs) + RACK.w;
  return (
    <>
      {/* Raised floor */}
      <Solid s={[box.xMax * 2, 0.12, -box.zBack + 0.6]} p={[0, 0.06, (0.6 + box.zBack) / 2]} c={FP.paving} />
      {/* Cold aisles: lime lines on the floor in front of each row */}
      {rows.map((z) => (
        <Glow key={z} s={[span, 0.03, 0.12]} p={[0, 0.13, z + front * (RACK.d / 2 + 0.7)]} />
      ))}
      {racks.map((r, i) => (
        // Rotated so the front (glass, LEDs) faces rackFront(): towards the camera on the camera side.
        <group key={i} position={[r.x, 0.12, r.z]} rotation-y={front < 0 ? Math.PI : 0}>
          <Solid s={[RACK.w, RACK.h, RACK.d]} p={[0, RACK.h / 2, 0]} c={i % 4 === 1 ? FP.graphiteSoft : FP.graphite} />
          <Solid s={[RACK.w + 0.04, 0.08, RACK.d + 0.04]} p={[0, RACK.h + 0.04, 0]} c={FP.concreteShade} />
          <Solid s={[RACK.w - 0.24, RACK.h - 0.5, 0.04]} p={[0, RACK.h / 2 - 0.05, RACK.d / 2 + 0.02]} c={FP.night} />
          {[0.55, 0.95, 1.35, 1.75].map((y) => (
            <Glow key={y} s={[RACK.w - 0.4, 0.05, 0.03]} p={[0, y, RACK.d / 2 + 0.045]} />
          ))}
        </group>
      ))}
      {/* Cable trays over each row */}
      {rows.map((z) => (
        <group key={z}>
          <Solid s={[span, 0.14, 0.34]} p={[0, RACK.h + 0.5, z]} c={FP.graphiteSoft} />
          <Glow s={[span, 0.04, 0.05]} p={[0, RACK.h + 0.42, z + front * 0.18]} />
          {[-1, 1].map((s) => (
            <Solid key={s} s={[0.1, 0.5, 0.1]} p={[(s * span) / 2, RACK.h + 0.25, z]} c={FP.graphite} />
          ))}
        </group>
      ))}
    </>
  );
}

/* ---------------------------------------------------- comparison plaza */

/** The comparison plaza turned (about the lot centre) to face the camera; see plazaFrame(). */
function TurnedPlaza({ lot, tier }: { lot: Lot; tier: Tier }) {
  const f = plazaFrame(lot);
  return (
    <group position={[0, 0, f.cz]} rotation-y={f.turn}>
      <group position={[0, 0, -f.cz]}>
        <ComparisonPlaza lot={lot} tier={tier} />
      </group>
    </group>
  );
}

/** "1956 vs now": a room-sized manila mainframe (phosphor lamps, tape reels, punch cards) beside one big lit chip. */
function ComparisonPlaza({ lot, tier }: { lot: Lot; tier: Tier }) {
  const box = lotBox(lot);
  const depth = box.zFront - box.zBack;
  const zMid = (box.zFront + box.zBack) / 2;
  const M = MAINFRAME;
  return (
    <>
      {/* Floor: manila "then" half, pale "now" half, a lime seam between */}
      <Solid s={[box.xMax, 0.1, depth]} p={[-box.xMax / 2, 0.05, zMid]} c={FP.manila} />
      <Solid s={[box.xMax, 0.1, depth]} p={[box.xMax / 2, 0.05, zMid]} c={FP.paving} />
      <Glow s={[0.18, 0.04, depth]} p={[0, 0.11, zMid]} />

      {/* THEN: mainframe cabinets */}
      {Array.from({ length: M.cabinets }, (_, c) => {
        const x = M.x0 + c * M.pitch;
        return (
          <group key={c} position={[x, 0.1, M.z]}>
            <Solid s={[M.w, M.h, M.d]} p={[0, M.h / 2, 0]} c={FP.manila} />
            <Solid s={[M.w + 0.08, 0.16, M.d + 0.08]} p={[0, M.h + 0.08, 0]} c={FP.concreteShade} />
            {/* Lamp panel (the phosphor lamps are blinkers) */}
            <Solid s={[M.w - 0.2, 1.3, 0.05]} p={[0, M.panelY, M.d / 2 + 0.02]} c={FP.night} />
            {/* Tape reels */}
            {[-0.4, 0.4].map((rx) => (
              <group key={rx} position={[rx, 1.75, M.d / 2 + 0.05]}>
                <Solid s={[0.36, 0.07, 0.36]} p={[0, 0, 0]} r={[Math.PI / 2, 0, 0]} c={FP.graphite} shape="cyl12" />
                <Solid s={[0.12, 0.09, 0.12]} p={[0, 0, 0.01]} r={[Math.PI / 2, 0, 0]} c={FP.manila} shape="cyl8" />
              </group>
            ))}
            <Phos s={[M.w - 0.3, 0.05, 0.03]} p={[0, 0.5, M.d / 2 + 0.02]} />
          </group>
        );
      })}
      {/* Punch-card stack on a low table */}
      <group position={[M.x0 - 0.2, 0.1, 0.5]}>
        <Solid s={[1.3, 0.5, 0.8]} p={[0, 0.25, 0]} c={FP.graphiteSoft} />
        {Array.from({ length: tier === "high" ? 6 : 3 }, (_, i) => (
          <Solid key={i} s={[0.9, 0.1, 0.42]} p={[0, 0.55 + i * 0.1, 0]} r={(i % 3) * 0.12 - 0.12} c={FP.manila} />
        ))}
      </group>
      {/* "1956" in phosphor on a low plinth */}
      <Solid s={[4.4, 0.55, 0.5]} p={[-3.25, 0.37, -2.1]} c={FP.graphite} />
      <SevenSeg text="1956" size={1.3} p={[-3.25, 0.74, -2.05]} phosphor />

      {/* NOW: one big glowing chip on a lit plinth (the scale contrast: a room of cabinets vs one chip), and a
          matching "NOW" label slab opposite "1956". Shape and words only: no numbers or claims. */}
      <group position={[CHIP.x, 0.1, CHIP.z]}>
        <Solid s={[2.0, CHIP.plinth, 2.0]} p={[0, CHIP.plinth / 2, 0]} c={FP.concrete} />
        <Glow s={[2.06, 0.14, 2.06]} p={[0, CHIP.plinth - 0.12, 0]} />
        <group position={[0, CHIP.plinth + 0.15, 0]} rotation-y={Math.PI / 4}>
          <Solid s={[1.9, 0.26, 1.9]} p={[0, 0, 0]} c={FP.graphite} />
          <Glow s={[1.0, 0.1, 1.0]} p={[0, 0.17, 0]} />
          {[-0.6, -0.3, 0, 0.3, 0.6].flatMap((o) => [
            <Solid key={`x${o}`} s={[0.12, 0.08, 0.34]} p={[o, -0.04, 1.1]} c={FP.concreteShade} />,
            <Solid key={`y${o}`} s={[0.12, 0.08, 0.34]} p={[o, -0.04, -1.1]} c={FP.concreteShade} />,
            <Solid key={`z${o}`} s={[0.34, 0.08, 0.12]} p={[1.1, -0.04, o]} c={FP.concreteShade} />,
            <Solid key={`w${o}`} s={[0.34, 0.08, 0.12]} p={[-1.1, -0.04, o]} c={FP.concreteShade} />,
          ])}
        </group>
      </group>
      <Solid s={[4.4, 0.55, 0.5]} p={[3.25, 0.37, -2.1]} c={FP.graphite} />
      <BarText text="NOW" size={1.3} p={[3.25, 0.74, -2.05]} />
      {/* Then -> now chevrons on the floor */}
      {[-1.4, 0, 1.4].map((x) => (
        <group key={x} position={[x + 0.2, 0.12, -0.6]}>
          <Glow s={[0.7, 0.03, 0.14]} p={[-0.2, 0, -0.22]} r={-0.7} />
          <Glow s={[0.7, 0.03, 0.14]} p={[-0.2, 0, 0.22]} r={0.7} />
        </group>
      ))}
      <Bench p={[-3.2, 0.1, 1.8]} r={Math.PI} seat={FP.manila} />
      <Bench p={[3.2, 0.1, 1.8]} r={Math.PI} />
    </>
  );
}

/** The chip pedestal on the "now" side (plaza frame), shared with its collider. */
const CHIP = { x: 3.4, z: -4.6, plinth: 1.3 } as const;

/* --------------------------------------------------------- guide plaza */

/**
 * Welcome spot round the guide (local +Z faces the road): a round pad joined to the curb by a lime rim,
 * benches turned towards the guide, planters, two lamps and an arch with a speech bubble behind it, so it
 * reads as "come and ask" from the road. No colliders: the approach stays open.
 */
function GuidePlaza({ tier }: { tier: Tier }) {
  return (
    <>
      {/* Pad: lime rim under a pale disc; both stay below the guide's own hover pad (y 0.04) */}
      <Glow s={[2.6, 0.02, 2.6]} p={[0, 0.01, 0]} shape="cyl12" />
      <Solid s={[2.35, 0.03, 2.35]} p={[0, 0.015, 0]} c={FP.paving} shape="cyl12" />
      {/* Benches facing the guide */}
      <Bench p={[-3.1, 0, 0.2]} r={Math.PI / 2} seat={FP.pink} />
      <Bench p={[3.1, 0, 0.2]} r={-Math.PI / 2} seat={FP.sky} />
      {/* Arch with a big speech bubble ("come and ask"), readable from the road */}
      <group position={[0, 0, -2.0]}>
        {[-1.9, 1.9].map((x) => (
          <Solid key={x} s={[0.24, 4.0, 0.24]} p={[x, 2.0, 0]} c={FP.graphite} />
        ))}
        <Solid s={[4.3, 0.36, 0.42]} p={[0, 4.12, 0]} c={FP.concrete} />
        <Glow s={[4.0, 0.06, 0.3]} p={[0, 3.91, 0]} />
        <Solid s={[1.35, 0.26, 1.0]} p={[0, 5.45, 0]} r={[Math.PI / 2, 0, 0]} c={FP.snow} shape="cyl12" />
        <Solid s={[0.3, 0.6, 0.2]} p={[-0.62, 4.55, 0]} r={[0, 0, 0.6]} c={FP.snow} />
        {[-0.48, 0, 0.48].map((x) => (
          <Glow key={x} s={[0.18, 0.18, 0.18]} p={[x, 5.45, 0.16]} shape="ball" />
        ))}
      </group>
      {tier === "high" && (
        <>
          <Planter p={[-1.9, 0, 1.5]} tone={0} />
          <Planter p={[1.9, 0, 1.5]} tone={1} />
        </>
      )}
      <Lamp p={[-2.5, 0, -1.3]} r={0} />
      <Lamp p={[2.5, 0, -1.3]} r={Math.PI} />
    </>
  );
}

/* ----------------------------------------------------------- colliders */

/** Fixed cuboid colliders for the tall decor only (towers, monoliths, racks, mainframe, pedestal). */
export function FutureColliders({ lots, tier, heights }: { lots: Lot[]; tier: Tier; heights: number[] | null }) {
  return (
    <>
      {lots.map((lot) => {
        const boxes: { half: Vec3; at: Vec3; turn?: number }[] = [];
        if (lot.use === "city") {
          for (const t of cityTowers(lot, tier)) {
            boxes.push({ half: [t.w / 2 + 0.2, t.h / 2, t.d / 2 + 0.2], at: [t.x, t.h / 2, t.z] });
          }
        } else if (lot.use === "monoliths") {
          const specs = monolithSpecs(lot, heights);
          const span = specs[specs.length - 1]!.x - specs[0]!.x + specs[0]!.w;
          const h = Math.max(...specs.map((m) => m.h)) + 0.5;
          boxes.push({ half: [span / 2 + 0.7, h / 2, 1.4], at: [0, h / 2, -3.6] });
        } else if (lot.use === "servers") {
          const racks = rackSlots(lot, tier);
          const xs = racks.map((r) => r.x);
          const zs = racks.map((r) => r.z);
          const x0 = Math.min(...xs) - RACK.w / 2;
          const x1 = Math.max(...xs) + RACK.w / 2;
          const z0 = Math.min(...zs) - RACK.d / 2;
          const z1 = Math.max(...zs) + RACK.d / 2;
          const h = RACK.h + 0.7;
          boxes.push({ half: [(x1 - x0) / 2, h / 2, (z1 - z0) / 2], at: [(x0 + x1) / 2, h / 2, (z0 + z1) / 2] });
        } else if (lot.use === "comparison") {
          const M = MAINFRAME;
          const f = plazaFrame(lot);
          const x0 = M.x0 - M.w / 2;
          const x1 = M.x0 + (M.cabinets - 1) * M.pitch + M.w / 2;
          const [mx, mz] = plazaToLot(f, (x0 + x1) / 2, M.z);
          const [px, pz] = plazaToLot(f, CHIP.x, CHIP.z);
          boxes.push({ half: [(x1 - x0) / 2, M.h / 2, M.d / 2], at: [mx, M.h / 2, mz], turn: f.turn });
          boxes.push({ half: [1.05, 0.8, 1.05], at: [px, 0.8, pz], turn: f.turn });
        }
        if (boxes.length === 0) return null;
        return (
          <RigidBody
            key={lot.id}
            type="fixed"
            colliders={false}
            position={lot.position}
            rotation={[0, lot.rotationY, 0]}
          >
            {boxes.map((b, i) => (
              <CuboidCollider key={i} args={b.half} position={b.at} rotation={[0, b.turn ?? 0, 0]} />
            ))}
          </RigidBody>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------ blinkers */

const LIME_ON = new THREE.Color(FP.lime);
const LIME_OFF = new THREE.Color(FP.graphiteSoft);
const PHOS_ON = new THREE.Color(FP.phosphor);
const PHOS_OFF = new THREE.Color(FP.phosphorOff).lerp(new THREE.Color(FP.phosphor), 0.15);
const TICK = 0.16;

/**
 * Every blinking light (rack LEDs, mainframe lamps, antenna tips, monolith beacons) as ONE instanced mesh.
 * Unlit, so the lamps read as lit in daylight. Colours flip a few times a second; reduced motion keeps every
 * lamp on and still. No allocations per frame.
 */
export function Blinkers({ points }: { points: BlinkPoint[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.16, 0.16, 0.08), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial(), []);
  const state = useRef({ acc: 0, tick: 0, still: false });

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    points.forEach((pt, i) => {
      o.position.set(pt.p[0], pt.p[1], pt.p[2]);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, pt.phosphor ? PHOS_ON : LIME_ON);
    });
    m.count = points.length;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    state.current.still = false;
  }, [points]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, dt) => {
    const m = ref.current;
    const s = state.current;
    if (!m || !m.instanceColor) return;
    if (motion.reduced) {
      if (!s.still) {
        for (let i = 0; i < points.length; i++) m.setColorAt(i, points[i]!.phosphor ? PHOS_ON : LIME_ON);
        m.instanceColor.needsUpdate = true;
        s.still = true;
      }
      return;
    }
    s.still = false;
    s.acc += dt;
    if (s.acc < TICK) return;
    s.acc = 0;
    s.tick++;
    for (let i = 0; i < points.length; i++) {
      const v = Math.sin(i * 91.7 + s.tick * 12.9898) * 43758.5453;
      const on = v - Math.floor(v) > (points[i]!.phosphor ? 0.4 : 0.25);
      m.setColorAt(i, points[i]!.phosphor ? (on ? PHOS_ON : PHOS_OFF) : on ? LIME_ON : LIME_OFF);
    }
    m.instanceColor.needsUpdate = true;
  });

  if (points.length === 0) return null;
  return <instancedMesh key={points.length} ref={ref} args={[geometry, material, points.length]} />;
}
