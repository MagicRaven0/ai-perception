"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { IslandLayout } from "@/lib/three/layout";
import { useStore } from "@/lib/store";
import { selectTier } from "@/lib/three/quality";
import { motion } from "@/lib/three/motion";
import { NPC_OUTFITS, SHARED } from "@/lib/three/palette";

/**
 * Background NPCs (docs/VISION.md, added 22 Nov 2026): generic faceless low-poly people standing around each
 * island so it feels lived-in. Not real people: no names, no labels, no sensors. Kept visually apart from the
 * anchor figures (no billboard, smaller, era outfits from NPC_OUTFITS).
 *
 * Cost: 4 instanced meshes per island (torso, head, legs, prop) whatever the count; positions come from
 * lib/three/layout.ts. Idle sway and an occasional head turn are matrix updates in one frame loop, skipped
 * while the island is off-screen and frozen under prefers-reduced-motion. The low tier draws every other NPC.
 */

const SCALE = 0.9;
const torsoGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.3, 7).translate(0, 0.85, 0);
const headGeo = new THREE.IcosahedronGeometry(0.34, 0);
const legsGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.24, 7).translate(0, 0.12, 0);
const PROP = {
  clipboard: {
    geo: new THREE.BoxGeometry(0.34, 0.44, 0.05),
    at: new THREE.Vector3(0.2, 1.05, 0.4),
    tilt: -0.5,
    colour: SHARED.cream,
  },
  phone: {
    geo: new THREE.BoxGeometry(0.1, 0.18, 0.03),
    at: new THREE.Vector3(0.26, 1.4, 0.32),
    tilt: -0.3,
    colour: SHARED.figureDark,
  },
  laptop: {
    geo: new THREE.BoxGeometry(0.5, 0.04, 0.34),
    at: new THREE.Vector3(0, 1.05, 0.42),
    tilt: 0,
    colour: SHARED.figureDark,
  },
} as const;

const base = new THREE.Matrix4();
const sway = new THREE.Matrix4();
const local = new THREE.Matrix4();
const out = new THREE.Matrix4();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const v = new THREE.Vector3();
const one = new THREE.Vector3(1, 1, 1);
const scaled = new THREE.Vector3(SCALE, SCALE, SCALE);
const frustum = new THREE.Frustum();
const projView = new THREE.Matrix4();
const colour = new THREE.Color();

export function Npcs({ island }: { island: IslandLayout }) {
  const tier = useStore(selectTier);
  const npcs = useMemo(
    () => (tier === "low" ? island.npcs.filter((_, i) => i % 2 === 0) : island.npcs),
    [island.npcs, tier],
  );
  const outfit = NPC_OUTFITS[island.eraId];
  const prop = PROP[outfit.prop];

  const torso = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.InstancedMesh>(null);
  const legs = useRef<THREE.InstancedMesh>(null);
  const props = useRef<THREE.InstancedMesh>(null);

  const bounds = useMemo(
    () =>
      new THREE.Sphere(
        new THREE.Vector3(island.geometry.center[0], 1, island.geometry.center[1]),
        island.geometry.radius,
      ),
    [island.geometry],
  );

  /** Writes every instance matrix for time t (t = 0: rest pose). */
  const pose = (t: number) => {
    const meshes = [torso.current, head.current, legs.current, props.current];
    if (meshes.some((m) => !m)) return;
    npcs.forEach((n, i) => {
      const s = n.seed;
      base.compose(v.set(...n.position), q.setFromEuler(e.set(0, n.rotationY, 0)), scaled);
      // Gentle weight shift from the feet, and now and then a slow look to one side.
      const lean = t ? Math.sin(t * 0.9 + s) * 0.035 : 0;
      const look = t ? Math.max(0, Math.sin(t * 0.22 + s * 1.7)) ** 3 * 0.9 * (s % 2 ? 1 : -1) : 0;
      sway.makeRotationFromEuler(e.set(0, 0, lean));
      const body = out.multiplyMatrices(base, sway).clone();
      legs.current!.setMatrixAt(i, base);
      torso.current!.setMatrixAt(i, body);
      local.compose(v.set(0, 1.8, 0), q.setFromEuler(e.set(0, look, 0)), one);
      head.current!.setMatrixAt(i, out.multiplyMatrices(body, local));
      local.compose(prop.at, q.setFromEuler(e.set(prop.tilt, 0, 0)), one);
      props.current!.setMatrixAt(i, out.multiplyMatrices(body, local));
    });
    meshes.forEach((m) => (m!.instanceMatrix.needsUpdate = true));
  };

  useLayoutEffect(() => {
    npcs.forEach((n, i) => {
      torso.current?.setColorAt(i, colour.set(outfit.tops[n.seed % outfit.tops.length]));
      legs.current?.setColorAt(i, colour.set(outfit.bottoms[(n.seed * 7) % outfit.bottoms.length]));
    });
    if (torso.current?.instanceColor) torso.current.instanceColor.needsUpdate = true;
    if (legs.current?.instanceColor) legs.current.instanceColor.needsUpdate = true;
    pose(0);
    // Development only: lets the e2e tests count NPCs per island.
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      const w = window as unknown as { __npcCounts?: Record<string, number> };
      (w.__npcCounts ??= {})[island.eraId] = npcs.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npcs, outfit]);

  useFrame((state) => {
    if (motion.reduced || !npcs.length) return;
    projView.multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projView);
    if (!frustum.intersectsSphere(bounds)) return; // island off-screen: hold the last pose
    pose(state.clock.elapsedTime);
  });

  if (!npcs.length) return null;
  const n = npcs.length;
  return (
    <group>
      <instancedMesh ref={torso} args={[torsoGeo, undefined, n]} frustumCulled={false}>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={head} args={[headGeo, undefined, n]} frustumCulled={false}>
        <meshLambertMaterial color={SHARED.figure} flatShading />
      </instancedMesh>
      <instancedMesh ref={legs} args={[legsGeo, undefined, n]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={props} args={[prop.geo, undefined, n]} frustumCulled={false}>
        <meshLambertMaterial color={prop.colour} />
      </instancedMesh>
    </group>
  );
}
