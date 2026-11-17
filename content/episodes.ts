import type { z } from "zod";
import type { Episode } from "@/lib/content/schema";

/**
 * Podcast episodes and interviews.
 *
 * When an episode is recorded:
 *   1. Export as MP3, mono, 64-96 kbps. Put it in public/audio/ (e.g. public/audio/episode-1.mp3).
 *   2. Set src: "/audio/episode-1.mp3" and durationSec (length in seconds).
 *   3. Transcribe to WebVTT, put it in content/transcripts/, set transcript: "episode-1.vtt".
 *   4. Add chapters: { t: seconds, title: "..." }.
 * Interviews: set consentConfirmed: true only after the speaker has agreed in writing.
 */
export const episodes: z.input<typeof Episode>[] = [
  {
    id: "episode-1",
    title: "TODO: episode 1 title",
    kind: "podcast",
    eraIds: ["era-1"],
    summary: "TODO: 1-2 sentence episode summary",
    speakers: [{ name: "TODO: host name", role: "Host", consentConfirmed: true }],
    src: null,
    durationSec: null,
    chapters: [],
    transcript: null,
  },
  {
    id: "interview-aqeel",
    title: "TODO: interview title (with Professor Aqeel)",
    kind: "interview",
    eraIds: ["era-3"],
    summary: "TODO: 1-2 sentence interview summary",
    speakers: [
      {
        name: "Professor Aqeel",
        role: "TODO: role at American University of Sharjah",
        consentConfirmed: false,
      },
    ],
    src: null,
    durationSec: null,
    chapters: [],
    transcript: null,
  },
];
