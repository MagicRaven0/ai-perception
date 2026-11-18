"use client";

import Link from "next/link";
import { useRef } from "react";
import { useStore } from "@/lib/store";
import type { ExploreBuilding, ExploreEra } from "@/lib/three/explore-data";
import { ContentText } from "@/components/content/ContentText";
import { PlayButton } from "@/components/audio/PlayButton";
import { isPlaceholder } from "@/lib/content/placeholder";
import { buildingName } from "./InteractPrompt";
import { useDialog } from "./useDialog";

/**
 * Building drawer (PLAN 7.1 z-drawer): right panel 420px on desktop, bottom sheet at 70% height on phones.
 * Real DOM: heading, focus moved in and kept inside, Escape closes, focus returns. Opened only by the
 * visitor (E / tap / deep link ?b=), never automatically. The bottom padding keeps the action row clear of
 * the root layout's "Ask the guide" pill (z-chat sits above z-drawer) on every screen size.
 */
export function BuildingDrawer({
  buildings,
  eras,
}: {
  buildings: Record<string, ExploreBuilding>;
  eras: ExploreEra[];
}) {
  const openId = useStore((s) => s.openBuildingId);
  const b = openId ? buildings[openId] : undefined;
  if (!b) return null;
  return <Drawer key={b.id} b={b} era={eras.find((e) => e.id === b.eraId)} />;
}

function Drawer({ b, era }: { b: ExploreBuilding; era?: ExploreEra }) {
  const ref = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const close = () => useStore.getState().closeBuilding();
  // No opener to return to (E key with focus on the page, or a ?b= deep link): the prompt's Open button.
  const { onKeyDown } = useDialog(ref, true, close, heading, "interact-prompt-button");
  const titleId = `drawer-title-${b.id}`;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      // A placeholder title would be read out as authoring text: name the dialog like the prompt does.
      {...(isPlaceholder(b.title) ? { "aria-label": buildingName(b) } : { "aria-labelledby": titleId })}
      onKeyDown={onKeyDown}
      className="fixed inset-x-0 bottom-14 z-drawer flex h-[70dvh] flex-col rounded-t-[20px] border-t border-rule bg-paper text-ink shadow-sheet md:inset-x-auto md:top-4 md:right-4 md:bottom-[5.25rem] md:h-auto md:w-[420px] md:rounded-[20px] md:border"
    >
      <div className="flex items-center justify-between gap-3 px-6 pt-5">
        <p className="text-sm font-semibold text-muted">
          {b.kindLabel}
          {era ? ` · ${era.islandName}` : ""}
        </p>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-lg font-semibold transition-colors hover:bg-rule focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pt-2 pb-20">
        <h2
          ref={heading}
          id={titleId}
          tabIndex={-1}
          className="font-display text-3xl leading-tight font-medium tracking-headline focus:outline-none"
        >
          <ContentText value={b.title} />
        </h2>
        <p className="text-lg leading-snug">
          <ContentText value={b.short} />
        </p>

        {b.comingSoon && (
          <p className="rounded-[12px] border border-dashed border-rule px-4 py-3 text-muted" data-placeholder="true">
            Coming soon: the group is still writing this part. The building is here so you can find it later.
          </p>
        )}

        {b.track ? (
          <PlayButton track={b.track} startAt={b.startAt} label={b.startAt ? undefined : "Play episode"} />
        ) : b.episodeId ? (
          <p className="text-sm text-muted">Episode coming soon.</p>
        ) : null}

        {b.hasVideo && <p className="text-sm text-muted">This building has a video: watch it in reading mode.</p>}

        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          <Link
            href={`/read/${b.eraSlug}#${b.id}`}
            className="rounded-full bg-ink px-5 py-2.5 font-semibold text-paper transition-transform duration-300 ease-calm hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Read more
          </Link>
          {b.documentUrl && (
            <a
              href={b.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-ink px-5 py-2.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Open document
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
