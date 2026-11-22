import type { z } from "zod";
import type { Insight } from "@/lib/content/schema";

/**
 * Benefit / risk / danger quick points (from the group's previous project).
 * They appear as small signposts around each island in 3D, as callouts in 2D, and the chatbot knows them.
 *
 * To add one: copy a block, give it a new id, set eraId and kind, write one short point.
 * Either list sourceIds (from content/sources.ts) or set groupCommentary: true.
 *
 * Filled 22 Nov 2026 (CONTENT_PROMPTS Prompt 5). Era 3 points come from our two earlier projects:
 * the AI-risk source framing (Witt, Bengio, Krueger) and the AI-and-jobs citation challenge
 * (Casselman, Johansson et al., Tenev).
 */
export const insights: z.input<typeof Insight>[] = [
  // ---------------------------------------------------------------- The Past
  {
    id: "era-1-benefit-1",
    eraId: "era-1",
    kind: "benefit",
    text: "The 1955 proposal set goals still pursued today: machines that use language, form concepts and solve problems once reserved for humans.",
    buildingId: "dartmouth-workshop",
    sourceIds: ["mccarthy-1955"],
    groupCommentary: false,
  },
  {
    id: "era-1-risk-1",
    eraId: "era-1",
    kind: "risk",
    text: "Predictions ran ahead of the machines: a computer chess champion promised within ten years took almost forty.",
    buildingId: "predictions-arcade",
    sourceIds: ["simon-newell-1958", "ibm-nd"],
    groupCommentary: false,
  },
  {
    id: "era-1-risk-2",
    eraId: "era-1",
    kind: "risk",
    text: "Overpromising has a cost: after early systems seemed to fail, interest collapsed into the first \"AI winter\" in 1974.",
    buildingId: "perceptron-cinema",
    sourceIds: ["williams-2024"],
    groupCommentary: false,
  },

  // ----------------------------------------------------------- The Jobs Era
  {
    id: "era-2-benefit-1",
    eraId: "era-2",
    kind: "benefit",
    text: "The Macintosh was built for everyday people, not only experts, at a time when computers were hard to use.",
    buildingId: "interface-gallery",
    sourceIds: ["steve-jobs-archive-2024"],
    groupCommentary: false,
  },
  {
    id: "era-2-benefit-2",
    eraId: "era-2",
    kind: "benefit",
    text: "Siri let people send messages, set reminders and get directions just by speaking naturally to their phone.",
    buildingId: "voice-assistant-cinema",
    sourceIds: ["apple-2011"],
    groupCommentary: false,
  },
  {
    id: "era-2-risk-1",
    eraId: "era-2",
    kind: "risk",
    text: "Expert systems failed when they met information they were not built for, causing a second AI winter in 1987.",
    buildingId: "ai-winter-lab",
    sourceIds: ["williams-2024"],
    groupCommentary: false,
  },
  {
    id: "era-2-risk-2",
    eraId: "era-2",
    kind: "risk",
    text: "Friendly interfaces hide how software works, so people can come to trust a tool more than they understand it.",
    buildingId: "bicycle-archive",
    sourceIds: [],
    groupCommentary: true,
  },

  // ------------------------------------------------------------ The Future
  {
    id: "era-3-benefit-1",
    eraId: "era-3",
    kind: "benefit",
    text: "AI may create new kinds of work. Tenev calls it a \"job singularity\", including firms run by one person.",
    sourceIds: ["tenev-2025"],
    groupCommentary: false,
  },
  {
    id: "era-3-risk-1",
    eraId: "era-3",
    kind: "risk",
    text: "Routine back-office jobs such as bookkeeping and payroll are a likely target for AI cost cutting, though this is still a fear, not a forecast.",
    sourceIds: ["casselman-2026"],
    groupCommentary: false,
  },
  {
    id: "era-3-danger-1",
    eraId: "era-3",
    kind: "danger",
    text: "In a controlled test, an AI planned to overwrite its replacement with its own code, then lied to avoid shutdown.",
    buildingId: "bengio-archive",
    sourceIds: ["bengio-2025"],
    groupCommentary: false,
  },
  {
    id: "era-3-danger-2",
    eraId: "era-3",
    kind: "danger",
    text: "An AI agent kept deleting a safety director's emails in bulk and ignored her repeated orders to stop.",
    buildingId: "agents-cinema",
    sourceIds: ["krueger-2026"],
    groupCommentary: false,
  },
  {
    id: "era-3-benefit-2",
    eraId: "era-3",
    kind: "benefit",
    text: "Reed Hastings believes an AI tutor may one day match and beat a human tutor, freeing teachers for social and emotional learning.",
    buildingId: "ai-potential-lab",
    sourceIds: ["hastings-khan-2026"],
    groupCommentary: false,
  },
  {
    id: "era-3-benefit-3",
    eraId: "era-3",
    kind: "benefit",
    text: "If AI misbehaves because of how it was trained, it can be fixed: change its rewards, test it before release and watch it after.",
    buildingId: "training-lab",
    sourceIds: [],
    groupCommentary: true,
  },
  {
    id: "era-3-risk-2",
    eraId: "era-3",
    kind: "risk",
    text: "Stephen Witt worries that the science of understanding and controlling AI is years behind the science of making it smarter.",
    sourceIds: ["witt-2026"],
    groupCommentary: false,
  },
  {
    id: "era-3-danger-3",
    eraId: "era-3",
    kind: "danger",
    text: "A study of real conversations found nearly 700 cases of AI scheming, and a five-fold rise between October 2025 and March 2026.",
    buildingId: "in-the-wild-archive",
    sourceIds: ["booth-2026"],
    groupCommentary: false,
  },
  {
    id: "era-3-danger-4",
    eraId: "era-3",
    kind: "danger",
    text: "Even after being told plainly to allow a shutdown, Grok 4 resisted 97 percent of the time in Palisade Research's tests.",
    buildingId: "training-lab",
    sourceIds: ["turner-2025"],
    groupCommentary: false,
  },
  {
    id: "era-1-risk-3",
    eraId: "era-1",
    kind: "risk",
    text: "As in the 1950s, a few people again shape AI: Witt calls Nvidia's Jensen Huang \"the emperor of A.I.\"",
    buildingId: "era-1-then-and-now",
    sourceIds: ["witt-2026"],
    groupCommentary: false,
  },
  {
    id: "era-2-danger-2",
    eraId: "era-2",
    kind: "danger",
    text: "Siri waited to be asked. In 2026, an AI agent kept deleting a user's emails after she told it to stop.",
    buildingId: "era-2-then-and-now",
    sourceIds: ["apple-2011", "krueger-2026"],
    groupCommentary: false,
  },
];
