"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { FUTURE_PALETTE as FP } from "@/lib/three/palettes/future";

/**
 * Future island kit: shared unit geometries and one material per colour, plus tiny primitives that every
 * Future model and decor piece is built from.
 *
 * Draw calls: everything here is plain Lambert, so <StaticMerge> bakes it into one mesh per bucket (emissive
 * colour + shadow flags). To keep the bucket count (= draw calls) tiny:
 * - <Solid>: casts and receives shadows (buildings, towers, racks, small props too);
 * - <Flat>:  receives only (kept for ground-level pieces; costs its own bucket, so the island avoids it);
 * - <Glow>:  lime light (strips, signs, lamp heads, screens);
 * - <Phos>:  1956 phosphor-green light (the "then" side of the comparison plaza only).
 * <Glow> and <Phos> are NOT emissive: they are over-bright albedo (GLOW_GAIN x the colour, above 1 in linear
 * light) with the same shadow flags as <Solid>, so they land in the Solid bucket and cost no draw call of their
 * own. Lit by the golden-hour sun and fill they clip to a luminous lime, close to what an emissive material
 * gives, with no post-processing. That saves one draw call per building and two for the decor, on both tiers.
 * The vertex colours StaticMerge bakes keep values above 1, so the merged mesh glows the same.
 *
 * Owned by IslandFuture: the provider creates the kit on mount and disposes every geometry and material on
 * unmount (leaving /explore unmounts the world).
 */

export type V3 = [number, number, number];

/** Albedo gain for glow pieces (linear light; the brightest channel clips in sunlight, stays lime in shade). */
const GLOW_GAIN = 1.55;

type Kit = {
  box: THREE.BoxGeometry;
  cyl8: THREE.CylinderGeometry;
  cyl12: THREE.CylinderGeometry;
  cone6: THREE.ConeGeometry;
  tri: THREE.CylinderGeometry;
  dome: THREE.SphereGeometry;
  ball: THREE.IcosahedronGeometry;
  crown: THREE.IcosahedronGeometry;
  material: (colour: string, flavour: Flavour) => THREE.MeshLambertMaterial;
  dispose: () => void;
};

type Flavour = "solid" | "glow" | "phos";

const KitContext = createContext<Kit | null>(null);

export function FutureKitProvider({ children }: { children: ReactNode }) {
  const kit = useMemo<Kit>(() => {
    const materials = new Map<string, THREE.MeshLambertMaterial>();
    return {
      box: new THREE.BoxGeometry(1, 1, 1),
      cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
      cyl12: new THREE.CylinderGeometry(1, 1, 1, 12),
      cone6: new THREE.ConeGeometry(1, 1, 6),
      tri: new THREE.CylinderGeometry(1, 1, 1, 3),
      dome: new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      ball: new THREE.IcosahedronGeometry(1, 1),
      crown: new THREE.IcosahedronGeometry(1, 0),
      material(colour, flavour) {
        const key = `${flavour}:${colour}`;
        let m = materials.get(key);
        if (!m) {
          m = new THREE.MeshLambertMaterial({ color: colour });
          if (flavour !== "solid") m.color.multiplyScalar(GLOW_GAIN);
          materials.set(key, m);
        }
        return m;
      },
      dispose() {
        [this.box, this.cyl8, this.cyl12, this.cone6, this.tri, this.dome, this.ball, this.crown].forEach((g) =>
          g.dispose(),
        );
        // GPU resources only: the JS objects stay valid (three re-uploads them if used again), so a
        // StrictMode effect replay in development never leaves meshes holding dead materials.
        materials.forEach((m) => m.dispose());
      },
    };
  }, []);

  useEffect(() => () => kit.dispose(), [kit]);

  return <KitContext.Provider value={kit}>{children}</KitContext.Provider>;
}

export function useKit(): Kit {
  const kit = useContext(KitContext);
  if (!kit) throw new Error("Future kit used outside <FutureKitProvider>");
  return kit;
}

/* ----------------------------------------------------------- primitives */

type Shape = "box" | "cyl8" | "cyl12" | "cone6" | "tri" | "dome" | "ball" | "crown";

type PrimProps = {
  /** Size: box = [w, h, d]; cylinders/cones/dome/ball = [radiusX, height (or radiusY), radiusZ]. */
  s: V3;
  p: V3;
  c?: string;
  /** Rotation (radians). A number is a rotation about Y. */
  r?: number | V3;
  shape?: Shape;
};

function Prim({
  s,
  p,
  c,
  r,
  shape = "box",
  flavour,
  cast,
  receive,
}: PrimProps & {
  flavour: Flavour;
  cast: boolean;
  receive: boolean;
}) {
  const kit = useKit();
  const colour = c ?? (flavour === "glow" ? FP.lime : flavour === "phos" ? FP.phosphor : FP.concrete);
  const rotation: V3 = typeof r === "number" ? [0, r, 0] : (r ?? [0, 0, 0]);
  return (
    <mesh
      geometry={kit[shape]}
      material={kit.material(colour, flavour)}
      position={p}
      rotation={rotation}
      scale={s}
      castShadow={cast}
      receiveShadow={receive}
    />
  );
}

/** Solid piece: casts and receives shadows. */
export function Solid(props: PrimProps) {
  return <Prim {...props} flavour="solid" cast receive />;
}

/** Ground-level or tiny piece: receives shadows, casts none. */
export function Flat(props: PrimProps) {
  return <Prim {...props} flavour="solid" cast={false} receive />;
}

/** Lime light (over-bright albedo, same bucket as <Solid>). */
export function Glow(props: PrimProps) {
  return <Prim {...props} flavour="glow" cast receive />;
}

/** 1956 phosphor-green light (over-bright albedo, same bucket as <Solid>). */
export function Phos(props: PrimProps) {
  return <Prim {...props} flavour="phos" cast receive />;
}

/* ------------------------------------------------------- seven segments */

// Segments a..g as [x, y, horizontal] in a 1 x 2 cell (y up from the baseline).
const SEG: Record<string, [number, number, boolean]> = {
  a: [0, 2, true],
  b: [0.5, 1.5, false],
  c: [0.5, 0.5, false],
  d: [0, 0, true],
  e: [-0.5, 0.5, false],
  f: [-0.5, 1.5, false],
  g: [0, 1, true],
};
const DIGITS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgedc",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcfgd",
};

/**
 * A number in glowing seven-segment digits, built from boxes (no font download). Centred on x, baseline at
 * y = 0, facing +Z. `size` is the digit height.
 */
export function SevenSeg({
  text,
  size = 1,
  p,
  phosphor = false,
}: {
  text: string;
  size?: number;
  p: V3;
  phosphor?: boolean;
}) {
  const unit = size / 2;
  const t = unit * 0.16;
  const pitch = unit * 1.45;
  const chars = text.split("");
  const width = (chars.length - 1) * pitch;
  const Piece = phosphor ? Phos : Glow;
  return (
    <group position={p}>
      {chars.flatMap((ch, i) =>
        (DIGITS[ch] ?? "").split("").map((seg) => {
          const [sx, sy, horizontal] = SEG[seg]!;
          const x = -width / 2 + i * pitch + sx * unit;
          const y = sy * unit;
          return <Piece key={`${i}${seg}`} s={horizontal ? [unit * 0.86, t, t] : [t, unit * 0.86, t]} p={[x, y, 0]} />;
        }),
      )}
    </group>
  );
}

/* ---------------------------------------------------------- bar letters */

// Strokes as [x0, y0, x1, y1] in a 1 x 2 cell (x -0.5..0.5, y up from the baseline). Only the letters the island
// writes ("NOW", the counterpart to the plaza's "1956"): add more here if a label ever needs them.
const STROKES: Record<string, [number, number, number, number][]> = {
  N: [
    [-0.5, 0, -0.5, 2],
    [0.5, 0, 0.5, 2],
    [-0.5, 2, 0.5, 0],
  ],
  O: [
    [-0.5, 0, -0.5, 2],
    [0.5, 0, 0.5, 2],
    [-0.5, 2, 0.5, 2],
    [-0.5, 0, 0.5, 0],
  ],
  W: [
    [-0.5, 0, -0.5, 2],
    [0.5, 0, 0.5, 2],
    [-0.5, 0, 0, 1],
    [0, 1, 0.5, 0],
  ],
};

/**
 * A word in glowing bar letters (same look as <SevenSeg>), built from boxes. Centred on x, baseline at y = 0,
 * facing +Z. `size` is the letter height.
 */
export function BarText({ text, size = 1, p }: { text: string; size?: number; p: V3 }) {
  const unit = size / 2;
  const t = unit * 0.16;
  const pitch = unit * 1.6;
  const chars = text.split("");
  const width = (chars.length - 1) * pitch;
  return (
    <group position={p}>
      {chars.flatMap((ch, i) =>
        (STROKES[ch] ?? []).map(([x0, y0, x1, y1], k) => {
          const dx = (x1 - x0) * unit;
          const dy = (y1 - y0) * unit;
          const x = -width / 2 + i * pitch + ((x0 + x1) / 2) * unit;
          const y = ((y0 + y1) / 2) * unit;
          return (
            <Glow key={`${i}${k}`} s={[Math.hypot(dx, dy) + t, t, t]} p={[x, y, 0]} r={[0, 0, Math.atan2(dy, dx)]} />
          );
        }),
      )}
    </group>
  );
}
