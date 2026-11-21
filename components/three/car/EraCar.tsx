"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EraId } from "@/lib/content/schema";
import { useStore } from "@/lib/store";
import { motion } from "@/lib/three/motion";
import { CAR_COLOURS } from "@/lib/three/palette";

/**
 * The player's car body, which changes with the era of the island it is on (VISION: "the car transforms").
 * The Past: rounded 1950s sedan with chrome bumpers and tail fins. The Jobs Era: boxy hatchback with a pink
 * stripe. The Future: low electric pod with thin wheels, an LED light bar and a lime glow strip, hovering a bit.
 *
 * All three are made from the same parts (unit boxes scaled per era), so a change of era is a ~1.2 s morph:
 * every part slides, stretches and recolours into the next era's shape while you keep driving. With reduced
 * motion the shape swaps instantly. The physics collider never changes, so handling never glitches.
 * Reads the era from the store via subscribe (no re-render); animation runs in useFrame without allocations.
 */

type ColourKey = keyof (typeof CAR_COLOURS)["era-1"];
type Spec = { p: [number, number, number]; s: [number, number, number]; c: ColourKey };

const HIDDEN = (p: [number, number, number], c: ColourKey): Spec => ({ p, s: [0.001, 0.001, 0.001], c });

const PARTS = [
  "body",
  "cabin",
  "glass",
  "bumperF",
  "bumperR",
  "stripe",
  "glow",
  "lightL",
  "lightR",
  "finL",
  "finR",
] as const;
type Part = (typeof PARTS)[number];

/** Parts that cast shadows (the big ones); the rest are small details. */
const SHADOW_PARTS = new Set<Part>(["body", "cabin"]);
/** Parts that glow. */
const EMISSIVE_PARTS = new Set<Part>(["lightL", "lightR", "glow"]);

const SHAPES: Record<EraId, Record<Part, Spec>> = {
  "era-1": {
    body: { p: [0, 0.14, 0.05], s: [1.78, 0.56, 3.25], c: "body" },
    cabin: { p: [0, 0.66, -0.3], s: [1.4, 0.5, 1.45], c: "cabin" },
    glass: { p: [0, 0.64, 0.44], s: [1.3, 0.34, 0.06], c: "glass" },
    bumperF: { p: [0, 0, 1.68], s: [1.86, 0.14, 0.12], c: "trim" },
    bumperR: { p: [0, 0, -1.58], s: [1.86, 0.14, 0.12], c: "trim" },
    stripe: HIDDEN([0, 0.22, 0], "trim"),
    glow: HIDDEN([0, -0.06, 0], "glow"),
    lightL: { p: [0.6, 0.2, 1.64], s: [0.3, 0.3, 0.05], c: "light" },
    lightR: { p: [-0.6, 0.2, 1.64], s: [0.3, 0.3, 0.05], c: "light" },
    finL: { p: [0.78, 0.5, -1.25], s: [0.08, 0.3, 0.7], c: "body" },
    finR: { p: [-0.78, 0.5, -1.25], s: [0.08, 0.3, 0.7], c: "body" },
  },
  "era-2": {
    body: { p: [0, 0.12, 0], s: [1.72, 0.62, 2.8], c: "body" },
    cabin: { p: [0, 0.68, -0.35], s: [1.56, 0.56, 1.8], c: "cabin" },
    glass: { p: [0, 0.68, 0.57], s: [1.45, 0.4, 0.06], c: "glass" },
    bumperF: { p: [0, -0.02, 1.42], s: [1.76, 0.16, 0.1], c: "wheel" },
    bumperR: { p: [0, -0.02, -1.42], s: [1.76, 0.16, 0.1], c: "wheel" },
    stripe: { p: [0, 0.44, 0.35], s: [0.36, 0.03, 2.4], c: "trim" }, // racing stripe over the bonnet
    glow: HIDDEN([0, -0.06, 0], "glow"),
    lightL: { p: [0.55, 0.22, 1.41], s: [0.38, 0.14, 0.04], c: "light" },
    lightR: { p: [-0.55, 0.22, 1.41], s: [0.38, 0.14, 0.04], c: "light" },
    finL: HIDDEN([0.78, 0.4, -1.2], "body"),
    finR: HIDDEN([-0.78, 0.4, -1.2], "body"),
  },
  "era-3": {
    body: { p: [0, 0.16, 0], s: [1.62, 0.42, 3.0], c: "body" },
    cabin: { p: [0, 0.58, -0.05], s: [1.32, 0.46, 1.95], c: "cabin" },
    glass: { p: [0, 0.6, 0.93], s: [1.2, 0.36, 0.06], c: "glass" },
    bumperF: HIDDEN([0, 0, 1.5], "wheel"),
    bumperR: HIDDEN([0, 0, -1.5], "wheel"),
    stripe: HIDDEN([0, 0.22, 0], "trim"),
    glow: { p: [0, -0.02, 0], s: [1.76, 0.07, 3.12], c: "glow" }, // wider than the body: reads from above
    lightL: { p: [0.5, 0.2, 1.51], s: [0.5, 0.06, 0.04], c: "light" },
    lightR: { p: [-0.5, 0.2, 1.51], s: [0.5, 0.06, 0.04], c: "light" },
    finL: HIDDEN([0.7, 0.4, -1.2], "body"),
    finR: HIDDEN([-0.7, 0.4, -1.2], "body"),
  },
};

/** Wheel radius / width scale and how high the body floats, per era. */
const WHEEL_SHAPE: Record<EraId, { r: number; w: number; lift: number }> = {
  "era-1": { r: 1, w: 1, lift: 0 },
  "era-2": { r: 0.9, w: 1, lift: 0 },
  "era-3": { r: 0.85, w: 0.55, lift: 0.1 },
};

/** Top-speed multiplier per era: the old sedan is a little slower, the electric pod a little quicker. */
export const CAR_HANDLING: Record<EraId, number> = { "era-1": 0.85, "era-2": 1, "era-3": 1.15 };

export const WHEEL_R = 0.42;
const WHEELS: [number, number][] = [
  [0.92, 0.95],
  [-0.92, 0.95],
  [0.92, -0.95],
  [-0.92, -0.95],
];
const MORPH_SECONDS = 1.2;

type Live = { pos: THREE.Vector3; scale: THREE.Vector3; colour: THREE.Color; glow: number };
type Snapshot = Record<Part, Live>;

const makeSnapshot = (): Snapshot =>
  Object.fromEntries(
    PARTS.map((p) => [p, { pos: new THREE.Vector3(), scale: new THREE.Vector3(), colour: new THREE.Color(), glow: 0 }]),
  ) as Snapshot;

function fill(target: Snapshot, era: EraId) {
  for (const part of PARTS) {
    const spec = SHAPES[era][part];
    target[part].pos.set(...spec.p);
    target[part].scale.set(...spec.s);
    target[part].colour.set(CAR_COLOURS[era][spec.c]);
    target[part].glow = EMISSIVE_PARTS.has(part) && spec.s[0] > 0.01 ? 0.9 : 0;
  }
}

export function EraCar({
  initialEra,
  speedRef,
}: {
  initialEra: EraId;
  /** Signed speed in m/s, written by the vehicle every frame (drives wheel spin). */
  speedRef: MutableRefObject<{ speed: number }>;
}) {
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const wheelGeo = useMemo(() => new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.3, 14), []);
  const materials = useMemo(
    () =>
      Object.fromEntries(PARTS.map((p) => [p, new THREE.MeshLambertMaterial()])) as Record<
        Part,
        THREE.MeshLambertMaterial
      >,
    [],
  );
  const wheelMat = useMemo(() => new THREE.MeshLambertMaterial(), []);
  useEffect(
    () => () => {
      box.dispose();
      wheelGeo.dispose();
      wheelMat.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
    [box, wheelGeo, wheelMat, materials],
  );

  const meshes = useRef<Partial<Record<Part, THREE.Mesh>>>({});
  const wheels = useRef<(THREE.Mesh | null)[]>([]);
  const root = useRef<THREE.Group>(null);

  // Morph state, all preallocated.
  const m = useRef({
    era: initialEra,
    target: initialEra,
    t: 1,
    from: makeSnapshot(),
    to: makeSnapshot(),
    now: makeSnapshot(),
    wheelFrom: { ...WHEEL_SHAPE[initialEra] },
    wheel: { ...WHEEL_SHAPE[initialEra] },
    spin: 0,
    applied: false,
  });

  useEffect(() => {
    const s = m.current;
    fill(s.from, s.era);
    fill(s.to, s.era);
    fill(s.now, s.era);
    // The frame loop can run before this effect: re-apply once the shapes are filled in.
    s.applied = false;
    s.target = useStore.getState().activeEra;
    return useStore.subscribe((st, prev) => {
      if (st.activeEra !== prev.activeEra) m.current.target = st.activeEra;
    });
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const s = m.current;

    // Start a morph when the era changes (from wherever the car is now, so quick back-and-forth is smooth).
    if (s.target !== s.era) {
      for (const part of PARTS) {
        s.from[part].pos.copy(s.now[part].pos);
        s.from[part].scale.copy(s.now[part].scale);
        s.from[part].colour.copy(s.now[part].colour);
        s.from[part].glow = s.now[part].glow;
      }
      s.wheelFrom.r = s.wheel.r;
      s.wheelFrom.w = s.wheel.w;
      s.wheelFrom.lift = s.wheel.lift;
      fill(s.to, s.target);
      s.era = s.target;
      s.t = motion.reduced ? 1 : 0;
      s.applied = false;
    }

    const animating = s.t < 1;
    if (animating) s.t = Math.min(1, s.t + dt / MORPH_SECONDS);
    if (animating || !s.applied) {
      const k = s.t * s.t * (3 - 2 * s.t); // smoothstep
      for (const part of PARTS) {
        const a = s.from[part];
        const b = s.to[part];
        const n = s.now[part];
        n.pos.lerpVectors(a.pos, b.pos, k);
        n.scale.lerpVectors(a.scale, b.scale, k);
        n.colour.lerpColors(a.colour, b.colour, k);
        n.glow = a.glow + (b.glow - a.glow) * k;
        const mesh = meshes.current[part];
        if (mesh) {
          mesh.position.copy(n.pos);
          mesh.scale.copy(n.scale);
          const mat = mesh.material as THREE.MeshLambertMaterial; // via the mesh: memo values stay untouched
          mat.color.copy(n.colour);
          mat.emissive.copy(n.colour);
          mat.emissiveIntensity = n.glow;
        }
      }
      const w = WHEEL_SHAPE[s.era];
      s.wheel.r = s.wheelFrom.r + (w.r - s.wheelFrom.r) * k;
      s.wheel.w = s.wheelFrom.w + (w.w - s.wheelFrom.w) * k;
      s.wheel.lift = s.wheelFrom.lift + (w.lift - s.wheelFrom.lift) * k;
      const firstWheel = wheels.current[0];
      if (firstWheel) (firstWheel.material as THREE.MeshLambertMaterial).color.set(CAR_COLOURS[s.era].wheel);
      // A small "pop" mid-morph so the change reads as a transformation, not a glitch.
      if (root.current) {
        const pop = motion.reduced ? 1 : 1 + Math.sin(Math.PI * k) * 0.08;
        root.current.scale.setScalar(pop);
        root.current.position.y = s.wheel.lift;
      }
      if (!animating) s.applied = true;
    }

    // Wheels: radius/width per era, spin with the car's speed.
    s.spin += (speedRef.current.speed * dt) / (WHEEL_R * s.wheel.r);
    for (const wheel of wheels.current) {
      if (!wheel) continue;
      wheel.rotation.y = s.spin; // the parent group lays the cylinder on its side; spin about its own axis
      wheel.scale.set(s.wheel.r, s.wheel.w, s.wheel.r);
    }
  });

  return (
    <group ref={root}>
      {PARTS.map((part) => (
        <mesh
          key={part}
          ref={(mesh) => {
            if (mesh) meshes.current[part] = mesh;
          }}
          geometry={box}
          material={materials[part]}
          castShadow={SHADOW_PARTS.has(part)}
          scale={0.001}
        />
      ))}
      {WHEELS.map(([x, z], i) => (
        <group key={i} position={[x, -0.08, z]} rotation-z={Math.PI / 2}>
          <mesh
            ref={(mesh) => {
              wheels.current[i] = mesh;
            }}
            geometry={wheelGeo}
            material={wheelMat}
            castShadow
          />
        </group>
      ))}
    </group>
  );
}
