import type { EraId } from "@/lib/content/schema";
import type { IslandLayout, PlacedBuilding, PlacedFigure, PlacedInsight } from "@/lib/three/layout";
import type { EraPalette } from "@/lib/three/palette";

/**
 * Props every island component receives from World.tsx. Everything is already positioned by
 * lib/three/layout.ts from content order: island files never compute or hard-code content positions.
 */
export type IslandProps = {
  era: EraId;
  /** Geometry (centre, radius, ring road, bridge angles), spawn, edge walls, and campus/guide on The Future. */
  layout: IslandLayout;
  /** This island's buildings, in content order, with plot position, rotation, sensor and approach pose. */
  buildings: PlacedBuilding[];
  /** This island's benefit / risk / danger signposts. */
  insights: PlacedInsight[];
  /** This island's real people (faceless figure + photo billboard). */
  figures: PlacedFigure[];
  /** The era palette from lib/three/palette.ts. */
  palette: EraPalette;
};
