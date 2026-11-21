import "server-only";
import { arcadeFor } from "./arcades";
import { referencesBuildingId, referencesForEra } from "./references";
import { buildings, eras, getEpisode, getImage, insights } from "./index";
import { BUILDING_LABEL, eraYears, INSIGHT_LABEL } from "./labels";
import { isPlaceholder } from "./placeholder";
import { toTrack } from "@/lib/audio/track";
import { layoutWorld } from "@/lib/three/layout";
import type { ExploreData } from "@/lib/three/explore-data";

/**
 * Everything /explore needs, computed on the server from content/ (no coordinates in content files):
 * the world layout from lib/three/layout.ts and the HUD text. Serialisable.
 */
export function buildExploreData(): ExploreData {
  const eraSlug = Object.fromEntries(eras.map((e) => [e.id, e.slug]));

  const world = layoutWorld({
    eras: eras.map((e) => ({
      id: e.id,
      anchorFigures: e.anchorFigures.map((f) => {
        const img = f.imageId ? getImage(f.imageId) : undefined;
        return { name: f.name, role: f.role, imageSrc: img?.src, imageAlt: img?.alt, look: f.look };
      }),
    })),
    buildings: buildings.map((b) => ({
      id: b.id,
      eraId: b.eraId,
      order: b.order,
      kind: b.kind,
      comingSoon: isPlaceholder(b.long),
    })).concat(
      // One generated References building per island, after the content buildings (docs/VISION.md).
      eras.map((e) => ({
        id: referencesBuildingId(e.id),
        eraId: e.id,
        order: Math.max(0, ...buildings.filter((b) => b.eraId === e.id).map((b) => b.order)) + 1,
        kind: "documents" as const,
        comingSoon: false,
      })),
    ),
    insights: insights.map((i) => ({ id: i.id, eraId: i.eraId, kind: i.kind, buildingId: i.buildingId })),
  });

  const data: ExploreData = {
    world,
    eras: eras.map((e) => ({
      id: e.id,
      slug: e.slug,
      number: e.number,
      islandName: e.islandName,
      years: eraYears(e),
    })),
    buildings: {},
    signs: {},
  };

  for (const b of buildings) {
    const episode = b.media.episodeId ? getEpisode(b.media.episodeId) : undefined;
    data.buildings[b.id] = {
      id: b.id,
      eraId: b.eraId,
      eraSlug: eraSlug[b.eraId] ?? "",
      kind: b.kind,
      kindLabel: BUILDING_LABEL[b.kind],
      title: b.title,
      short: b.short,
      comingSoon: isPlaceholder(b.long),
      track: episode ? toTrack(episode, eras) : null,
      episodeId: b.media.episodeId,
      startAt: b.media.startAt,
      speakers: episode ? episode.speakers.map((s) => ({ name: s.name, role: s.role })) : [],
      hasVideo: Boolean(b.media.youtubeId),
      documentUrl: b.media.documentUrl,
      arcade: arcadeFor(b.id),
    };
  }
  for (const e of eras) {
    const id = referencesBuildingId(e.id);
    data.buildings[id] = {
      id,
      eraId: e.id,
      eraSlug: e.slug,
      kind: "documents",
      kindLabel: "Library",
      title: `References: ${e.islandName}`,
      short: "Every source this island draws on, in APA 7, with a link to each.",
      comingSoon: false,
      track: null,
      speakers: [],
      hasVideo: false,
      arcade: null,
      references: referencesForEra(e.id).map((s) => ({ id: s.id, apa: s.apa, url: s.url })),
    };
  }
  for (const i of insights) {
    data.signs[i.id] = { id: i.id, kind: i.kind, label: INSIGHT_LABEL[i.kind], text: i.text };
  }
  for (const island of Object.values(world.islands)) {
    for (const f of island.figures) {
      data.signs[f.id] = { id: f.id, kind: "figure", label: f.name, text: f.role };
    }
  }
  return data;
}
