"use client";

import { useId, useState } from "react";

/**
 * "How do you feel about AI?" The visitor's answer stays in this browser tab only: nothing is stored or sent.
 * A comparison with poll results appears once a verified dataset is passed in.
 */
export function SentimentSlider({ comparison }: { comparison?: { label: string; value: number; note: string } }) {
  const [value, setValue] = useState(50);
  const [moved, setMoved] = useState(false);
  const id = useId();

  const feeling =
    value < 20
      ? "Mostly afraid"
      : value < 40
        ? "Uneasy"
        : value <= 60
          ? "Mixed"
          : value <= 80
            ? "Hopeful"
            : "Mostly excited";

  return (
    <div className="flex flex-col gap-6 rounded-[4px] border border-ink bg-paper p-6 md:p-10">
      <label htmlFor={id} className="font-display text-3xl font-medium tracking-headline md:text-4xl">
        How do you feel about AI?
      </label>
      <div>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => {
            setValue(Number(e.target.value));
            setMoved(true);
          }}
          aria-valuetext={feeling}
          className="w-full accent-orange"
        />
        <div className="mt-2 flex justify-between text-sm text-muted">
          <span>Afraid</span>
          <span>Excited</span>
        </div>
      </div>
      <p className="text-xl" aria-live="polite">
        {moved ? (
          <>
            You: <strong>{feeling}</strong>
          </>
        ) : (
          <span className="text-muted">Move the slider to answer.</span>
        )}
      </p>
      {moved &&
        (comparison ? (
          <p className="text-lg">
            {comparison.label}: <strong>{comparison.value}%</strong>.{" "}
            <span className="text-muted">{comparison.note}</span>
          </p>
        ) : (
          <p className="text-muted">
            The comparison with real poll results appears once the group adds the survey data.
          </p>
        ))}
      <p className="text-xs text-muted">Your answer stays on your device. Nothing is saved or sent.</p>
    </div>
  );
}
