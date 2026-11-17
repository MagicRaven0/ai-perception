"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/** Runs in <head> before paint so there is no flash of the wrong theme. Keep in sync with readTheme(). */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})()`;

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Round light/dark switch, same shape as the logo button. Remembers the choice in this browser only. */
export function ThemeToggle() {
  // Follows data-theme on <html>; null during server render (the icon appears after hydration).
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);

  const toggle = () => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === null ? undefined : dark}
      className="flex size-10 shrink-0 items-center md:size-12 justify-center rounded-full bg-paper shadow-[0_6px_20px_rgb(18_18_17/0.08)] transition-transform duration-300 ease-calm hover:-translate-y-0.5"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        {dark ? (
          <path d="M14.5 12.8A6.5 6.5 0 0 1 7.2 5.5a6.5 6.5 0 1 0 7.3 7.3Z" fill="currentColor" />
        ) : (
          <g fill="currentColor">
            <circle cx="10" cy="10" r="3.6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <rect key={a} x="9.3" y="1.5" width="1.4" height="3" rx="0.7" transform={`rotate(${a} 10 10)`} />
            ))}
          </g>
        )}
      </svg>
    </button>
  );
}
