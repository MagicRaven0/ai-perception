"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { ExploreBuilding, ExploreSign } from "@/lib/three/explore-data";
import { isTypingTarget } from "@/lib/three/transient";
import { ContentText } from "@/components/content/ContentText";
import { isPlaceholder } from "@/lib/content/placeholder";

/** E / tap: open the nearby building, or talk to the guide. Shared by the prompt, the E key and touch button. */
export function interact() {
  const s = useStore.getState();
  if (s.openBuildingId) return;
  if (s.nearbyBuildingId) s.openBuilding(s.nearbyBuildingId);
  else if (s.nearGuide) window.dispatchEvent(new Event("open-chat"));
}

/** Accessible name for a building: its title, or "<kind> (coming soon)" while the title is a placeholder. */
export function buildingName(b: Pick<ExploreBuilding, "title" | "kindLabel">) {
  return isPlaceholder(b.title) ? `${b.kindLabel} (coming soon)` : b.title;
}

/**
 * Bottom-centre prompt above the audio dock (and above the touch arrow pad / Boost row on coarse pointers; its
 * "Tap to open / Tap to talk" button is the touch interact button): "Press E / Tap to open" near a building, "Talk to the guide"
 * near the guide, or the insight / person text near a signpost or figure. Polite live region, so screen
 * readers hear where they are. Also owns the E key.
 */
export function InteractPrompt({
  buildings,
  signs,
}: {
  buildings: Record<string, ExploreBuilding>;
  signs: Record<string, ExploreSign>;
}) {
  const nearbyId = useStore((s) => s.nearbyBuildingId);
  const nearGuide = useStore((s) => s.nearGuide);
  const signId = useStore((s) => s.nearbySignId);
  const drawerOpen = useStore((s) => s.openBuildingId !== null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      interact();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const building = nearbyId ? buildings[nearbyId] : undefined;
  const sign = signId ? signs[signId] : undefined;

  let content: React.ReactNode = null;
  if (drawerOpen) content = null;
  else if (building) {
    content = (
      <PromptCard>
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-muted">{building.kindLabel}</span>
          <span className="block truncate font-semibold">
            {isPlaceholder(building.title) ? "Coming soon" : building.title}
          </span>
        </span>
        <PromptButton label="Open" target={buildingName(building)} />
      </PromptCard>
    );
  } else if (nearGuide) {
    content = (
      <PromptCard>
        <span className="font-semibold">The guide can answer questions about the project.</span>
        <PromptButton label="Talk" target="to the guide" />
      </PromptCard>
    );
  } else if (sign) {
    content = (
      <PromptCard>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-xs font-semibold text-muted">
            {sign.kind !== "figure" && (
              <span
                aria-hidden="true"
                className={`size-2.5 rounded-full ${sign.kind === "benefit" ? "bg-benefit" : sign.kind === "risk" ? "bg-risk" : "bg-danger"}`}
              />
            )}
            {sign.kind === "figure" ? "Person" : sign.label}
          </span>
          <span className="block font-semibold">
            {sign.kind === "figure" ? (
              <>
                {sign.label}: <ContentText value={sign.text} />
              </>
            ) : (
              <ContentText value={sign.text} />
            )}
          </span>
        </span>
      </PromptCard>
    );
  }

  return (
    <div
      aria-live="polite"
      data-interact-prompt=""
      // Touch layouts (any width, tablets too) lift the prompt above the arrow pad and Boost row (MobileControls).
      // Short landscape phones have no room above that row (it would cover the island buttons): there the prompt
      // stays low, between the arrow pad and Boost (side padding wider than the pad).
      className="pointer-events-none fixed inset-x-0 bottom-[8.5rem] z-hud flex justify-center px-4 md:bottom-[6.5rem] [@media(pointer:coarse)_and_(max-height:30rem)]:bottom-[9rem]! [@media(pointer:coarse)_and_(max-height:30rem)]:px-[10.5rem]! [@media(pointer:coarse)_and_(min-height:30.01rem)]:bottom-[14.5rem]!"
    >
      {content}
    </div>
  );
}

function PromptCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto flex max-w-[min(32rem,100%)] items-center gap-4 rounded-full bg-paper py-2 pr-2 pl-5 text-ink shadow-card-strong">
      {children}
    </div>
  );
}

function PromptButton({ label, target }: { label: string; target: string }) {
  return (
    <button
      type="button"
      id="interact-prompt-button"
      onClick={interact}
      className="flex shrink-0 items-center gap-2 rounded-full bg-ink py-2 pr-4 pl-2 font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:pl-4"
    >
      <kbd className="hidden size-7 items-center justify-center rounded-full bg-paper font-mono text-sm text-ink [@media(pointer:fine)]:flex">
        E
      </kbd>
      <span className="[@media(pointer:fine)]:hidden">Tap to {label.toLowerCase()}</span>
      <span className="hidden [@media(pointer:fine)]:inline">{label}</span>
      <span className="sr-only"> {target}</span>
    </button>
  );
}
