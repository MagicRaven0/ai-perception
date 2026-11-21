import { z } from "zod";

/**
 * Content schemas (PLAN.md section 4, adjusted by docs/VISION.md).
 *
 * Placeholder rule: any string that is not final yet starts with the literal prefix "TODO:".
 * `npm run check-content` lists every one of them. Placeholders render as hatched boxes.
 */

import { PLACEHOLDER_PREFIX } from "./placeholder";
export { PLACEHOLDER_PREFIX };
const isTodo = (s: string | null | undefined) => typeof s === "string" && s.trimStart().startsWith(PLACEHOLDER_PREFIX);

export const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "IDs are kebab-case");
const Hex = z.string().regex(/^#[0-9a-f]{6}$/i);
/** A URL, or a "TODO:" placeholder until the real one exists. */
const UrlOrTodo = z.union([z.url(), z.string().startsWith(PLACEHOLDER_PREFIX)]);

export const EraId = z.enum(["era-1", "era-2", "era-3"]);
export type EraId = z.infer<typeof EraId>;

/* ------------------------------------------------------------------ site */

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

/** About page: rhetorical situation map, using Handout 12.1 headings. */
export const About = z.object({
  rhetoricalSituation: z.array(z.object({ element: z.string(), answer: z.string() })),
  genreRationale: z.string().min(1),
});
export type About = z.infer<typeof About>;

/* ------------------------------------------------------------------ eras */

/**
 * How a faceless low-poly figure is dressed in 3D (never a face or likeness): outfit colours and one prop.
 * Used for era anchor figures (and stored for episode speakers).
 */
export const FigureLook = z.object({
  top: Hex,
  bottom: Hex,
  prop: z.enum(["none", "microphone", "laptop", "book", "chalk", "headphones", "clipboard", "phone"]).default("none"),
});
export type FigureLook = z.infer<typeof FigureLook>;

export const Era = z.object({
  id: EraId,
  slug: Id,
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
      /** What they expected or argued about AI (shown in the people table). */
      view: z.string().min(1).optional(),
      imageId: Id.optional(),
      look: FigureLook.optional(),
    }),
  ),
  /** 2-3 real paragraphs from the essay (markdown, paragraphs separated by a blank line). */
  perceptionSummary: z.string().min(1),
  /** One paragraph: how this era supports the thesis. */
  thesisLink: z.string().min(1),
  palette: z.object({ base: Hex, accent: Hex, ink: Hex }),
});
export type Era = z.infer<typeof Era>;

/* ------------------------------------------------------------- buildings */

export const BuildingKind = z.enum([
  "podcast",
  "interview",
  "documents",
  "research",
  "video",
  "animation",
  "experience",
]);
export type BuildingKind = z.infer<typeof BuildingKind>;

/** One building in 3D = one section in 2D. Content can arrive later: a TODO long text shows "coming soon". */
export const Building = z
  .object({
    id: Id,
    eraId: EraId,
    /** Order within the era (drives 2D order and the 3D route). */
    order: z.number().int().min(1),
    kind: BuildingKind,
    title: z.string().min(1),
    /** Shown in the 3D drawer. Max about 60 words. */
    short: z.string().min(1),
    /** Shown in 2D and in "Read more" (markdown). */
    long: z.string().min(1),
    media: z
      .object({
        imageId: Id.optional(),
        episodeId: Id.optional(),
        /** Seconds into the episode to start from. */
        startAt: z.number().min(0).optional(),
        /** Unlisted YouTube video id (the part after watch?v=). */
        youtubeId: z
          .string()
          .regex(/^[A-Za-z0-9_-]{11}$/)
          .optional(),
        /** Link to a document or PDF. */
        documentUrl: z.url().optional(),
      })
      .default({}),
    sourceIds: z.array(Id),
    /** True when this is the group's own view rather than a sourced fact. */
    groupCommentary: z.boolean().default(false),
    /** Gets the 3 AI summary chips (Phase 2). */
    summarizable: z.boolean().default(true),
  })
  .refine((b) => b.groupCommentary || b.sourceIds.length > 0 || isTodo(b.long), {
    message: "A building with real text needs at least one source, or groupCommentary: true",
  });
export type Building = z.infer<typeof Building>;

/* -------------------------------------------------------------- insights */

/** Benefit / risk / danger quick points from the group's previous project, scattered around each island. */
export const Insight = z
  .object({
    id: Id,
    eraId: EraId,
    kind: z.enum(["benefit", "risk", "danger"]),
    /** One quick point, max about 25 words. */
    text: z.string().min(1),
    /** Building it sits next to. Optional: free-standing signposts are fine. */
    buildingId: Id.optional(),
    sourceIds: z.array(Id),
    groupCommentary: z.boolean(),
  })
  .refine((i) => i.groupCommentary || i.sourceIds.length > 0, {
    message: "An insight needs at least one source, or groupCommentary: true",
  });
export type Insight = z.infer<typeof Insight>;

/* ----------------------------------------------------------- comparisons */

const ComparisonSide = z.object({
  label: z.string().min(1),
  year: z.union([z.number().int(), z.string()]),
  statement: z.string().min(1),
  sourceId: Id.optional(),
});

export const Comparison = z.object({
  id: Id,
  kind: z.enum(["prediction-vs-reality", "then-vs-now"]),
  left: ComparisonSide,
  right: ComparisonSide,
  takeaway: z.string().min(1),
  eraIds: z.array(EraId).min(1),
});
export type Comparison = z.infer<typeof Comparison>;

/* -------------------------------------------------------------- datasets */

export const Dataset = z
  .object({
    id: Id,
    eraId: EraId,
    title: z.string().min(1),
    /** The exact survey question, for honesty. */
    questionWording: z.string().min(1),
    population: z.string().min(1),
    sampleSize: z.number().int().positive().nullable(),
    fieldDates: z.string().min(1),
    unit: z.string().min(1),
    chartType: z.enum(["bar", "line", "stat"]),
    series: z.array(
      z.object({
        label: z.string().min(1),
        points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })),
      }),
    ),
    sourceId: Id.optional(),
    /** Placeholder datasets render a hatched "Data coming" state, never fake numbers. */
    status: z.enum(["placeholder", "verified"]),
  })
  .refine((d) => d.status === "placeholder" || (d.sourceId && d.series.some((s) => s.points.length)), {
    message: "A verified dataset needs a sourceId and at least one data point",
  });
export type Dataset = z.infer<typeof Dataset>;

/* -------------------------------------------------------------- episodes */

export const Episode = z
  .object({
    id: Id,
    title: z.string().min(1),
    kind: z.enum(["podcast", "interview"]),
    eraIds: z.array(EraId).min(1),
    summary: z.string().min(1),
    speakers: z.array(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        /** Interviews cannot be published until the speaker has agreed in writing. */
        consentConfirmed: z.boolean(),
        look: FigureLook.optional(),
      }),
    ),
    /** MP3 path under /public (e.g. "/audio/ep-1.mp3") or a full URL. Null until recorded. */
    src: z.string().min(1).nullable(),
    durationSec: z.number().positive().nullable(),
    chapters: z.array(z.object({ t: z.number().min(0), title: z.string().min(1), eraId: EraId.optional() })),
    /** File name in content/transcripts/ (WebVTT). Null until transcribed. */
    transcript: z
      .string()
      .regex(/\.vtt$/)
      .nullable(),
    summarizable: z.boolean().default(true),
  })
  .refine((e) => e.kind !== "interview" || !e.src || e.speakers.every((s) => s.consentConfirmed), {
    message: "An interview with audio needs consentConfirmed: true for every speaker",
  });
export type Episode = z.infer<typeof Episode>;

/* --------------------------------------------------------------- sources */

export const Source = z.object({
  id: Id,
  /** Full APA 7 reference. */
  apa: z.string().min(1),
  url: UrlOrTodo,
  eraIds: z.array(EraId),
  type: z.enum(["book", "article", "journal", "report", "poll", "website", "video", "interview", "other"]),
});
export type Source = z.infer<typeof Source>;

/* --------------------------------------------------------- images/credits */

export const Credit = z.object({
  id: Id,
  kind: z.enum(["image", "model", "audio", "music", "font", "video"]),
  title: z.string().min(1),
  author: z.string().min(1),
  licence: z.string().min(1),
  url: UrlOrTodo,
  /** Set when the asset was made with AI: name the tool (class rule). */
  aiTool: z.string().optional(),
});
export type Credit = z.infer<typeof Credit>;

export const Image = z.object({
  id: Id,
  /** Path under /public, e.g. "/images/mccarthy.webp". */
  src: z.string().startsWith("/"),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  creditId: Id,
});
export type Image = z.infer<typeof Image>;
