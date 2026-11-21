"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "@/lib/three/motion";
import { CAMPUS } from "./palette";

/**
 * Fountain jets: one InstancedMesh (1 draw call, no shadows) of slim water cones that gently rise and fall.
 * Kept outside the campus <StaticMerge> because it moves. Reduced motion: holds the rest pose.
 * No allocations per frame (one shared Object3D).
 */

const tmp = new THREE.Object3D();
const REST = 1;

type Jets = readonly [number, number, number][];

function place(mesh: THREE.InstancedMesh, positions: Jets, t: number) {
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i]!;
    const k = motion.reduced ? REST : 0.85 + 0.25 * Math.sin(t * 1.6 + i * 2.1);
    tmp.position.set(p[0], p[1], p[2]);
    tmp.scale.set(1, k, 1);
    tmp.updateMatrix();
    mesh.setMatrixAt(i, tmp.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function FountainJets({ positions }: { positions: Jets }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  // Cone with its base at y = 0, so scaling y grows the jet upwards.
  const geometry = useMemo(() => new THREE.ConeGeometry(0.22, 1.5, 6, 1, true).translate(0, 0.75, 0), []);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    place(mesh, positions, 0);
    mesh.computeBoundingSphere();
    // Leave room for the tallest jet in the culling sphere.
    if (mesh.boundingSphere) mesh.boundingSphere.radius += 1;
  }, [positions]);

  const last = useRef(-1);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    if (motion.reduced) {
      if (last.current !== REST) {
        place(mesh, positions, 0);
        last.current = REST;
      }
      return;
    }
    last.current = 0;
    place(mesh, positions, clock.elapsedTime);
  });

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, positions.length]} frustumCulled>
      <meshLambertMaterial color={CAMPUS.jet} emissive={CAMPUS.jet} emissiveIntensity={0.25} flatShading />
    </instancedMesh>
  );
}
