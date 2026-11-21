"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useDialog } from "./useDialog";
import { CloseButton } from "./OptionsPanel";

const TABS = [
  {
    id: "keyboard",
    label: "Keyboard",
    rows: [
      ["W A S D or arrow keys", "Drive and steer"],
      ["Shift", "Boost"],
      ["Space", "Brake"],
      ["E", "Open a building / talk to the guide"],
      ["R", "I’m stuck: back to this island’s start"],
      ["V", "Driver’s view on / off (drag to look around)"],
      ["T", "Time of day: golden hour, sunset, night"],
      ["Drive off a runway", "Take off as the era’s plane: W / S climb and dive, A / D turn"],
      ["L", "Land (back to a car on the nearest runway)"],
      ["Q / Z, or drag (left or right button)", "Turn the view all the way around (360°); drag up / down to tilt"],
      ["Mouse wheel", "Zoom in, or out to the whole island"],
      ["Shift + drag, or middle-drag", "Pan to look anywhere on the island"],
      ["C, or the Recenter button", "Back to the view behind the car (driving also eases back)"],
      ["⋯ button (top)", "Show or hide the extra buttons"],
      ["Click a spot on the island", "The car drives there by itself (any key takes over)"],
      ["Esc", "Close a panel"],
      ["Tab", "Move between buttons (the world never traps focus)"],
    ],
  },
  {
    id: "touch",
    label: "Touch",
    rows: [
      ["Arrow buttons (bottom left)", "Hold ▲ to drive, ▼ to brake or reverse, ◀ ▶ to steer"],
      ["Tap a spot on the island", "The car drives there by itself"],
      ["Boost (bottom right)", "Hold to go faster"],
      ["Tap to open / Tap to talk (on the prompt)", "Open a building / talk to the guide"],
      ["Island buttons (top)", "Fast travel between islands"],
      ["Drag on the world", "Turn the view all the way around (360°); drag up / down to tilt"],
      ["Two fingers", "Drag to pan, pinch to zoom, twist to turn"],
      ["Recenter button (top)", "Back to the view behind the car"],
      ["Eye button (top)", "Driver’s view on / off"],
      ["Sun / moon button (top)", "Time of day: golden hour, sunset, night"],
      ["Drive off a runway", "Fly: ▲ climb, ▼ dive, ◀ ▶ turn; Land button to come down"],
      ["⋯ button (top)", "Show or hide the extra buttons"],
    ],
  },
] as const;

/** Controls help (PLAN 7.5) with keyboard / touch tabs (ARIA tabs, arrow keys move between them). */
export function ControlsPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useDialog(ref, true, onClose);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(() =>
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? "touch" : "keyboard",
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next]!.id);
    tabRefs.current[next]?.focus();
  };

  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="controls-title"
      onKeyDown={onKeyDown}
      className="fixed top-20 left-4 z-modal flex max-h-[calc(100dvh-10rem)] w-[min(24rem,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto rounded-[20px] bg-paper p-5 text-ink shadow-panel"
    >
      <div className="flex items-center justify-between">
        <h2 id="controls-title" className="font-display text-2xl font-medium tracking-headline">
          Controls
        </h2>
        <CloseButton onClose={onClose} />
      </div>
      <div role="tablist" aria-label="Control type" className="flex gap-1 rounded-full bg-cream p-1">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`controls-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`controls-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
            className={`flex-1 rounded-full px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              tab === t.id ? "bg-ink text-paper" : ""
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Both panels stay in the DOM (the inactive one hidden), so every tab's aria-controls resolves. */}
      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`controls-panel-${t.id}`}
          aria-labelledby={`controls-tab-${t.id}`}
          hidden={t.id !== current.id}
        >
          <table className="w-full text-left">
            <thead>
              <tr>
                <th scope="col" className="mono-label pb-2 font-normal text-muted">
                  Input
                </th>
                <th scope="col" className="mono-label pb-2 font-normal text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map(([key, action]) => (
                <tr key={key} className="border-t border-rule">
                  <td className="py-2 pr-3 font-semibold">{key}</td>
                  <td className="py-2 text-muted">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
