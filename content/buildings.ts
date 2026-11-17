import type { z } from "zod";
import type { Building } from "@/lib/content/schema";

/**
 * Buildings: one per piece of content. Each is a building you drive to in 3D and a section in 2D.
 *
 * kind decides the building's look:
 *   podcast -> podcast studio, interview -> interview booth, documents -> archive, research -> lab,
 *   video -> cinema, animation -> gallery, experience -> arcade (small interactive scene)
 *
 * To add one: copy a block, give it a new id, set eraId, order (position on that island) and kind.
 * short = 60 words max (3D drawer). long = full text for 2D (blank line between paragraphs).
 * media (all optional): episodeId + startAt (seconds), youtubeId (unlisted video), documentUrl, imageId.
 * Facts need sourceIds (from content/sources.ts), or set groupCommentary: true for the group's own view.
 * While long starts with "TODO:", the building shows as "coming soon".
 */
export const buildings: z.input<typeof Building>[] = [
  // ---------------------------------------------------------------- The Past
  {
    id: "dartmouth-workshop",
    eraId: "era-1",
    order: 1,
    kind: "research",
    title: "TODO: building title (suggestion: The 1956 Dartmouth workshop)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: full section text from the essay",
    sourceIds: [],
  },
  {
    id: "mainframe-archive",
    eraId: "era-1",
    order: 2,
    kind: "documents",
    title: "TODO: building title (suggestion: Room-sized computers)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: full section text from the essay",
    sourceIds: [],
  },
  {
    id: "era-1-podcast",
    eraId: "era-1",
    order: 3,
    kind: "podcast",
    title: "TODO: building title (podcast about the 1950s)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: what the episode covers",
    media: { episodeId: "episode-1" },
    sourceIds: [],
  },

  // ----------------------------------------------------------- The Jobs Era
  {
    id: "interface-gallery",
    eraId: "era-2",
    order: 1,
    kind: "animation",
    title: "TODO: building title (suggestion: Computers become personal)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: full section text from the essay",
    sourceIds: [],
  },
  {
    id: "voice-assistant-cinema",
    eraId: "era-2",
    order: 2,
    kind: "video",
    title: "TODO: building title (suggestion: Talking to software, 2011)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: full section text from the essay",
    sourceIds: [],
  },
  {
    id: "era-2-interview",
    eraId: "era-2",
    order: 3,
    kind: "interview",
    title: "TODO: building title (interview about the personal computing era)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: what the interview covers",
    sourceIds: [],
  },

  // ------------------------------------------------------------ The Future
  {
    id: "public-opinion-lab",
    eraId: "era-3",
    order: 1,
    kind: "research",
    title: "TODO: building title (suggestion: What the polls say now)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: full section text from the essay",
    sourceIds: [],
  },
  {
    id: "bengio-archive",
    eraId: "era-3",
    order: 2,
    kind: "documents",
    title: "TODO: building title (Yoshua Bengio's public position)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: summary of his public statements, with sources",
    sourceIds: [],
  },
  {
    id: "aus-interview",
    eraId: "era-3",
    order: 3,
    kind: "interview",
    title: "TODO: building title (interview with Professor Aqeel at AUS)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: what the interview covers",
    media: { episodeId: "interview-aqeel" },
    sourceIds: [],
  },
  {
    id: "feelings-arcade",
    eraId: "era-3",
    order: 4,
    kind: "experience",
    title: "TODO: building title (suggestion: How do you feel about AI?)",
    short: "TODO: 1-2 sentence teaser for the 3D drawer",
    long: "TODO: intro text for the interactive scene",
    sourceIds: [],
  },
];
