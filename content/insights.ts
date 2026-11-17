import type { Insight } from "@/lib/content/schema";

/**
 * Benefit / risk / danger quick points (from the group's previous project).
 * They appear as small signposts around each island in 3D, as callouts in 2D, and the chatbot knows them.
 *
 * To add one: copy a block, give it a new id, set eraId and kind, write one short point.
 * Either list sourceIds (from content/sources.ts, added in Phase 1) or set groupCommentary: true.
 */
export const insights: Insight[] = [
  {
    id: "era-1-benefit-1",
    eraId: "era-1",
    kind: "benefit",
    text: "TODO: one quick benefit point for era 1",
    sourceIds: [],
    groupCommentary: true,
  },
  {
    id: "era-1-risk-1",
    eraId: "era-1",
    kind: "risk",
    text: "TODO: one quick risk point for era 1",
    sourceIds: [],
    groupCommentary: true,
  },
  {
    id: "era-2-benefit-1",
    eraId: "era-2",
    kind: "benefit",
    text: "TODO: one quick benefit point for era 2",
    sourceIds: [],
    groupCommentary: true,
  },
  {
    id: "era-2-risk-1",
    eraId: "era-2",
    kind: "risk",
    text: "TODO: one quick risk point for era 2",
    sourceIds: [],
    groupCommentary: true,
  },
  {
    id: "era-3-benefit-1",
    eraId: "era-3",
    kind: "benefit",
    text: "TODO: one quick benefit point for era 3",
    sourceIds: [],
    groupCommentary: true,
  },
  {
    id: "era-3-danger-1",
    eraId: "era-3",
    kind: "danger",
    text: "TODO: one quick danger point for era 3",
    sourceIds: [],
    groupCommentary: true,
  },
];
