import type { z } from "zod";
import type { Comparison } from "@/lib/content/schema";

/**
 * Side-by-side comparisons, shown as a drag slider (left = then, right = now).
 * Each side should cite a source from content/sources.ts.
 */
export const comparisons: z.input<typeof Comparison>[] = [
  {
    id: "predictions-vs-reality",
    kind: "prediction-vs-reality",
    left: {
      label: "TODO: label (e.g. The 1956 prediction)",
      year: 1956,
      statement: "TODO: what was predicted, quoted or paraphrased from a source",
    },
    right: {
      label: "TODO: label (e.g. What happened)",
      year: "present",
      statement: "TODO: what is true today, from a source",
    },
    takeaway: "TODO: one or two sentences on what the comparison shows",
    eraIds: ["era-1", "era-3"],
  },
];
