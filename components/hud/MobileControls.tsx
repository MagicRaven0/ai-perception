"use client";

import { useEffect, type KeyboardEvent } from "react";
import { Joystick, useJoystickStore } from "ecctrl/input";
import { input } from "@/lib/three/transient";

/**
 * Touch controls (PLAN 6.5), shown on coarse pointers only: ecctrl's DOM joystick bottom-left and a real
 * hold-to-Boost button bottom-right, both placed above the audio mini-bar and the chat button.
 * The interact button is the prompt's own "Tap to open / Tap to talk" (InteractPrompt), which appears only when
 * there is something to open; on touch layouts the prompt sits ABOVE this row (the joystick reaches 214px from
 * the bottom, Boost 192px; the prompt starts at 14.5rem = 232px), so neither ever covers it. The joystick store is read outside React and copied into the transient
 * `input` (no re-renders). Keyboard users have the same actions on keys (see the Controls panel).
 */
export function MobileControls() {
  useEffect(() => {
    const unsub = useJoystickStore.subscribe((s) => {
      const j = s.joysticks.default;
      input.joyX = j?.x ?? 0;
      input.joyY = j?.y ?? 0;
    });
    return () => {
      unsub();
      input.joyX = input.joyY = 0;
      input.boost = false;
    };
  }, []);

  const hold = (down: boolean) => () => {
    input.boost = down;
  };
  // Keyboard (e.g. a switch device or a tablet keyboard): Enter / Space held = boost.
  const key = (down: boolean) => (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    input.boost = down;
  };
  const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

  return (
    <div className="hidden [@media(pointer:coarse)]:block">
      <div aria-hidden="true" data-touch-joystick="">
        <Joystick
          joystickWrapperStyle={{
            left: "max(0.5rem, env(safe-area-inset-left))",
            bottom: "4rem",
            zIndex: "var(--z-hud)",
            width: "150px",
            height: "150px",
          }}
          joystickBaseStyle={{
            width: "104px",
            height: "104px",
            background: "color-mix(in srgb, var(--color-paper) 55%, transparent)",
            border: "2px solid var(--color-paper)",
            boxShadow: "var(--shadow-pill)",
          }}
          joystickKnobStyle={{ width: "52px", height: "52px", background: "var(--color-paper)" }}
        />
      </div>
      <div className="fixed right-4 bottom-[8.5rem] z-hud">
        <button
          type="button"
          onPointerDown={hold(true)}
          onPointerUp={hold(false)}
          onPointerCancel={hold(false)}
          onPointerLeave={hold(false)}
          onKeyDown={key(true)}
          onKeyUp={key(false)}
          onBlur={hold(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex size-14 touch-none items-center justify-center rounded-full bg-paper text-sm font-semibold text-ink shadow-pill-strong select-none ${focusRing}`}
        >
          Boost
        </button>
      </div>
    </div>
  );
}
