import type { Episode, Era } from "@/lib/content/schema";
import type { Track } from "@/lib/store";

/** Server-side helper: the serialisable track object client audio components need. Null until recorded. */
export function toTrack(episode: Episode, eras: Era[]): Track | null {
  if (!episode.src) return null;
  // Never play an interview before every speaker has agreed in writing.
  if (episode.kind === "interview" && !episode.speakers.every((s) => s.consentConfirmed)) return null;
  const era = eras.find((e) => e.id === episode.eraIds[0]);
  return {
    id: episode.id,
    title: episode.title,
    src: episode.src,
    kindLabel: episode.kind === "interview" ? "Interview" : "Podcast",
    eraLabel: era?.islandName,
    durationSec: episode.durationSec,
  };
}
