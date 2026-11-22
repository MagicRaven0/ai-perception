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
 *
 * Filled 22 Nov 2026 (CONTENT_PROMPTS Prompt 7, block A). Chapter times match the full scripts in
 * docs/PODCAST_SCRIPTS.md at about 145 words a minute: update them from the real recordings.
 * The interview guide is in docs/RECORDING_PLAN.md. Speaker looks are faceless outfits only.
 */
const hostLook = { top: "#2f4858", bottom: "#3a3a3a", prop: "headphones" } as const;
const coHostLook = { top: "#b5523b", bottom: "#3a3a3a", prop: "microphone" } as const;
/** Episode 3 has a third host (Waleed Masri). */
const thirdHostLook = { top: "#4f6d3a", bottom: "#3a3a3a", prop: "laptop" } as const;

export const episodes: z.input<typeof Episode>[] = [
  {
    id: "episode-1",
    title: "Episode 1: A summer to build a mind",
    kind: "podcast",
    eraIds: ["era-1"],
    summary:
      "How AI began as a 1955 proposal and a set of bold predictions, and why the public first met it as a promise from scientists and the Navy rather than as something they could use.",
    speakers: [
      { name: "TODO: host name", role: "Host", consentConfirmed: false, look: hostLook },
      { name: "TODO: co-host name", role: "Co-host", consentConfirmed: false, look: coHostLook },
      {
        name: "1956 Workshop Researcher",
        role: "Fictional guest (not a real person); lines taken from the 1955 Dartmouth proposal",
        consentConfirmed: true,
        look: { top: "#6b4f36", bottom: "#5c5c5c", prop: "chalk" },
      },
    ],
    src: null,
    durationSec: null,
    chapters: [
      { t: 0, title: "Intro: what did people think AI was in 1956?", eraId: "era-1" },
      { t: 60, title: "The Dartmouth proposal", eraId: "era-1" },
      { t: 135, title: "A visit from 1956 (fictional guest)", eraId: "era-1" },
      { t: 215, title: "Room-sized computers", eraId: "era-1" },
      { t: 265, title: "The 1958 predictions", eraId: "era-1" },
      { t: 305, title: "The first AI winter", eraId: "era-1" },
      { t: 340, title: "Wrap-up: who had control?", eraId: "era-1" },
    ],
    transcript: null,
  },
  {
    id: "episode-2",
    title: "Episode 2: A computer for the rest of us",
    kind: "podcast",
    eraIds: ["era-2"],
    summary:
      "How the Macintosh and the idea of a \"bicycle for our minds\" made computers feel like tools people control, while AI research went quiet until Deep Blue and Siri.",
    speakers: [
      { name: "TODO: host name", role: "Host", consentConfirmed: false, look: hostLook },
      { name: "TODO: co-host name", role: "Co-host", consentConfirmed: false, look: coHostLook },
    ],
    src: null,
    durationSec: null,
    chapters: [
      { t: 0, title: "Intro: from labs to living rooms", eraId: "era-2" },
      { t: 25, title: "The Macintosh, 1984", eraId: "era-2" },
      { t: 135, title: "A bicycle for our minds", eraId: "era-2" },
      { t: 190, title: "The second AI winter and Deep Blue", eraId: "era-2" },
      { t: 285, title: "Siri, 2011", eraId: "era-2" },
      { t: 355, title: "Wrap-up: AI as a helper that waits", eraId: "era-2" },
    ],
    transcript: null,
  },
  {
    id: "episode-3",
    title: "Episode 3: Three essays, one question",
    kind: "podcast",
    eraIds: ["era-3"],
    summary:
      "Each of us presents our own research essay: Abdulrahman on AI's potential, Rayyan on why control matters more than intelligence, and Waleed on whether misbehaving AI is out of control or badly trained. Then we discuss where we agree.",
    speakers: [
      { name: "Rayyan", role: "Host; research essay on correcting AI", consentConfirmed: true, look: hostLook },
      { name: "Abdulrahman Ahmad", role: "Co-host; research essay on AI's potential", consentConfirmed: true, look: coHostLook },
      { name: "Waleed Masri", role: "Co-host; research essay on AI that is badly trained", consentConfirmed: true, look: thirdHostLook },
    ],
    src: null,
    durationSec: null,
    chapters: [
      { t: 0, title: "Intro: three essays about AI now", eraId: "era-3" },
      { t: 35, title: "Abdulrahman: AI's potential", eraId: "era-3" },
      { t: 160, title: "Rayyan: control matters more than intelligence", eraId: "era-3" },
      { t: 250, title: "Waleed: out of control, or badly trained?", eraId: "era-3" },
      { t: 360, title: "What the public and the experts want", eraId: "era-3" },
      { t: 385, title: "Where we agree, and the limits", eraId: "era-3" },
      { t: 435, title: "Wrap-up: can we still correct it?", eraId: "era-3" },
    ],
    transcript: null,
  },
  {
    id: "interview-aqeel",
    title: "Interview: Professor Aqeel on how views of AI have changed",
    kind: "interview",
    eraIds: ["era-3"],
    summary:
      "Our conversation with Professor Aqeel of the American University of Sharjah about how people's views of AI have changed, AI at AUS and in the UAE, trust and fear, and what students should know.",
    speakers: [
      {
        name: "Professor Aqeel",
        role: "TODO: role at American University of Sharjah",
        consentConfirmed: false,
        look: { top: "#f2efe6", bottom: "#3a3a3a", prop: "laptop" },
      },
      { name: "TODO: interviewer name", role: "Interviewer", consentConfirmed: false, look: hostLook },
    ],
    src: null,
    durationSec: null,
    chapters: [
      { t: 0, title: "Introductions and consent" },
      { t: 60, title: "How views of AI have changed" },
      { t: 240, title: "AI at AUS and in the UAE" },
      { t: 420, title: "Trust, fear and control" },
      { t: 600, title: "Advice for students" },
    ],
    transcript: null,
  },
];
