"use client";

import { useEffect, useMemo, useRef } from "react";
import { useStore } from "@/lib/store";
import { ERA_ORDER, allBuildings, type WorldLayout } from "@/lib/three/layout";
import { CAMERA_AZIMUTH, MINIMAP_ROTATION_DEG } from "@/lib/three/camera";
import { look, orbit, player } from "@/lib/three/transient";
import type { EraId } from "@/lib/content/schema";

/**
 * Minimap (top-right, Bruno-style round map). Island outlines, bridges, building dots (filled = found,
 * ring = not yet). Rotated to match the camera, so "up" on the map is "up" on screen.
 * The player marker moves in its own requestAnimationFrame loop, reading the transient channel and
 * setting the SVG transform directly: no React state per frame (PLAN 5.2). A soft cone shows which way the
 * camera looks (it turns with free look) from the point it is centred on.
 */

const ERA_FILL: Record<EraId, string> = {
  "era-1": "var(--color-era1-base)",
  "era-2": "var(--color-era2-base)",
  "era-3": "var(--color-era3-base)",
};

export function Minimap({ world, eraNames }: { world: WorldLayout; eraNames: Record<EraId, string> }) {
  const marker = useRef<SVGGElement>(null);
  const cone = useRef<SVGGElement>(null);
  const buildings = useMemo(() => allBuildings(world), [world]);
  const idSet = useMemo(() => new Set(buildings.map((b) => b.id)), [buildings]);
  // One primitive (PLAN 5.2): how many of this world's buildings are found. Each dot selects its own boolean.
  const foundCount = useStore((s) => s.visitedBuildingIds.filter((id) => idSet.has(id)).length);

  // View box around the world: centred on the islands, big enough for the round map.
  const view = useMemo(() => {
    const pts = ERA_ORDER.map((id) => world.islands[id].geometry);
    const cx = pts.reduce((s, g) => s + g.center[0], 0) / pts.length;
    const cz = pts.reduce((s, g) => s + g.center[1], 0) / pts.length;
    let half = 0;
    for (const g of pts) {
      const dx = g.center[0] - cx;
      const dz = g.center[1] - cz;
      // The map is round, so fit a circle (rotation does not change distances).
      half = Math.max(half, Math.hypot(dx, dz) + g.radius);
    }
    half += 6;
    return { cx, cz, half };
  }, [world]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const g = marker.current;
      if (g) {
        // heading h faces (sin h, cos h) in (x, z); SVG angle from +x towards +z (down).
        const deg = (Math.atan2(Math.cos(player.heading), Math.sin(player.heading)) * 180) / Math.PI;
        g.setAttribute(
          "transform",
          `translate(${player.x.toFixed(2)} ${player.z.toFixed(2)}) rotate(${deg.toFixed(1)})`,
        );
        g.style.opacity = player.ready ? "1" : "0";
      }
      const c = cone.current;
      if (c) {
        // The camera looks along -(sin a, cos a) on the ground, a = azimuth + orbit.
        // In first person it looks from the car, along the nose turned by the look-around.
        const fp = useStore.getState().cameraMode === "driver";
        const a = fp ? player.heading + look.yaw + Math.PI : CAMERA_AZIMUTH + orbit.yaw;
        const deg = (Math.atan2(-Math.cos(a), -Math.sin(a)) * 180) / Math.PI;
        const px = player.x + (fp ? 0 : orbit.panX);
        const pz = player.z + (fp ? 0 : orbit.panZ);
        c.setAttribute("transform", `translate(${px.toFixed(2)} ${pz.toFixed(2)}) rotate(${deg.toFixed(1)})`);
        c.style.opacity = player.ready ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { cx, cz, half } = view;

  return (
    <figure className="m-0">
      <svg
        viewBox={`${cx - half} ${cz - half} ${half * 2} ${half * 2}`}
        className="size-24 rounded-full bg-paper shadow-pill sm:size-32 md:size-44"
        role="img"
        aria-label={`Map of the three islands: ${foundCount} of ${buildings.length} buildings found.`}
      >
        <g transform={`rotate(${MINIMAP_ROTATION_DEG} ${cx} ${cz})`}>
          {world.bridges.map((b) => (
            <line
              key={b.id}
              x1={b.start[0]}
              y1={b.start[1]}
              x2={b.end[0]}
              y2={b.end[1]}
              stroke="var(--color-rule)"
              strokeWidth={b.width}
            />
          ))}
          <line
            x1={world.team.bridge.start[0]}
            y1={world.team.bridge.start[1]}
            x2={world.team.bridge.end[0]}
            y2={world.team.bridge.end[1]}
            stroke="var(--color-rule)"
            strokeWidth={world.team.bridge.width}
          />
          <circle
            cx={world.team.center[0]}
            cy={world.team.center[1]}
            r={world.team.radius}
            fill="var(--color-cream)"
            stroke="var(--color-ink)"
            strokeWidth={1.5}
          >
            <title>Our team</title>
          </circle>
          {ERA_ORDER.map((id) => {
            const g = world.islands[id].geometry;
            return (
              <g key={id}>
                <title>{eraNames[id]}</title>
                <circle
                  cx={g.center[0]}
                  cy={g.center[1]}
                  r={g.radius}
                  fill={ERA_FILL[id]}
                  stroke="var(--color-ink)"
                  strokeWidth={1.5}
                />
                <circle
                  cx={g.center[0]}
                  cy={g.center[1]}
                  r={g.roadRadius}
                  fill="none"
                  stroke="var(--color-sand)"
                  strokeWidth={g.roadWidth * 0.7}
                />
              </g>
            );
          })}
          {buildings.map((b) => (
            <MapDot key={b.id} id={b.id} x={b.position[0]} y={b.position[2]} />
          ))}
          <g ref={cone} style={{ opacity: 0 }} aria-hidden="true">
            <path d="M 0 0 L 46 -26 A 52 52 0 0 1 46 26 Z" fill="var(--color-ink)" fillOpacity={0.14} />
          </g>
          <g ref={marker} style={{ opacity: 0 }}>
            <path
              d="M 22 0 L -14 15 L -7 0 L -14 -15 Z"
              fill="var(--color-era2-accent)"
              stroke="var(--color-coal)"
              strokeWidth={3}
            />
          </g>
        </g>
      </svg>
    </figure>
  );
}

/** Building dot: filled once found. Selects one boolean, so finding a building re-renders only its dot. */
function MapDot({ id, x, y }: { id: string; x: number; y: number }) {
  const found = useStore((s) => s.visitedBuildingIds.includes(id));
  return (
    <circle
      cx={x}
      cy={y}
      r={7}
      fill={found ? "var(--color-ink)" : "var(--color-paper)"}
      stroke="var(--color-ink)"
      strokeWidth={3}
    />
  );
}
