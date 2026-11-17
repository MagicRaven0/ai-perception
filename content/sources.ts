import type { z } from "zod";
import type { Source } from "@/lib/content/schema";

/**
 * Works cited (APA 7). Every fact on the site points to one of these by id.
 * url must be a working link (the class requires clickable works cited).
 *
 * Example:
 * {
 *   id: "mccarthy-1955",
 *   apa: "McCarthy, J., Minsky, M. L., Rochester, N., & Shannon, C. E. (1955). A proposal for the Dartmouth summer research project on artificial intelligence.",
 *   url: "https://...",
 *   eraIds: ["era-1"],
 *   type: "report",
 * }
 */
export const sources: z.input<typeof Source>[] = [];
