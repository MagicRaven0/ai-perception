import Link from "next/link";
import { Fragment } from "react";

/** One source as an APA in-text citation ("Kennedy et al., 2025"), linked to its entry on /sources. */
export type SourceRef = { id: string; cite: string };

/**
 * "(Simon & Newell, 1958; IBM, n.d.)" inside a sentence or caption. Full references only appear in the reference
 * lists: the end of each era, the References buildings and /sources.
 */
export function InTextCite({ sources }: { sources: SourceRef[] }) {
  if (sources.length === 0) return null;
  return (
    <>
      (
      {sources.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && "; "}
          <Link href={`/sources#${s.id}`} className="underline decoration-1 underline-offset-2">
            {s.cite}
          </Link>
        </Fragment>
      ))}
      )
    </>
  );
}
