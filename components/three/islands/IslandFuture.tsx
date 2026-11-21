"use client";

/**
 * ISLAND: THE FUTURE (era-3, 2020s: AI experts, polls, AUS mini campus in the centre, the guide).
 *
 * Built: a daylight data city (pale concrete + graphite, lime #D5FF95 glow) on the shared deep-green lawn
 * and cream road: era-styled models for all 7 building kinds (future/models.tsx), city lots planned around the
 * content buildings (future/lots.ts, future/designs.ts) holding the polling monoliths (placeholder heights until
 * a verified dataset is passed in), the "1956 vs now" comparison plaza, a server yard and towers, a welcome
 * plaza round the guide, trees, and one instanced mesh of blinking lights. All static decor (trees included) is
 * one StaticMerge, and glow is over-bright albedo in the same bucket (future/kit.tsx): the whole city is one
 * draw call plus its shadow pass, each building model one plus its shadow pass.
 *
 * The island agent OWNS and may freely change:
 * - this file (components/three/islands/IslandFuture.tsx; keep the default export and the IslandProps input);
 * - anything new under components/three/islands/future/ (models, decor, props, materials);
 * - lib/three/palettes/future.ts if you need extra colours (spread ERA_PALETTE["era-3"] into it).
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
 * The Future also gets layout.campus (centre plot, radius) and layout.guide (position, rotation, sensor).
 * Render <AusCampus> on the campus plot (components/three/campus/AusCampus.tsx, owned by the campus work)
 * and <GuideCharacter> at layout.guide: the HUD's "Talk to the guide" prompt depends on it.
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
 * - Budget for this island, AUS CAMPUS INCLUDED (the campus is part of this island, not extra):
 *   High <= 50k triangles and <= 45 draw calls (High counts the shadow pass: every shadow-casting mesh
 *   draws twice); Low <= 25k triangles and <= 22 draw calls. Of that, the campus may use up to 20k
 *   triangles / 14 calls on High and 8k / 6 on Low (see AusCampus.tsx); the rest is for this island's
 *   buildings, signposts, figures, guide and decor. Low already thins Trees (decorDensity); anything else
 *   heavy reads the tier (useStore(selectTier)) and draws a lighter version. Near a bridge two islands are
 *   in view at once, plus the shared scene (sky, car, bridges: about 10k triangles and 20 calls on High, 8k
 *   and 10 on Low): that is how the totals stay under the PLAN 6.4 limits of 150k / 120 (High) and 60k / 60
 *   (Low). Check in development with window.__explore.gl.info.render (calls, triangles) after switching
 *   Options > Quality. Rough costs: a default building 3-4 calls on Low, 6-8 on High; a signpost 1 on
 *   Low, 2-3 on High; each building's floating beacon 1 on both tiers; a figure with its blank photo
 *   billboard 1 on Low, 2 on High (the blank panels are merged with it; a credited photo adds 1). Instance repeats (Trees, <Instances>). No shadows from
 *   tiny props. Models go through glTF-Transform (Meshopt) and are credited
 *   in content/credits.ts. That file is SHARED by all island agents: only append new entries at the end of
 *   its list (id prefix "past-", "jobs-", "future-" or "aus-"); never edit, reorder or reformat other entries.
 * - Loading: the three islands share ONE Suspense boundary in World.tsx, and the world only counts as ready
 *   (20 s budget, LOAD_TIMEOUT_MS, then reading mode) once all three have rendered. Never suspend at the top of this file:
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

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { useStore } from "@/lib/store";
import { selectTier } from "@/lib/three/quality";
import { scatterOnIsland } from "@/lib/three/scatter";
import { FUTURE_PALETTE as FP } from "@/lib/three/palettes/future";
import { Building } from "../Building";
import { Figure } from "../Figure";
import { Signpost } from "../Signpost";
import { GuideCharacter } from "../GuideCharacter";
import { IslandGround } from "../kit/IslandGround";
import { AusCampus } from "../campus/AusCampus";
import { Blinkers, FutureColliders, FutureDecor } from "./future/decor";
import { blinkPoints, monolithHeights } from "./future/designs";
import { FutureKitProvider } from "./future/kit";
import { insideLot, planLots, type Lot } from "./future/lots";
import { FUTURE_MODEL_HEIGHT, FUTURE_MODELS } from "./future/models";
import type { IslandProps } from "./types";

export default function IslandFuture({ layout, buildings, insights, figures, palette }: IslandProps) {
  const tier = useStore(selectTier);
  const lots = useMemo(() => planLots(layout), [layout]);

  // TODO: polling monolith heights. IslandProps carries no datasets yet and "public-trust-vs-fear" is still a
  // placeholder, so this stays null (equal placeholder slabs with a "data coming" band). Once a verified series
  // reaches this island, pass its values here: monolithHeights(series.points.map((p) => p.y)).
  const heights = useMemo(() => monolithHeights(null), []);

  const blinks = useMemo(() => blinkPoints(lots, tier, heights), [lots, tier, heights]);

  const trees = useMemo(() => {
    const guide = layout.guide?.position;
    const clearOfLots = (x: number, z: number) => !lots.some((lot) => insideLot(lot, x, z, 1.2));
    const clearOfGuide = (x: number, z: number) => !guide || Math.hypot(x - guide[0], z - guide[2]) > 5.2;
    const outer = scatterOnIsland(layout, { count: 80, seed: 2026, zone: "outer", itemMargin: 2 });
    const inner = scatterOnIsland(layout, { count: 14, seed: 3031, zone: "inner", maxScale: 1.1 });
    return [...outer, ...inner].filter(
      (t) => clearOfLots(t.position[0], t.position[2]) && clearOfGuide(t.position[0], t.position[2]),
    );
  }, [layout, lots]);

  const root = useRef<THREE.Group>(null);
  useDevHandle(root, lots);

  return (
    <FutureKitProvider>
      <group ref={root}>
        {/* Shared Late Checkout ground (deep green lawn, cream road) with The Future's lime curb */}
        <IslandGround geometry={layout.geometry} palette={FP} />

        {/* City, monoliths, plaza, servers, guide plaza and trees: one merge */}
        <FutureDecor lots={lots} tier={tier} heights={heights} guide={layout.guide} trees={trees} />
        <FutureColliders lots={lots} tier={tier} heights={heights} />
        <Blinkers points={blinks} />

        {layout.campus && (
          <AusCampus position={layout.campus.position} radius={layout.campus.radius} palette={palette} />
        )}
        {layout.guide && (
          <GuideCharacter
            position={layout.guide.position}
            rotationY={layout.guide.rotationY}
            sensorRadius={layout.guide.sensorRadius}
          />
        )}

        {buildings.map((b) => (
          <Building
            key={b.id}
            placed={b}
            Model={FUTURE_MODELS[b.kind]}
            palette={FP}
            height={FUTURE_MODEL_HEIGHT[b.kind]}
          />
        ))}
        {insights.map((i) => (
          <Signpost key={i.id} placed={i} />
        ))}
        {figures.map((f) => (
          <Figure key={f.id} placed={f} />
        ))}
      </group>
    </FutureKitProvider>
  );
}

/**
 * Development only: window.__futureIsland = { group, scene, camera, lots }, so the island's own draw calls and
 * triangles can be measured in isolation (hide everything else, render once, read gl.info.render) and its
 * landmarks found for close-up screenshots. Removed on unmount; never set in production.
 */
function useDevHandle(root: React.RefObject<THREE.Group | null>, lots: Lot[]) {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !root.current) return;
    const w = window as unknown as { __futureIsland?: unknown };
    w.__futureIsland = { group: root.current, scene, camera, lots };
    return () => {
      delete w.__futureIsland;
    };
  }, [root, scene, camera, lots]);
}
