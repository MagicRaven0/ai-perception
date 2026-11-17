"use client";

import Link from "next/link";
import { useState } from "react";
import type { EraId } from "@/lib/content/schema";
import type { Track } from "@/lib/store";
import { ContentText } from "@/components/content/ContentText";
import { PlayButton } from "./PlayButton";

type Item = {
  id: string;
  title: string;
  summary: string;
  kind: "podcast" | "interview";
  eraIds: EraId[];
  track: Track | null;
};

export function EpisodeList({ items, eras }: { items: Item[]; eras: { id: EraId; name: string }[] }) {
  const [filter, setFilter] = useState<EraId | "all">("all");
  const shown = filter === "all" ? items : items.filter((i) => i.eraIds.includes(filter));

  return (
    <>
      <div role="group" aria-label="Filter by era" className="mt-10 flex flex-wrap gap-2">
        {[{ id: "all" as const, name: "All" }, ...eras].map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setFilter(e.id)}
            aria-pressed={filter === e.id}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              filter === e.id ? "border-ink bg-ink text-paper" : "border-rule bg-paper hover:border-ink"
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      <ul className="mt-8 border-t border-ink">
        {shown.map((item) => (
          <li key={item.id} className="grid gap-3 border-b border-ink py-6 md:grid-cols-12 md:items-center">
            <span className="text-muted md:col-span-2">{item.kind === "interview" ? "Interview" : "Podcast"}</span>
            <div className="md:col-span-7">
              <Link href={`/listen/${item.id}`} className="text-xl font-medium hover:underline">
                <ContentText value={item.title} />
              </Link>
              <p className="mt-1 text-muted">
                <ContentText value={item.summary} />
              </p>
            </div>
            <div className="md:col-span-3 md:text-right">
              {item.track ? (
                <PlayButton track={item.track} />
              ) : (
                <span className="text-muted">Recording coming soon</span>
              )}
            </div>
          </li>
        ))}
        {shown.length === 0 && <li className="border-b border-ink py-6 text-muted">No episodes for this era yet.</li>}
      </ul>
    </>
  );
}
