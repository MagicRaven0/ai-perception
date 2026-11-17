import { z } from "zod";

/**
 * Content schemas. Phase 0 covers site, eras and insights.
 * Phase 1 adds buildings, comparisons, datasets, episodes, sources and credits (PLAN.md section 4).
 *
 * Placeholder rule: any string that is not final yet starts with the literal prefix "TODO:".
 * `npm run check-content` lists every one of them.
 */

export const PLACEHOLDER_PREFIX = "TODO:";

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "IDs are kebab-case");

export const EraId = z.enum(["era-1", "era-2", "era-3"]);
export type EraId = z.infer<typeof EraId>;

export const TeamMember = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
});

export const Site = z.object({
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  course: z.string().min(1),
  university: z.string().min(1),
  /** One sentence. Rendered on the landing hero, the 2D intro, the chatbot base prompt and the About page. */
  thesis: z.string().min(1),
  team: z.array(TeamMember),
  aiDisclosure: z.string().min(1),
});
export type Site = z.infer<typeof Site>;

export const Era = z.object({
  id: EraId,
  slug: id,
  number: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** Island name shown in 3D and as the era label. */
  islandName: z.string().min(1),
  title: z.string().min(1),
  years: z.object({
    start: z.number().int(),
    end: z.union([z.number().int(), z.literal("present")]),
  }),
  anchorFigures: z.array(
    z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      imageId: id.optional(),
    }),
  ),
  /** 2-3 real paragraphs from the essay (markdown). */
  perceptionSummary: z.string().min(1),
  /** One paragraph: how this era supports the thesis. */
  thesisLink: z.string().min(1),
  palette: z.object({
    base: z.string().regex(/^#[0-9a-f]{6}$/i),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
});
export type Era = z.infer<typeof Era>;

/** Benefit / risk / danger quick points from the group's previous project, scattered around each island. */
export const Insight = z
  .object({
    id,
    eraId: EraId,
    kind: z.enum(["benefit", "risk", "danger"]),
    /** One quick point, max ~25 words. */
    text: z.string().min(1),
    /** Building it sits next to (Phase 3 places it in 3D). Optional: free-standing signposts are fine. */
    buildingId: id.optional(),
    sourceIds: z.array(id),
    /** True when this is the group's own view rather than a sourced fact. */
    groupCommentary: z.boolean(),
  })
  .refine((i) => i.groupCommentary || i.sourceIds.length > 0, {
    message: "An insight needs at least one source, or groupCommentary: true",
  });
export type Insight = z.infer<typeof Insight>;
