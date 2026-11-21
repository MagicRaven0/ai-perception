"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "@/lib/three/motion";
import { PAST } from "@/lib/three/palettes/past";
import { makeReelTemplate, type LightSpot, type ReelSpot } from "./geo";

/**
 * THE PAST: every phosphor lamp on the island (decor + buildings) as ONE instanced mesh, and every tape reel
 * as ONE instanced mesh. Lamps blink in a slow pseudo-random pattern (colour updates about 8 times a second,
 * no allocations); reels turn. Reduced motion: a fixed on/off pattern and still reels.
 * Neither casts shadows (tiny props), so neither needs a custom depth material.
 */

const BLINK_HZ = 8;
const ON = new THREE.Color(PAST.phosphor);
const SOFT = new THREE.Color(PAST.phosphorSoft);
const OFF = new THREE.Color(PAST.phosphorDim);

/** 0..1 hash of a lamp seed and a time step. */
function lit(seed: number, stepIndex: number) {
  const s = Math.sin(seed * 12.9898 + stepIndex * 78.233) * 43758.5453;
  return s - Math.floor(s) > 0.42;
}

export function PastLamps({ lights }: { lights: LightSpot[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff" }), []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  // Each lamp re-rolls on its own beat (every 2 to 6 steps), so the panels shimmer rather than flash together.
  const periods = useMemo(() => lights.map((l) => 2 + (Math.floor(Math.abs(l.seed) * 3.7) % 5)), [lights]);
  const lastStep = useRef(-1);

  const paint = (stepIndex: number) => {
    const m = ref.current;
    if (!m) return;
    const arr = m.instanceColor?.array as Float32Array | undefined;
    if (!arr) return;
    for (let i = 0; i < lights.length; i++) {
      const l = lights[i]!;
      const c = l.steady ? SOFT : lit(l.seed, Math.floor(stepIndex / periods[i]!)) ? ON : OFF;
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    m.instanceColor!.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    lights.forEach((l, i) => {
      m.setMatrixAt(i, l.matrix);
      m.setColorAt(i, ON);
    });
    m.count = lights.length;
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    lastStep.current = -1;
    paint(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lights]);

  useFrame((state) => {
    if (motion.reduced) {
      if (lastStep.current !== 0) {
        lastStep.current = 0;
        paint(0);
      }
      return;
    }
    const s = Math.floor(state.clock.elapsedTime * BLINK_HZ);
    if (s === lastStep.current) return;
    lastStep.current = s;
    paint(s);
  });

  if (lights.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, lights.length]} />;
}

const spin = new THREE.Matrix4();
const tmp = new THREE.Matrix4();

export function PastReels({ reels, material }: { reels: ReelSpot[]; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => makeReelTemplate(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    reels.forEach((r, i) => m.setMatrixAt(i, r.matrix));
    m.count = reels.length;
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [reels]);

  // Reduced motion: put every reel back to its rest angle once, then hold it.
  const atRest = useRef(true);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    if (motion.reduced) {
      if (!atRest.current) {
        for (let i = 0; i < reels.length; i++) m.setMatrixAt(i, reels[i]!.matrix);
        m.instanceMatrix.needsUpdate = true;
        atRest.current = true;
      }
      return;
    }
    atRest.current = false;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < reels.length; i++) {
      const r = reels[i]!;
      m.setMatrixAt(i, tmp.multiplyMatrices(r.matrix, spin.makeRotationZ((t * r.speed) % (Math.PI * 2))));
    }
    m.instanceMatrix.needsUpdate = true;
  });

  if (reels.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, reels.length]} />;
}
