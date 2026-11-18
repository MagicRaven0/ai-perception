"use client";

import { useStore } from "@/lib/store";

/** "3 / 10 found" pill. */
export function ProgressCounter({ ids }: { ids: string[] }) {
  const found = useStore((s) => s.visitedBuildingIds.filter((id) => ids.includes(id)).length);
  return (
    <p className="rounded-full bg-paper px-4 py-1.5 text-sm font-semibold text-ink shadow-pill">
      <span className="tabular-nums">
        {found} / {ids.length}
      </span>{" "}
      found
    </p>
  );
}
