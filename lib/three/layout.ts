import type { BuildingKind, EraId } from "@/lib/content/schema";

/**
 * World layout for /explore (docs/VISION.md: three separate islands joined by bridges).
 *
 * Content files never hold coordinates. Everything here is computed from content order:
 * - each island is a round slab with a cream ring road;
 * - buildings sit on plots around the ring road, in their `order`, starting at the bridge you arrive by;
 * - insight signposts stand beside their building (or along the inner road edge when free-standing);
 * - anchor figures stand on the inner lawn near the arrival point;
 * - The Future keeps its centre plot for the AUS mini campus, and has the guide character near the spawn.
 *
 * Units: metres, Y up, island tops at y = 0. Angles are radians in the XZ plane (x = cos, z = sin).
 * A "heading" is a rotation about Y where local +Z faces (sin h, cos h): the car and all models face +Z.
 *
 * Pure data and maths only (no three.js), so the server page, the HUD and the minimap can import it.
 */

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Pose = { x: number; y: number; z: number; heading: number };

export const ERA_ORDER: EraId[] = ["era-1", "era-2", "era-3"];

/** Below this height the car respawns (PLAN 6.2). */
export const FALL_Y = -10;

type IslandSpec = {
  center: Vec2;
  radius: number;
  /** Ring road centre-line radius as a fraction of the island radius. */
  roadFactor: number;
  roadWidth: number;
  /** Building plot footprint (width along the road, depth away from it). */
  plot: { width: number; depth: number };
  /** Reserve the centre (AUS campus on The Future). */
  reserveCentre: boolean;
  /** Angle (from the island centre) of the runway that juts off the edge; drive off its end to fly. */
  runwayAngle: number;
};

/**
 * Island sizes follow the vision: The Past is big and old, The Jobs Era human-scale, The Future widest.
 * Enlarged ~30% on 21 Nov 2026 (more room to drive, more plots); bridges stay about 38 m long.
 */
const SPECS: Record<EraId, IslandSpec> = {
  "era-1": {
    center: [-154, 6],
    radius: 64,
    roadFactor: 0.56,
    roadWidth: 7,
    plot: { width: 14, depth: 13 },
    reserveCentre: false,
    runwayAngle: Math.PI,
  },
  "era-2": {
    center: [0, -6],
    radius: 52,
    roadFactor: 0.56,
    roadWidth: 7,
    plot: { width: 10, depth: 10 },
    reserveCentre: false,
    runwayAngle: Math.PI / 2,
  },
  "era-3": {
    center: [162, 6],
    radius: 72,
    roadFactor: 0.56,
    roadWidth: 7,
    plot: { width: 12, depth: 12 },
    reserveCentre: true,
    runwayAngle: 0,
  },
};

/** Bridge deck width (m). Widened from 9 to 12 on 21 Nov 2026 so the drive between islands feels easier. */
export const BRIDGE_WIDTH = 12;
/** Runway jutting off each island (length beyond the rim, width). Drive off the end and the car becomes a plane. */
export const RUNWAY = { length: 46, width: 11 };
const BRIDGE_PAIRS: [EraId, EraId][] = [
  ["era-1", "era-2"],
  ["era-2", "era-3"],
];

/* --------------------------------------------------------------- types */

export type IslandGeometry = {
  eraId: EraId;
  center: Vec2;
  radius: number;
  roadRadius: number;
  roadWidth: number;
  /** Depth of the slab below the lawn (visual only). */
  slabDepth: number;
  /** Angles (from the island centre) where bridges join. A straight connector road runs from the ring to each. */
  bridgeAngles: number[];
  /** Angle you arrive at (first bridge from the previous island; for The Past, its only bridge). */
  entryAngle: number;
  /** The runway's angle (also listed in bridgeAngles, so it gets a connector road, an edge opening and clear plots). */
  runwayAngle: number;
  plot: { width: number; depth: number };
};

export type BridgeGeometry = {
  id: string;
  from: EraId;
  to: EraId;
  start: Vec2;
  end: Vec2;
  center: Vec2;
  length: number;
  width: number;
  /** Rotation about Y so the bridge's local +Z runs from start to end. */
  rotationY: number;
};

export type RunwayGeometry = {
  eraId: EraId;
  /** On the island, 3 m inside the rim (the deck overlaps the lawn like a bridge). */
  start: Vec2;
  /** The open end in the air: drive past it to take off. */
  end: Vec2;
  center: Vec2;
  /** Unit direction from start to end. */
  dir: Vec2;
  length: number;
  width: number;
  rotationY: number;
};

export type PlacedBuilding = {
  id: string;
  eraId: EraId;
  order: number;
  kind: BuildingKind;
  /** True while the building's text is still a "TODO:" placeholder (drawer shows "coming soon"). */
  comingSoon: boolean;
  /** Index for picking colours from the era palette. */
  colourIndex: number;
  ring: "outer" | "inner";
  angle: number;
  position: Vec3;
  /** Faces the road. */
  rotationY: number;
  plot: { width: number; depth: number };
  /** Proximity sensor in front of the building, on the road side. */
  sensor: { position: Vec3; radius: number };
  /** Where the car is put for a ?b= deep link: on the road in front of the building. */
  approach: Pose;
};

export type PlacedInsight = {
  id: string;
  eraId: EraId;
  kind: "benefit" | "risk" | "danger";
  buildingId?: string;
  position: Vec3;
  rotationY: number;
  sensorRadius: number;
};

export type PlacedFigure = {
  /** `${eraId}-figure-${index}` */
  id: string;
  eraId: EraId;
  index: number;
  name: string;
  role: string;
  /** Photo billboard (path under /public, from content/credits.ts images). Missing -> "photo coming" frame. */
  imageSrc?: string;
  imageAlt?: string;
  /** Outfit colours and prop from content (faceless; no likeness). Missing -> neutral figure. */
  look?: FigureLookInput;
  position: Vec3;
  rotationY: number;
  sensorRadius: number;
};

export type FigureLookInput = { top: string; bottom: string; prop: string };

export type EdgeWall = { position: Vec3; rotationY: number; length: number };

export type IslandLayout = {
  eraId: EraId;
  geometry: IslandGeometry;
  spawn: Pose;
  buildings: PlacedBuilding[];
  insights: PlacedInsight[];
  figures: PlacedFigure[];
  /** Invisible low walls around the island edge, open where bridges join. */
  edgeWalls: EdgeWall[];
  /** The Future only: centre plot for the AUS mini campus. */
  campus?: { position: Vec3; radius: number };
  /** The Future only: the chatbot guide character. */
  guide?: { position: Vec3; rotationY: number; sensorRadius: number };
};

export type WorldLayout = {
  islands: Record<EraId, IslandLayout>;
  bridges: BridgeGeometry[];
  runways: Record<EraId, RunwayGeometry>;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

/** Minimal content shapes the layout needs (subset of the zod types, so the client can pass plain data too). */
export type LayoutInput = {
  eras: {
    id: EraId;
    anchorFigures: { name: string; role: string; imageSrc?: string; imageAlt?: string; look?: FigureLookInput }[];
  }[];
  buildings: { id: string; eraId: EraId; order: number; kind: BuildingKind; comingSoon: boolean }[];
  insights: { id: string; eraId: EraId; kind: "benefit" | "risk" | "danger"; buildingId?: string }[];
};

/* --------------------------------------------------------------- maths */

const TAU = Math.PI * 2;

/** Normalise an angle to [0, 2π). */
export function wrapAngle(a: number): number {
  return ((a % TAU) + TAU) % TAU;
}

/** Smallest absolute difference between two angles. */
export function angleDiff(a: number, b: number): number {
  const d = Math.abs(wrapAngle(a) - wrapAngle(b));
  return Math.min(d, TAU - d);
}

/** Point on an island at polar (angle, radius). */
export function polar(center: Vec2, angle: number, r: number, y = 0): Vec3 {
  return [center[0] + Math.cos(angle) * r, y, center[1] + Math.sin(angle) * r];
}

/** Heading (rotation about Y) that makes local +Z face the direction (dx, dz). */
export function headingOf(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

/** Heading along the ring road in the direction of increasing angle. */
export function ringTangentHeading(angle: number): number {
  return headingOf(-Math.sin(angle), Math.cos(angle));
}

/* ------------------------------------------------------------ geometry */

function islandGeometry(eraId: EraId): IslandGeometry {
  const s = SPECS[eraId];
  const bridgeAngles: number[] = [];
  let entryAngle: number | null = null;
  for (const [a, b] of BRIDGE_PAIRS) {
    if (a !== eraId && b !== eraId) continue;
    const other = SPECS[a === eraId ? b : a];
    const angle = wrapAngle(Math.atan2(other.center[1] - s.center[1], other.center[0] - s.center[0]));
    bridgeAngles.push(angle);
    // You arrive by the bridge from the previous island; The Past has only one bridge.
    if (b === eraId || entryAngle === null) entryAngle = angle;
  }
  return {
    eraId,
    center: s.center,
    radius: s.radius,
    roadRadius: s.radius * s.roadFactor,
    roadWidth: s.roadWidth,
    slabDepth: 7,
    // The runway is treated like a bridge end: connector road, gap in the edge wall, plots kept clear.
    bridgeAngles: [...bridgeAngles, wrapAngle(s.runwayAngle)],
    entryAngle: entryAngle ?? 0,
    runwayAngle: wrapAngle(s.runwayAngle),
    plot: s.plot,
  };
}

function bridgeGeometry(from: EraId, to: EraId): BridgeGeometry {
  const a = SPECS[from];
  const b = SPECS[to];
  const dx = b.center[0] - a.center[0];
  const dz = b.center[1] - a.center[1];
  const d = Math.hypot(dx, dz);
  const ux = dx / d;
  const uz = dz / d;
  // Overlap 3 m into each island so the deck meets the lawn without a seam.
  const start: Vec2 = [a.center[0] + ux * (a.radius - 3), a.center[1] + uz * (a.radius - 3)];
  const end: Vec2 = [b.center[0] - ux * (b.radius - 3), b.center[1] - uz * (b.radius - 3)];
  return {
    id: `${from}-${to}`,
    from,
    to,
    start,
    end,
    center: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
    length: Math.hypot(end[0] - start[0], end[1] - start[1]),
    width: BRIDGE_WIDTH,
    rotationY: headingOf(ux, uz),
  };
}

function runwayGeometry(eraId: EraId): RunwayGeometry {
  const s = SPECS[eraId];
  const a = wrapAngle(s.runwayAngle);
  const dir: Vec2 = [Math.cos(a), Math.sin(a)];
  const start: Vec2 = [s.center[0] + dir[0] * (s.radius - 3), s.center[1] + dir[1] * (s.radius - 3)];
  const length = RUNWAY.length + 3;
  const end: Vec2 = [start[0] + dir[0] * length, start[1] + dir[1] * length];
  return {
    eraId,
    start,
    end,
    center: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
    dir,
    length,
    width: RUNWAY.width,
    rotationY: headingOf(dir[0], dir[1]),
  };
}

/** Plot slots on a ring, ordered from the entry angle going in the direction of increasing angle. */
function ringSlots(g: IslandGeometry, r: number, spacing: number): number[] {
  const count = Math.max(1, Math.floor((TAU * r) / spacing));
  const step = TAU / count;
  // Keep plots clear of the connector roads to the bridges.
  const clear = (g.roadWidth / 2 + g.plot.width / 2 + 2) / r;
  const slots: number[] = [];
  for (let i = 0; i < count; i++) {
    const angle = wrapAngle(g.entryAngle + step * (i + 0.5));
    if (g.bridgeAngles.some((b) => angleDiff(angle, b) < clear)) continue;
    slots.push(angle);
  }
  return slots;
}

/** Spread n items over the available slots as evenly as possible, keeping order. */
function spread(slots: number[], n: number): number[] {
  if (n <= 0) return [];
  if (n >= slots.length) return slots.slice(0, n);
  return Array.from({ length: n }, (_, i) => slots[Math.floor(((i + 0.5) * slots.length) / n)]!);
}

/**
 * How many buildings fit on an island without plots overlapping (outer ring + inner ring, clear of the bridge
 * roads). More than this still lays out (squeezed, overlapping), and `npm run check-content` warns.
 */
export function islandCapacity(eraId: EraId): number {
  const g = islandGeometry(eraId);
  const { roadRadius: rr, roadWidth: rw, plot } = g;
  const spacing = plot.width + 4;
  const rOuter = rr + rw / 2 + 1.5 + plot.depth / 2;
  const rInner = rr - rw / 2 - 1.5 - plot.depth / 2;
  const inner = SPECS[eraId].reserveCentre || rInner < plot.depth ? 0 : ringSlots(g, rInner, spacing).length;
  return ringSlots(g, rOuter, spacing).length + inner;
}

/* -------------------------------------------------------------- layout */

/**
 * AUTO-LAYOUT for one island: places buildings (by order), insight signposts, anchor figures, the spawn,
 * the campus plot and the guide. Deterministic: the same content always gives the same world.
 */
export function layoutIsland(eraId: EraId, input: LayoutInput): IslandLayout {
  const g = islandGeometry(eraId);
  const { center, roadRadius: rr, roadWidth: rw, plot } = g;
  const reserveCentre = SPECS[eraId].reserveCentre;

  // Buildings: outer ring first, then the inner ring (not on The Future, whose centre is the campus).
  const own = input.buildings.filter((b) => b.eraId === eraId).sort((a, b) => a.order - b.order);
  const spacing = plot.width + 4;
  const rOuter = rr + rw / 2 + 1.5 + plot.depth / 2;
  const rInner = rr - rw / 2 - 1.5 - plot.depth / 2;
  const outerSlots = ringSlots(g, rOuter, spacing);
  const innerSlots = reserveCentre || rInner < plot.depth ? [] : ringSlots(g, rInner, spacing);
  let outerAngles: number[];
  let innerAngles: number[];
  if (own.length <= outerSlots.length + innerSlots.length) {
    outerAngles = spread(outerSlots, Math.min(own.length, outerSlots.length));
    innerAngles = spread(innerSlots, own.length - outerAngles.length);
  } else {
    // More buildings than plots (see islandCapacity; check-content warns): never drop content. Everything goes
    // on the outer ring, with the spacing shrunk until every building has a slot clear of the bridge roads.
    // Plots then overlap, which is the visible cue to give the island fewer buildings or a bigger radius.
    let count = own.length;
    let slots = ringSlots(g, rOuter, (TAU * rOuter) / count);
    while (slots.length < own.length && count < own.length * 8) slots = ringSlots(g, rOuter, (TAU * rOuter) / ++count);
    outerAngles =
      slots.length >= own.length
        ? spread(slots, own.length)
        : own.map((_, i) => wrapAngle(g.entryAngle + (TAU * (i + 0.5)) / own.length));
    innerAngles = [];
  }

  const buildings: PlacedBuilding[] = own.map((b, i) => {
    const inner = i >= outerAngles.length;
    const angle = inner ? innerAngles[i - outerAngles.length]! : outerAngles[i]!;
    const r = inner ? rInner : rOuter;
    const position = polar(center, angle, r);
    // Front faces the road: towards the centre for outer plots, outwards for inner plots.
    const fx = inner ? Math.cos(angle) : -Math.cos(angle);
    const fz = inner ? Math.sin(angle) : -Math.sin(angle);
    const front = plot.depth / 2 + 1;
    const road = polar(center, angle, rr, 1.2);
    return {
      id: b.id,
      eraId,
      order: b.order,
      kind: b.kind,
      comingSoon: b.comingSoon,
      colourIndex: i,
      ring: inner ? "inner" : "outer",
      angle,
      position,
      rotationY: headingOf(fx, fz),
      plot,
      sensor: {
        position: [position[0] + fx * front, 1, position[2] + fz * front],
        radius: Math.max(6.5, plot.width / 2 + 1.5),
      },
      approach: { x: road[0], y: road[1], z: road[2], heading: ringTangentHeading(angle) },
    };
  });

  // Anchor figures: inner lawn, just after the arrival point, facing the road.
  const era = input.eras.find((e) => e.id === eraId);
  const rFigure = rr - rw / 2 - 3;
  const figures: PlacedFigure[] = (era?.anchorFigures ?? []).map((f, i) => {
    const angle = g.entryAngle + 0.42 + i * 0.26;
    const position = polar(center, angle, rFigure);
    return {
      id: `${eraId}-figure-${i}`,
      eraId,
      index: i,
      name: f.name,
      role: f.role,
      imageSrc: f.imageSrc,
      imageAlt: f.imageAlt,
      look: f.look,
      position,
      rotationY: headingOf(Math.cos(angle), Math.sin(angle)),
      // Reaches the middle of the road, so driving past is enough.
      sensorRadius: 7,
    };
  });

  // Insight signposts: beside their building on the road edge, or spread along the inner road edge.
  const ownInsights = input.insights.filter((x) => x.eraId === eraId);
  const rSignOuter = rr + rw / 2 + 1.2;
  const rSignInner = rr - rw / 2 - 1.2;
  const perBuilding = new Map<string, number>();
  const free = ownInsights.filter((x) => !x.buildingId || !buildings.some((b) => b.id === x.buildingId));
  const freeStart = g.entryAngle + Math.PI * 0.75;
  const insights: PlacedInsight[] = ownInsights.map((x) => {
    const host = x.buildingId ? buildings.find((b) => b.id === x.buildingId) : undefined;
    let angle: number;
    let r: number;
    if (host) {
      const k = perBuilding.get(host.id) ?? 0;
      perBuilding.set(host.id, k + 1);
      const side = k % 2 === 0 ? 1 : -1;
      const hostR = host.ring === "outer" ? rSignOuter : rSignInner;
      angle = host.angle + side * ((plot.width / 2 + 2 + Math.floor(k / 2) * 2.5) / hostR);
      r = hostR;
    } else {
      const k = free.indexOf(x);
      angle = freeStart + (k * (TAU * 0.55)) / Math.max(1, free.length);
      r = rSignInner;
    }
    // Keep signs off the connector roads.
    for (const b of g.bridgeAngles) {
      const clear = (rw / 2 + 2) / r;
      if (angleDiff(angle, b) < clear) angle = b + clear * 1.2;
    }
    const position = polar(center, angle, r);
    const toRoad = r > rr ? -1 : 1;
    return {
      id: x.id,
      eraId,
      kind: x.kind,
      buildingId: x.buildingId,
      position,
      rotationY: headingOf(Math.cos(angle) * toRoad, Math.sin(angle) * toRoad),
      sensorRadius: 5.5,
    };
  });

  const spawnPoint = polar(center, g.entryAngle, rr, 1.2);
  const spawn: Pose = {
    x: spawnPoint[0],
    y: spawnPoint[1],
    z: spawnPoint[2],
    heading: ringTangentHeading(g.entryAngle),
  };

  // Low invisible walls round the edge, open where a bridge joins.
  const segments = 64;
  const edgeR = g.radius - 0.6;
  const edgeWalls: EdgeWall[] = [];
  const bridgeClear = (BRIDGE_WIDTH / 2 + 0.4) / edgeR;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * TAU;
    if (g.bridgeAngles.some((b) => angleDiff(angle, b) < bridgeClear + Math.PI / segments)) continue;
    edgeWalls.push({
      position: polar(center, angle, edgeR, 0.6),
      rotationY: headingOf(-Math.sin(angle), Math.cos(angle)),
      length: ((TAU * edgeR) / segments) * 1.05,
    });
  }

  const layout: IslandLayout = { eraId, geometry: g, spawn, buildings, insights, figures, edgeWalls };

  if (reserveCentre) {
    layout.campus = { position: [center[0], 0, center[1]], radius: rr - rw / 2 - 6 };
    const angle = g.entryAngle + 0.16;
    layout.guide = {
      position: polar(center, angle, rFigure),
      rotationY: headingOf(Math.cos(angle), Math.sin(angle)),
      sensorRadius: 7.5,
    };
  }
  return layout;
}

/** The whole world: three islands + bridges + bounds. Serialisable, so the server page can compute it. */
export function layoutWorld(input: LayoutInput): WorldLayout {
  const islands = Object.fromEntries(ERA_ORDER.map((id) => [id, layoutIsland(id, input)])) as Record<
    EraId,
    IslandLayout
  >;
  const bridges = BRIDGE_PAIRS.map(([a, b]) => bridgeGeometry(a, b));
  const runways = Object.fromEntries(ERA_ORDER.map((id) => [id, runwayGeometry(id)])) as Record<EraId, RunwayGeometry>;
  const xs = ERA_ORDER.flatMap((id) => [
    SPECS[id].center[0] - SPECS[id].radius,
    SPECS[id].center[0] + SPECS[id].radius,
  ]);
  const zs = ERA_ORDER.flatMap((id) => [
    SPECS[id].center[1] - SPECS[id].radius,
    SPECS[id].center[1] + SPECS[id].radius,
  ]);
  // Room for the runways (they jut out past the rims) plus a little air around them.
  const margin = RUNWAY.length + 44;
  return {
    islands,
    bridges,
    runways,
    bounds: {
      minX: Math.min(...xs) - margin,
      maxX: Math.max(...xs) + margin,
      minZ: Math.min(...zs) - margin,
      maxZ: Math.max(...zs) + margin,
    },
  };
}

/** All placed buildings across islands, in era then order. */
export function allBuildings(world: WorldLayout): PlacedBuilding[] {
  return ERA_ORDER.flatMap((id) => world.islands[id].buildings);
}

export function findBuilding(world: WorldLayout, id: string): PlacedBuilding | undefined {
  return allBuildings(world).find((b) => b.id === id);
}

/** Island whose centre is nearest to (x, z). */
export function nearestEra(world: WorldLayout, x: number, z: number): EraId {
  let best: EraId = "era-1";
  let bestD = Infinity;
  for (const id of ERA_ORDER) {
    const c = world.islands[id].geometry.center;
    const d = Math.hypot(x - c[0], z - c[1]);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

export function isEraId(value: string | null | undefined): value is EraId {
  return value === "era-1" || value === "era-2" || value === "era-3";
}
