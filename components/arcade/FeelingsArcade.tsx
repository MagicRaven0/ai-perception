"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FeelingsArcadeConfig } from "@/lib/content/arcades";
import { InTextCite } from "@/components/content/InTextCite";

/**
 * "How do you feel about AI?": a three-step slider for the visitor's own feeling, then their answer next to the
 * Pew results. The answer lives only in this component's state: nothing is stored, logged or sent.
 */
export function FeelingsArcade({ config }: { config: FeelingsArcadeConfig }) {
  const [choice, setChoice] = useState(1);
  const [compared, setCompared] = useState(false);
  const id = useId();
  // "Compare" disappears once pressed: focus moves to the result instead of falling back to the page.
  const result = useRef<HTMLParagraphElement>(null);
  const acted = useRef(false);
  useEffect(() => {
    if (compared && acted.current) result.current?.focus();
  }, [compared]);
  const short = ["More concerned", "Equally both", "More excited"];

  return (
    <div
      data-arcade="feelings"
      className="flex flex-col gap-5 rounded-[12px] border border-ink bg-paper p-5 text-ink md:p-6"
    >
      <label htmlFor={id} className="text-lg leading-snug font-medium">
        Does the increased use of AI in daily life make you feel more concerned than excited, more excited than
        concerned, or both equally?
      </label>
      <div>
        <input
          id={id}
          type="range"
          min={0}
          max={config.choices.length - 1}
          step={1}
          value={choice}
          onChange={(e) => {
            setChoice(Number(e.target.value));
            setCompared(false);
          }}
          aria-valuetext={config.choices[choice].label}
          className="w-full accent-orange"
        />
        <div className="mt-1 grid grid-cols-3 text-sm text-muted">
          {short.map((s, i) => (
            <span
              key={s}
              className={`${i === 0 ? "text-left" : i === 2 ? "text-right" : "text-center"} ${i === choice ? "font-semibold text-ink" : ""}`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {!compared && (
        <button
          type="button"
          onClick={() => {
            acted.current = true;
            setCompared(true);
          }}
          className="self-start rounded-full bg-ink px-5 py-2.5 font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Compare with the polls
        </button>
      )}

      <div aria-live="polite">
        {compared && (
          <div className="flex flex-col gap-4">
            <p ref={result} tabIndex={-1} className="text-lg focus:outline-none">
              You: <strong className="font-semibold">{config.choices[choice].label}</strong>. Here is how people
              answered in the polls <InTextCite sources={config.sources} />.
            </p>
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Your answer compared with poll results</caption>
              <thead>
                <tr className="border-b border-ink">
                  <th scope="col" className="mono-label py-2 pr-3 font-normal">
                    Answer
                  </th>
                  <th scope="col" className="mono-label py-2 pr-3 text-right font-normal">
                    {config.usLabel}
                  </th>
                  <th scope="col" className="mono-label py-2 text-right font-normal">
                    {config.globalLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                {config.choices.map((c, i) => (
                  <tr key={c.label} className={`border-b border-rule ${i === choice ? "bg-cream font-semibold" : ""}`}>
                    <th scope="row" className="py-2 pr-3 font-[inherit]">
                      {c.label}
                      {i === choice && <span className="ml-2 font-normal text-muted">(you)</span>}
                    </th>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.us === null ? "–" : `${c.us}%`}</td>
                    <td className="py-2 text-right tabular-nums">{c.global === null ? "–" : `${c.global}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted">Your answer stays on this page. Nothing is saved or sent.</p>
    </div>
  );
}
