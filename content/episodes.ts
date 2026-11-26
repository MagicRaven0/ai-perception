import type { z } from "zod";
import type { Episode } from "@/lib/content/schema";
import { aqeelLook } from "./eras";

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
 * Filled 22 Nov 2026 (CONTENT_PROMPTS Prompt 7, block A). Chapter times come from the finished audio (25 Nov).
 * The interview guide is in docs/RECORDING_PLAN.md. Speaker looks are faceless outfits only.
 */
const hostLook = { top: "#2f4858", bottom: "#3a3a3a", prop: "headphones" } as const;
const coHostLook = { top: "#b5523b", bottom: "#3a3a3a", prop: "microphone" } as const;
/** Episode 3 has a third host (Waleed Masri). */
const thirdHostLook = { top: "#4f6d3a", bottom: "#3a3a3a", prop: "laptop" } as const;
/** The interviewer in the Aqeel interview: beige and white, a microphone, short dark hair (faceless). */
const interviewerLook = {
  top: "#f3efe6",
  bottom: "#cbb38c",
  prop: "microphone",
  hair: { style: "short", color: "#1e1a17" },
} as const;

export const episodes: z.input<typeof Episode>[] = [
  {
    id: "episode-1",
    title: "Episode 1: A summer to build a mind",
    kind: "podcast",
    eraIds: ["era-1"],
    summary:
      "How AI began as a 1955 proposal and a set of bold predictions, and why the public first met it as a promise from scientists and the Navy rather than as something they could use.",
    speakers: [
      { name: "Rayyan", role: "Host", consentConfirmed: true, look: hostLook },
      { name: "Abdulrahman Ahmad", role: "Co-host", consentConfirmed: true, look: coHostLook },
      {
        name: "1956 Workshop Researcher",
        role: "Fictional guest (not a real person); lines taken from the 1955 Dartmouth proposal",
        consentConfirmed: true,
        look: { top: "#6b4f36", bottom: "#5c5c5c", prop: "chalk" },
      },
    ],
    src: "/audio/ep-1.mp3",
    durationSec: 311,
    chapters: [
      { t: 0, title: "Intro: what did people think AI was in 1956?", eraId: "era-1" },
      { t: 46, title: "The Dartmouth proposal", eraId: "era-1" },
      { t: 112, title: "A visit from 1956 (fictional guest)", eraId: "era-1" },
      { t: 173, title: "Room-sized computers", eraId: "era-1" },
      { t: 213, title: "The 1958 predictions", eraId: "era-1" },
      { t: 249, title: "The first AI winter", eraId: "era-1" },
      { t: 277, title: "Wrap-up: who had control?", eraId: "era-1" },
    ],
    transcript: "ep-1.vtt",
  },
  {
    id: "episode-2",
    title: "Episode 2: A computer for the rest of us",
    kind: "podcast",
    eraIds: ["era-2"],
    summary:
      "How the Macintosh and the idea of a \"bicycle for our minds\" made computers feel like tools people control, while AI research went quiet until Deep Blue and Siri.",
    speakers: [
      { name: "Abdulrahman Ahmad", role: "Host", consentConfirmed: true, look: hostLook },
      { name: "Rayyan", role: "Co-host", consentConfirmed: true, look: coHostLook },
    ],
    src: "/audio/ep-2.mp3",
    durationSec: 321,
    chapters: [
      { t: 0, title: "Intro: from labs to living rooms", eraId: "era-2" },
      { t: 23, title: "The Macintosh, 1984", eraId: "era-2" },
      { t: 114, title: "A bicycle for our minds", eraId: "era-2" },
      { t: 157, title: "The second AI winter and Deep Blue", eraId: "era-2" },
      { t: 238, title: "Siri, 2011", eraId: "era-2" },
      { t: 293, title: "Wrap-up: AI as a helper that waits", eraId: "era-2" },
    ],
    transcript: "ep-2.vtt",
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
    src: "/audio/ep-3.mp3",
    durationSec: 384,
    chapters: [
      { t: 0, title: "Intro: three essays about AI now", eraId: "era-3" },
      { t: 27, title: "Abdulrahman: AI's potential", eraId: "era-3" },
      { t: 127, title: "Rayyan: control matters more than intelligence", eraId: "era-3" },
      { t: 196, title: "Waleed: out of control, or badly trained?", eraId: "era-3" },
      { t: 290, title: "What the public and the experts want", eraId: "era-3" },
      { t: 315, title: "Where we agree, and the limits", eraId: "era-3" },
      { t: 351, title: "Wrap-up: can we still correct it?", eraId: "era-3" },
    ],
    transcript: "ep-3.vtt",
  },
  {
    id: "interview-aqeel",
    title: "Interview: Professor Aqeel on the benefits and risks of AI",
    kind: "interview",
    eraIds: ["era-3"],
    summary:
      "Our conversation with Professor Aqeel, a civil engineering professor at the American University of Sharjah, about the benefits and risks of AI, the need for human oversight, why he does not see it replacing professionals, and the abilities he wants the young generation to develop.",
    speakers: [
      {
        name: "Professor Aqeel",
        role: "Civil Engineering Professor",
        consentConfirmed: true,
        look: aqeelLook,
      },
      { name: "Rayyan", role: "Interviewer", consentConfirmed: true, look: interviewerLook },
    ],
    src: "/audio/interview-aqeel.mp3",
    durationSec: 308,
    chapters: [
      { t: 0, title: "Benefits of AI in daily life" },
      { t: 92, title: "Risks as AI keeps expanding" },
      { t: 135, title: "Dangers, and how to prevent them" },
      { t: 162, title: "His take on AI" },
      { t: 231, title: "AI and the young generation" },
      { t: 301, title: "Wrap-up" },
    ],
    transcript: "interview-aqeel.vtt",
  },
];
