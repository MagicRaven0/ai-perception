"use client";

import { useEffect } from "react";
import type { EraId } from "@/lib/content/schema";
import { useStore } from "@/lib/store";

/**
 * Watches every element with data-era="era-N" and sets activeEra to the one occupying the reading line,
 * so switching to 3D lands you on the same island (PLAN.md 5.2, rule 6).
 */
export function EraObserver() {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-era]")];
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) useStore.getState().setActiveEra(e.target.getAttribute("data-era") as EraId);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return null;
}
