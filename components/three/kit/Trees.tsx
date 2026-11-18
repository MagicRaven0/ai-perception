"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ScatterItem } from "@/lib/three/scatter";
import { useStore } from "@/lib/store";
import { selectTier, TIERS } from "@/lib/three/quality";
import { SHARED } from "@/lib/three/palette";

/**
 * SHARED KIT (read-only for island agents). Instanced low-poly trees: 2 draw calls for any number of trees.
 * Pass positions from scatterOnIsland(). Low tier draws fewer (decorDensity).
 * Shapes: 0 = round canopy, 1 = cone (pine), 2 = tall round. Colours are picked from `leaves` per tree.
 */

const tmp = new THREE.Object3D();
const colour = new THREE.Color();

/**
 * Own shadow-depth materials for the instanced meshes (same settings as three's default depth material).
 * Sharing three's default with ordinary meshes flips its shader program between instanced and plain casters
 * several times per shadow pass (a program lookup each time). One for trunks (no instance colours) and one
 * for crowns (instance colours), so neither ever flips. Do the same for any new castShadow InstancedMesh.
 */
const trunkDepth = new THREE.MeshDepthMaterial();
const crownDepth = new THREE.MeshDepthMaterial();

export function Trees({ items, leaves, trunk }: { items: ScatterItem[]; leaves: readonly string[]; trunk: string }) {
  const tier = useStore(selectTier);
  const visible = useMemo(() => {
    const keep = TIERS[tier].decorDensity;
    return keep >= 1 ? items : items.filter((_, i) => (i * 0.618) % 1 < keep);
  }, [items, tier]);

  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.18, 0.26, 1.6, 5).translate(0, 0.8, 0), []);
  // One merged-ish crown shape: an icosahedron, squashed per variant through instance scale.
  const crownGeo = useMemo(() => new THREE.IcosahedronGeometry(1.25, 0).translate(0, 2.6, 0), []);

  useLayoutEffect(() => {
    const t = trunks.current;
    const c = crowns.current;
    if (!t || !c) return;
    visible.forEach((item, i) => {
      tmp.position.set(item.position[0], 0, item.position[2]);
      tmp.rotation.set(0, item.rotationY, 0);
      tmp.scale.setScalar(item.scale);
      tmp.updateMatrix();
      t.setMatrixAt(i, tmp.matrix);
      const squash = item.variant === 1 ? [0.8, 1.6, 0.8] : item.variant === 2 ? [0.85, 1.35, 0.85] : [1.1, 0.95, 1.1];
      tmp.scale.set(item.scale * squash[0]!, item.scale * squash[1]!, item.scale * squash[2]!);
      tmp.updateMatrix();
      c.setMatrixAt(i, tmp.matrix);
      c.setColorAt(i, colour.set(leaves[(i + item.variant) % leaves.length] ?? SHARED.leaf));
    });
    t.count = visible.length;
    c.count = visible.length;
    t.instanceMatrix.needsUpdate = true;
    c.instanceMatrix.needsUpdate = true;
    if (c.instanceColor) c.instanceColor.needsUpdate = true;
    t.computeBoundingSphere();
    c.computeBoundingSphere();
  }, [visible, leaves]);

  if (items.length === 0) return null;
  return (
    <group>
      <instancedMesh
        ref={trunks}
        args={[trunkGeo, undefined, items.length]}
        customDepthMaterial={trunkDepth}
        castShadow
      >
        <meshLambertMaterial color={trunk} />
      </instancedMesh>
      <instancedMesh
        ref={crowns}
        args={[crownGeo, undefined, items.length]}
        customDepthMaterial={crownDepth}
        castShadow
        receiveShadow
      >
        <meshLambertMaterial flatShading />
      </instancedMesh>
    </group>
  );
}
