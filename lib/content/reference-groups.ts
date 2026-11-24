import type { Source } from "./schema";

/**
 * Reference lists show the sources of our own essays first, then the ones added for the history (round 5b: the
 * professor allowed extra sources as long as our essays stay the core). Keeps the given (alphabetical) order
 * inside each group; empty groups are left out. Client-safe.
 */
export function groupByOrigin<T extends { origin?: Source["origin"] }>(items: T[]): { title: string; items: T[] }[] {
  return [
    { title: "From our essays", items: items.filter((s) => s.origin === "essay") },
    { title: "Added for the history", items: items.filter((s) => s.origin !== "essay") },
  ].filter((g) => g.items.length > 0);
}
