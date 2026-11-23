"use client";

import { useState } from "react";
import { detectCapabilities } from "@/lib/three/capabilities";

/** Shown once per visit when the browser draws 3D with the CPU: the visitor can fix that in one browser setting. */
export function SoftwareNotice() {
  const [open, setOpen] = useState(() => detectCapabilities().softwareGl);
  if (!open) return null;
  return (
    <div
      role="status"
      data-software-notice=""
      className="flex max-w-xs items-start gap-3 rounded-[16px] bg-paper py-3 pr-2 pl-4 text-sm text-ink shadow-panel"
    >
      <p>
        <strong className="block">Running slowly?</strong>
        Your browser is drawing this world without the graphics card. In its settings, search for “graphics
        acceleration”, turn it on and restart the browser.
      </p>
      <button
        type="button"
        aria-label="Close this tip"
        onClick={() => setOpen(false)}
        className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-cream focus-visible:outline-2 focus-visible:outline-ink"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
