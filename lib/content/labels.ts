import type { BuildingKind, Era } from "./schema";

export const BUILDING_LABEL: Record<BuildingKind, string> = {
  podcast: "Podcast studio",
  interview: "Interview booth",
  documents: "Archive",
  research: "Research lab",
  video: "Cinema",
  animation: "Gallery",
  experience: "Arcade",
};

export const INSIGHT_LABEL = { benefit: "Benefit", risk: "Risk", danger: "Danger" } as const;

export function eraYears(era: Pick<Era, "years">): string {
  const end = era.years.end === "present" ? "now" : era.years.end;
  return `${era.years.start}–${end}`;
}
