"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PredictionsArcadeConfig } from "@/lib/content/arcades";
import { InTextCite } from "@/components/content/InTextCite";

/**
 * "Guess the year": the visitor picks the year a computer first beat the world chess champion, then sees the
 * answer next to the 1958 prediction. Native range input + button, so it works with keyboard only.
 */
export function PredictionsArcade({ config }: { config: PredictionsArcadeConfig }) {
  const { predictedIn, withinYears, answerYear } = config;
  const promised = predictedIn + withinYears;
  const min = predictedIn;
  const max = answerYear + 20;
  const [guess, setGuess] = useState(promised);
  const [revealed, setRevealed] = useState(false);
  const id = useId();
  // The button that was pressed disappears, so focus moves to what replaced it (result, or the slider again).
  const result = useRef<HTMLParagraphElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const acted = useRef(false);
  useEffect(() => {
    if (!acted.current) return;
    (revealed ? result.current : slider.current)?.focus();
  }, [revealed]);
  const setRevealedFocus = (v: boolean) => {
    acted.current = true;
    setRevealed(v);
  };

  const off = Math.abs(guess - answerYear);
  const verdict =
    off === 0
      ? "Exactly right."
      : `You were ${off} year${off === 1 ? "" : "s"} ${guess < answerYear ? "early" : "late"}.`;

  return (
    <div
      data-arcade="predictions"
      className="flex flex-col gap-5 rounded-[12px] border border-ink bg-paper p-5 text-ink md:p-6"
    >
      <label htmlFor={id} className="text-lg leading-snug font-medium">
        In {predictedIn}, researchers predicted a computer chess champion within {withinYears} years. In what year did a
        computer first beat the reigning world champion?
      </label>
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">Your guess</span>
          <output htmlFor={id} className="font-display text-4xl font-medium tabular-nums tracking-headline">
            {guess}
          </output>
        </div>
        <input
          ref={slider}
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={guess}
          disabled={revealed}
          onChange={(e) => setGuess(Number(e.target.value))}
          aria-valuetext={String(guess)}
          className="mt-2 w-full accent-orange disabled:opacity-60"
        />
        <div className="mt-1 flex justify-between text-sm text-muted">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealedFocus(true)}
          className="self-start rounded-full bg-ink px-5 py-2.5 font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Check my guess
        </button>
      ) : null}

      <div aria-live="polite">
        {revealed && (
          <div className="flex flex-col gap-3">
            <p ref={result} tabIndex={-1} className="text-lg focus:outline-none">
              The answer is <strong className="font-semibold">{answerYear}</strong>. {verdict}
            </p>
            <Timeline
              predictedIn={predictedIn}
              promised={promised}
              answerYear={answerYear}
              guess={guess}
              min={min}
              max={max}
            />
            <p className="text-muted">
              {config.answerText} The prediction allowed {withinYears} years; it took {answerYear - predictedIn}{" "}
              <InTextCite sources={config.sources} />.
            </p>
            <button
              type="button"
              onClick={() => setRevealedFocus(false)}
              className="self-start rounded-full border border-ink px-5 py-2.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** A small year line: prediction, promised year, the visitor's guess and the real answer (legend below). */
function Timeline(p: {
  predictedIn: number;
  promised: number;
  answerYear: number;
  guess: number;
  min: number;
  max: number;
}) {
  const at = (y: number) => `${((y - p.min) / (p.max - p.min)) * 100}%`;
  const marks = [
    { y: p.predictedIn, label: "Predicted", cls: "bg-muted" },
    { y: p.promised, label: "Promised", cls: "border-2 border-muted bg-paper" },
    { y: p.guess, label: "Your guess", cls: "bg-orange" },
    { y: p.answerYear, label: "Real", cls: "bg-ink" },
  ];
  return (
    <div aria-hidden="true">
      <div className="relative mx-1.5 my-3 h-1 rounded-full bg-rule">
        {marks.map((m) => (
          <span
            key={m.label}
            className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${m.cls}`}
            style={{ left: at(m.y) }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {marks.map((m) => (
          <li key={m.label} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${m.cls}`} />
            {m.label} {m.y}
          </li>
        ))}
      </ul>
    </div>
  );
}
