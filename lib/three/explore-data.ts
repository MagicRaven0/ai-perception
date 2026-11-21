import type { ArcadeConfig } from "@/lib/content/arcades";
import type { BuildingKind, EraId } from "@/lib/content/schema";
import type { Track } from "@/lib/store";
import type { WorldLayout } from "./layout";

/**
 * Serialisable data the /explore server page hands to the client: the computed world layout plus the text
 * the HUD needs (drawer, prompts, minimap labels). Built by lib/content/explore.ts on the server.
 */

export type ExploreEra = {
  id: EraId;
  slug: string;
  number: number;
  islandName: string;
  /** "1950–1959" */
  years: string;
};

export type ExploreBuilding = {
  id: string;
  eraId: EraId;
  eraSlug: string;
  kind: BuildingKind;
  /** "Podcast studio", "Archive", ... */
  kindLabel: string;
  title: string;
  short: string;
  /** Long text still a placeholder: the drawer shows "coming soon". */
  comingSoon: boolean;
  /** Playable episode (null until recorded, or for interviews without consent). */
  track: Track | null;
  /** Episode id even when it cannot play yet (drawer shows "Episode coming"). */
  episodeId?: string;
  startAt?: number;
  /** The episode's speakers (names and roles), so a fictional guest's "not a real person" role is visible. */
  speakers: { name: string; role: string }[];
  hasVideo: boolean;
  documentUrl?: string;
  /** Interactive "experience" (arcade) shown inside the drawer. */
  arcade: ArcadeConfig | null;
  /** Only on an island's generated References building: that island's APA references, sorted. */
  references?: { id: string; apa: string; url: string }[];
};

export type ExploreSign = {
  id: string;
  kind: "benefit" | "risk" | "danger" | "figure";
  /** "Benefit", "Risk", "Danger", or the person's name for figures. */
  label: string;
  text: string;
};

export type ExploreData = {
  world: WorldLayout;
  eras: ExploreEra[];
  buildings: Record<string, ExploreBuilding>;
  /** Insight signposts and figures, by id. */
  signs: Record<string, ExploreSign>;
};
