"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useStore } from "@/lib/store";
import { selectTier, TIERS } from "@/lib/three/quality";

/**
 * SHARED KIT (read-only for island agents; use it freely). Draw-call saver for static models built from
 * many small primitives (PLAN 6.4: <= 120 draw calls on High, <= 60 on Low).
 *
 * After mount it bakes every plain Lambert mesh inside into ONE mesh per (emissive colour, shadow flags)
 * group, with the material colours as vertex colours, and hides the originals. Meshes with textures,
 * transparency or other material types are left alone (they keep rendering normally).
 *
 * - Only for parts that do not move relative to each other: put animated parts OUTSIDE the merge
 *   (or pass `enabled={false}`). Moving the whole merged group (a parent transform) is fine: the change
 *   check below compares transforms relative to the merge root, so parent motion never triggers a re-merge.
 * - Changes are picked up: about once a second (staggered, so roots do not all check on the same frame) it
 *   checks the source meshes (which meshes, geometries and materials, their colours and positions relative
 *   to the root) and re-merges if anything changed: Suspense swaps, content updates and hot reloads show up.
 *   Anything that changes often (animation, a colour that follows state) belongs OUTSIDE the merge or in a
 *   <StaticMerge enabled={false}> / <Building merge={false}>: every change costs a full re-merge.
 * - Shadow flags only split the merge on tiers that draw shadows (High). On Low every colour group is one
 *   draw call, and the merge is rebuilt when the tier changes.
 * - Colliders are unaffected.
 * - The hidden source meshes are frozen (no per-frame matrix updates): change detection refreshes their
 *   local matrices itself once a second, and un-merging (cleanup) unfreezes them. So are the plain Groups /
 *   Object3Ds between the root and those meshes whose whole subtree is frozen (the wrappers islands put
 *   round every primitive): three would otherwise recompute their matrices every frame for nothing. A group
 *   that holds anything else (a textured or instanced mesh, a collider, an animated part) stays live.
 */

const MERGED = "__staticMerge";
/** Marks a hidden source whose per-frame matrix updates this merge switched off (and must switch back on). */
const FROZEN = "__staticMergeFrozen";
const POLL_FRAMES = 60;
let nextOffset = 0;

type Eligible = THREE.Mesh<THREE.BufferGeometry, THREE.MeshLambertMaterial>;

function eligible(o: THREE.Object3D): o is Eligible {
  const mesh = o as THREE.Mesh;
  if (!mesh.isMesh || mesh.userData[MERGED]) return false;
  if ((mesh as unknown as THREE.InstancedMesh).isInstancedMesh) return false;
  const mat = mesh.material as THREE.MeshLambertMaterial;
  return !Array.isArray(mesh.material) && Boolean(mat?.isMeshLambertMaterial) && !mat.map && !mat.transparent;
}

const scratch = new THREE.Matrix4();

/*
 * Fingerprint of the source meshes: a 32-bit FNV-1a style hash over integers (geometry and material ids, colours,
 * emissive intensity, and the transform relative to the root quantised to 1 cm), so the once-a-second check
 * allocates nothing (an earlier string fingerprint cost about 200 KB of garbage a second across the islands).
 * Transforms are composed from local matrices up to the root (exact, and independent of where the root is in the
 * world). The traverse callback and its state live at module level: no closure per check.
 */
let hash = 0;
let sigRoot: THREE.Object3D | null = null;

function mix(n: number) {
  hash = Math.imul(hash ^ (n | 0), 16777619) >>> 0;
}

/** Quantised to 1 cm (`-0 | 0` is 0, so float noise around zero does not flip the hash). */
const cm = (n: number) => Math.round(n * 100);

function visit(o: THREE.Object3D) {
  // Frozen sources and wrapper groups skip three's per-frame matrix update: bring their local matrices up to
  // date here (traverse visits parents first, so every ancestor below the root is current when a mesh is read).
  if (o.userData[FROZEN]) o.updateMatrix();
  if (!eligible(o)) return;
  scratch.copy(o.matrix);
  for (let p = o.parent; p && p !== sigRoot; p = p.parent) scratch.premultiply(p.matrix);
  const e = scratch.elements;
  const m = o.material;
  mix(o.geometry.id);
  mix(m.id);
  mix(m.color.getHex());
  mix(m.emissive.getHex());
  mix(Math.round((m.emissiveIntensity ?? 0) * 1000));
  mix(cm(e[12]!));
  mix(cm(e[13]!));
  mix(cm(e[14]!));
  mix(cm(e[0]!));
  mix(cm(e[10]!));
}

/**
 * Freezes the plain Groups / Object3Ds below `root` whose every descendant is frozen (post-order, so wrappers
 * of wrappers freeze too). Never the root itself. Returns the objects this call froze (to unfreeze in cleanup).
 */
function freezeWrappers(root: THREE.Object3D): THREE.Object3D[] {
  const frozen: THREE.Object3D[] = [];
  const settle = (o: THREE.Object3D): boolean => {
    let all = true;
    for (const c of o.children) if (!settle(c)) all = false;
    if (o === root) return false;
    // Already frozen: a hidden source of this merge or of a nested one (and its wrappers).
    if (o.userData[FROZEN]) return all;
    const plain = o.type === "Group" || o.type === "Object3D";
    if (!all || !plain || o.children.length === 0 || !o.matrixAutoUpdate || !o.matrixWorldAutoUpdate) return false;
    o.userData[FROZEN] = true;
    o.matrixAutoUpdate = false;
    o.matrixWorldAutoUpdate = false;
    frozen.push(o);
    return true;
  };
  settle(root);
  return frozen;
}

function signature(group: THREE.Group): number {
  hash = 2166136261;
  sigRoot = group;
  group.traverse(visit);
  sigRoot = null;
  return hash;
}

export function StaticMerge({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const [version, setVersion] = useState(0);
  const shadows = useStore((s) => TIERS[selectTier(s)].shadows);
  const sig = useRef(0);
  const frame = useRef(0);
  const offset = useRef(0);

  useLayoutEffect(() => {
    nextOffset = (nextOffset + 7) % POLL_FRAMES;
    offset.current = nextOffset;
  }, []);

  useLayoutEffect(() => {
    const group = root.current;
    if (!group || !enabled) return;
    group.updateWorldMatrix(true, true);
    const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert();
    sig.current = signature(group);

    type Bucket = {
      parts: THREE.BufferGeometry[];
      emissive: THREE.Color;
      intensity: number;
      cast: boolean;
      receive: boolean;
    };
    const buckets = new Map<string, Bucket>();
    const hidden: THREE.Mesh[] = [];
    const local = new THREE.Matrix4();

    group.traverse((o) => {
      if (!eligible(o) || !o.visible) return;
      const mat = o.material;
      local.multiplyMatrices(inverse, o.matrixWorld);
      const geo = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(local);
      for (const name of Object.keys(geo.attributes)) {
        if (name !== "position" && name !== "normal") geo.deleteAttribute(name);
      }
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const count = geo.attributes.position!.count;
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) mat.color.toArray(colors, i * 3);
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const intensity = mat.emissiveIntensity ?? 0;
      const glow = intensity > 0 && mat.emissive.getHex() !== 0;
      const cast = shadows && o.castShadow;
      const receive = shadows && o.receiveShadow;
      const key = `${glow ? mat.emissive.getHexString() + intensity : "-"}|${cast}|${receive}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          parts: [],
          emissive: glow ? mat.emissive.clone() : new THREE.Color(0),
          intensity: glow ? intensity : 0,
          cast,
          receive,
        };
        buckets.set(key, bucket);
      }
      bucket.parts.push(geo);
      hidden.push(o);
    });

    const merged: THREE.Mesh[] = [];
    let wrappers: THREE.Object3D[] = [];
    if (hidden.length >= 2) {
      for (const b of buckets.values()) {
        const geometry = mergeGeometries(b.parts, false);
        if (!geometry) continue;
        const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
        if (b.intensity > 0) {
          // Emissive buckets keep their glow.
          material.emissive.copy(b.emissive);
          material.emissiveIntensity = b.intensity;
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData[MERGED] = true;
        mesh.castShadow = b.cast;
        mesh.receiveShadow = b.receive;
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
        merged.push(mesh);
      }
      hidden.forEach((m) => {
        m.visible = false;
        // Not drawn, so skip three's per-frame matrix work for it (signature() refreshes `matrix` itself).
        // Meshes whose matrices the island manages by hand (matrixAutoUpdate already off) are left alone.
        if (m.matrixAutoUpdate && m.matrixWorldAutoUpdate) {
          m.userData[FROZEN] = true;
          m.matrixAutoUpdate = false;
          m.matrixWorldAutoUpdate = false;
        }
      });
      wrappers = freezeWrappers(group);
    }
    for (const b of buckets.values()) b.parts.forEach((g) => g.dispose());

    return () => {
      for (const m of merged) {
        group.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
      const thaw = (o: THREE.Object3D) => {
        if (!o.userData[FROZEN]) return;
        delete o.userData[FROZEN];
        o.matrixAutoUpdate = true;
        o.matrixWorldAutoUpdate = true;
      };
      wrappers.forEach(thaw);
      hidden.forEach((m) => {
        m.visible = true;
        thaw(m);
      });
    };
  }, [enabled, version, shadows]);

  // About once a second (staggered): re-merge if the source meshes changed (Suspense swap, hot reload).
  useFrame(() => {
    if (!enabled || ++frame.current % POLL_FRAMES !== offset.current || !root.current) return;
    if (signature(root.current) !== sig.current) setVersion((v) => v + 1);
  });

  return <group ref={root}>{children}</group>;
}
