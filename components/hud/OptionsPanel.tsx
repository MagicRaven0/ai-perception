"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { selectTier, type QualityPref } from "@/lib/three/quality";
import { clearSavedPosition } from "@/lib/three/transient";
import type { WorldLayout } from "@/lib/three/layout";
import { respawn } from "./actions";
import { useDialog } from "./useDialog";

const QUALITY: { value: QualityPref; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Adjusts to how smoothly the world runs" },
  { value: "high", label: "High", hint: "Shadows and sharper edges" },
  { value: "low", label: "Low", hint: "Faster on phones and older laptops" },
];

/** Options (PLAN 7.5): quality + honest current tier and renderer, world sound, "I'm stuck", reset progress. */
export function OptionsPanel({ world, onClose }: { world: WorldLayout; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useDialog(ref, true, onClose);
  const quality = useStore((s) => s.quality);
  const tier = useStore(selectTier);
  const renderer = useStore((s) => s.renderer);
  const ambienceOn = useStore((s) => s.ambienceOn);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="options-title"
      onKeyDown={onKeyDown}
      className="fixed top-20 left-4 z-modal flex max-h-[calc(100dvh-10rem)] w-[min(22rem,calc(100vw-2rem))] flex-col gap-5 overflow-y-auto rounded-[20px] bg-paper p-5 text-ink shadow-panel"
    >
      <div className="flex items-center justify-between">
        <h2 id="options-title" className="font-display text-2xl font-medium tracking-headline">
          Options
        </h2>
        <CloseButton onClose={onClose} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Quality</legend>
        {QUALITY.map((q) => (
          <label
            key={q.value}
            className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-rule px-3 py-2 has-checked:border-ink has-focus-visible:outline-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name="quality"
              value={q.value}
              checked={quality === q.value}
              onChange={() => useStore.getState().setQuality(q.value)}
              className="mt-1 accent-ink"
            />
            <span>
              <span className="block font-semibold">{q.label}</span>
              <span className="block text-sm text-muted">{q.hint}</span>
            </span>
          </label>
        ))}
        <p className="text-sm text-muted">
          Running at <strong className="text-ink">{tier === "high" ? "High" : "Low"}</strong>
          {renderer ? ` on ${renderer}` : ""}.
        </p>
      </fieldset>

      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span>
          <span className="block font-semibold">World music and sounds</span>
          <span className="block text-sm text-muted">Pauses while an episode plays.</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={ambienceOn}
          onChange={(e) => useStore.getState().setAmbienceOn(e.target.checked)}
          className="size-5 accent-ink"
        />
      </label>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            respawn(world);
            onClose();
          }}
          className="rounded-full bg-ink px-5 py-2.5 font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          I’m stuck <span className="font-mono text-sm opacity-70">(R)</span>
        </button>
        {confirmReset ? (
          <div className="flex flex-col gap-2 rounded-[12px] border border-rule p-3">
            <p className="text-sm">Forget which buildings you have found?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  useStore.getState().resetProgress();
                  clearSavedPosition();
                  setConfirmReset(false);
                }}
                className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-coal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Yes, reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-full border border-ink px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="rounded-full border border-ink px-5 py-2.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Reset progress
          </button>
        )}
      </div>
    </div>
  );
}

export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="flex size-11 items-center justify-center rounded-full bg-cream text-lg font-semibold hover:bg-rule focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span aria-hidden="true">×</span>
    </button>
  );
}
