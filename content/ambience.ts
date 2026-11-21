import type { EraId } from "@/lib/content/schema";

/**
 * World ambience for /explore (docs/VISION.md: lo-fi music per island + ambient sounds, mute always there).
 *
 * Music: by default the site plays its own generated lo-fi groove (lib/audio/lofi.ts), different per island,
 * so nothing is needed here. To use a recorded track instead, add the MP3 at the music path below.
 * To add a track: put the MP3 at the path below (public/audio/ambient/...), add a credit with the same
 * creditId to content/credits.ts (kind "music" or "audio"; set aiTool if it was AI-made), done.
 * Missing files are skipped silently. Ambience is off until the visitor turns it on, and it pauses while
 * a podcast or interview plays. Keep loops short (under 1 MB each, 96 kbps mono is plenty).
 */
export type AmbienceLayer = { src: string; creditId: string; volume: number };

export const ambience: Record<EraId, { music: AmbienceLayer; sounds: AmbienceLayer }> = {
  "era-1": {
    music: { src: "/audio/ambient/the-past-music.mp3", creditId: "ambient-the-past-music", volume: 0.35 },
    // Mainframe hum, relays clicking, wind
    sounds: { src: "/audio/ambient/the-past-sounds.mp3", creditId: "ambient-the-past-sounds", volume: 0.3 },
  },
  "era-2": {
    music: { src: "/audio/ambient/the-jobs-era-music.mp3", creditId: "ambient-the-jobs-era-music", volume: 0.35 },
    // Birds, distant city hum, keyboard clicks
    sounds: { src: "/audio/ambient/the-jobs-era-sounds.mp3", creditId: "ambient-the-jobs-era-sounds", volume: 0.3 },
  },
  "era-3": {
    music: { src: "/audio/ambient/the-future-music.mp3", creditId: "ambient-the-future-music", volume: 0.35 },
    // Night city, soft synth pads, server fans
    sounds: { src: "/audio/ambient/the-future-sounds.mp3", creditId: "ambient-the-future-sounds", volume: 0.3 },
  },
};
