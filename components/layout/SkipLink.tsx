"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EraId } from "@/lib/content/schema";
import { useStore } from "@/lib/store";

/** Stable id: /explore moves focus here when the 3D world replaces the button that had it. */
export const SKIP_LINK_ID = "skip-link";

/**
 * First focusable element on every page. On /explore it is "Go to reading mode" (PLAN 6.7), pointing at
 * the island you are on; everywhere else it skips to the main content.
 */
export function SkipLink({ eraSlugs }: { eraSlugs: Record<EraId, string> }) {
  const pathname = usePathname();
  const era = useStore((s) => s.activeEra);
  const explore = pathname === "/explore";
  // Shown on keyboard focus only (focus-visible): /explore also focuses it from script after a tap or click on
  // "Explore in 3D", and then it must not sit over the HUD's Home button.
  const className =
    "sr-only z-skip rounded-full bg-paper px-4 py-2 font-semibold text-ink focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:px-4 focus-visible:py-2 focus-visible:shadow-pill";
  // Client-side navigation on /explore, so an episode playing in the audio dock keeps playing.
  if (explore) {
    return (
      <Link id={SKIP_LINK_ID} href={`/read/${eraSlugs[era]}`} className={className}>
        Go to reading mode
      </Link>
    );
  }
  return (
    <a id={SKIP_LINK_ID} href="#main" className={className}>
      Skip to content
    </a>
  );
}
