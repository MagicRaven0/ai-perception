"use client";

/**
 * ISLAND: THE PAST (era-1, 1950s). Placeholder by the foundation build, to be replaced by the island agent.
 *
 * The island agent OWNS and may freely change:
 * - this file (components/three/islands/IslandPast.tsx; keep the default export and the IslandProps input);
 * - anything new under components/three/islands/past/ (models, decor, props, materials);
 * - lib/three/palettes/past.ts if you need extra colours (spread ERA_PALETTE["era-1"] into it).
 *
 * You receive (IslandProps, components/three/islands/types.ts), already positioned from content order:
 *   era, layout (geometry: centre, radius, roadRadius, roadWidth, bridgeAngles, entryAngle, plot; spawn),
 *   buildings (PlacedBuilding[]), insights (PlacedInsight[]), figures (PlacedFigure[]), palette.
 *
 * Helpers you may use (read-only, do not edit): <Building placed Model? palette? height? merge?>, <Signpost placed>,
 * <Figure placed tint?>, <FacelessFigure>, kit/<IslandGround>, kit/<Trees>, kit/<StaticMerge> (wrap static
 * decor: one draw call per colour group), <GuideCharacter>, buildings/registry (Block,
 * BUILDING_MODELS, BuildingModelProps), lib/three/scatter (scatterOnIsland, rng), lib/three/palette.
 *
 * Rules:
 * - Render EVERY building / insight / figure you receive, at its given position (sensors, minimap, drawer
 *   and deep links depend on it). Restyle with <Building Model={YourModel}> instead of moving it.
 * - Keep everything inside layout.geometry.radius, keep the ring road and connector roads drivable
 *   (no colliders on them), and keep the connector roads out to the bridges clear.
 * - Physics ground, island edge walls, bridges and island sensors live in World.tsx: do not add your own.
 *   Decor colliders are fine (fixed <RigidBody> with simple cuboid/ball colliders, never trimesh).
 * - <Building merge> defaults to true (static meshes baked into one draw call per colour group, originals
 *   hidden): pass merge={false} for a Model with moving parts, or keep the moving parts outside the merge.
 *   Same for kit/<StaticMerge>: anything that changes at runtime (animation, colour or visibility that
 *   follows state) goes outside it; every change inside costs a full re-merge.
 * - Lifecycle: leaving /explore unmounts the whole world and coming back mounts it fresh. Clean up
 *   everything on unmount (timers, listeners, audio, module-level state) and do not rely on one-time setup
 *   surviving a visit to /read (memos re-run, physics bodies are rebuilt; drei's useGLTF cache survives).
 * - Budget for this island: High <= 40k triangles and <= 40 draw calls (High counts the shadow pass: every
 *   shadow-casting mesh draws twice); Low <= 22k triangles and <= 20 draw calls. Low already thins Trees
 *   (decorDensity); anything else heavy reads the tier (useStore(selectTier)) and draws a lighter version.
 *   Near a bridge two islands are in view at once, plus the shared scene (sky, car, bridges: about 10k
 *   triangles and 20 calls on High, 8k and 10 on Low): that is how the totals stay under the PLAN 6.4
 *   limits of 150k / 120 (High) and 60k / 60 (Low). Check in development with
 *   window.__explore.gl.info.render (calls, triangles) after switching Options > Quality. Rough costs: a
 *   default building 3-4 calls on Low, 6-8 on High; a signpost 1 on Low, 2-3 on High; each building's
 *   floating beacon 1 on both tiers; a figure with its blank photo billboard about 5 (the blank's 3 panels
 *   are not merged). Instance repeats (Trees, <Instances>). No shadows from
 *   tiny props. Models go through glTF-Transform (Meshopt) and are credited
 *   in content/credits.ts. That file is SHARED by all island agents: only append new entries at the end of
 *   its list (id prefix "past-", "jobs-", "future-" or "aus-"); never edit, reorder or reformat other entries.
 * - Loading: the three islands share ONE Suspense boundary in World.tsx, and the world only counts as ready
 *   (10 s budget, then reading mode) once all three have rendered. Never suspend at the top of this file:
 *   wrap anything that loads (useGLTF, useTexture, photos) in its own <Suspense fallback={<Placeholder/>}>
 *   inside the island, as Figure.tsx does, so a slow model shows a placeholder instead of failing the load.
 * - Reduced motion: decorative animation in useFrame (spinning, bobbing, swaying) checks `motion.reduced`
 *   (lib/three/motion) and holds its rest pose. Motion the visitor causes may stay.
 * - A new shadow-casting InstancedMesh gets its own customDepthMaterial (see kit/Trees.tsx); sharing three's
 *   default depth material with ordinary meshes costs a shader-program lookup per switch in the shadow pass.
 * - Capacity: the auto-layout fits islandCapacity(era) buildings (lib/three/layout.ts) without overlapping
 *   plots. More still lay out (squeezed onto the outer ring) and `npm run check-content` warns.
 * - Do NOT edit shared files: World.tsx, Experience.tsx, Vehicle.tsx, CameraRig.tsx, Building.tsx,
 *   Signpost.tsx, Figure.tsx, GuideCharacter.tsx, *Sensor.tsx, buildings/registry.tsx, kit/*, lib/three/*
 *   (except your own palette file), lib/store, components/hud/*, app/explore/*.
 */

import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { scatterOnIsland } from "@/lib/three/scatter";
import { SHARED } from "@/lib/three/palette";
import { Building } from "../Building";
import { Figure } from "../Figure";
import { Signpost } from "../Signpost";
import { IslandGround } from "../kit/IslandGround";
import { Trees } from "../kit/Trees";
import { Block } from "../buildings/registry";
import { StaticMerge } from "../kit/StaticMerge";
import type { IslandProps } from "./types";

export default function IslandPast({ layout, buildings, insights, figures, palette }: IslandProps) {
  const trees = useMemo(() => scatterOnIsland(layout, { count: 70, zone: "outer" }), [layout]);
  const [cx, cz] = layout.geometry.center;

  return (
    <group>
      <IslandGround geometry={layout.geometry} palette={palette} />
      <Trees items={trees} leaves={palette.leaves} trunk={palette.trunk} />

      {/* Placeholder landmark: a row of oversized 1950s mainframe cabinets in the middle of the lawn. */}
      <group position={[cx, 0, cz]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[7.8, 3.5, 1.4]} position={[0, 3.5, 0]} />
        </RigidBody>
        <StaticMerge>
          {[-6, -2, 2, 6].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <Block size={[3.2, 7, 2.6]} position={[0, 3.5, 0]} color={palette.base} />
              <Block size={[2.4, 0.5, 0.1]} position={[0, 5.6, 1.31]} color={palette.accent} emissive />
              <Block size={[1, 1, 0.1]} position={[-0.6, 3.6, 1.31]} color={SHARED.ink} />
              <Block size={[1, 1, 0.1]} position={[0.6, 3.6, 1.31]} color={SHARED.ink} />
            </group>
          ))}
        </StaticMerge>
      </group>

      {buildings.map((b) => (
        <Building key={b.id} placed={b} />
      ))}
      {insights.map((i) => (
        <Signpost key={i.id} placed={i} />
      ))}
      {figures.map((f) => (
        <Figure key={f.id} placed={f} />
      ))}
    </group>
  );
}
