"use client";

import { useStore } from "@/lib/store";
import type { ExploreEra } from "@/lib/three/explore-data";
import type { WorldLayout } from "@/lib/three/layout";
import { fastTravel } from "./actions";

/** Three white island pills (Late Checkout nav style). Fade, teleport to the island's spawn, fade back. */
export function FastTravelBar({
  world,
  eras,
  fade,
}: {
  world: WorldLayout;
  eras: ExploreEra[];
  fade: React.RefObject<HTMLDivElement | null>;
}) {
  const active = useStore((s) => s.activeEra);
  return (
    <nav aria-label="Fast travel">
      <ul className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-pill">
        {eras.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              aria-current={active === e.id ? "location" : undefined}
              onClick={() => fastTravel(world, e.id, fade.current)}
              className={`block rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:px-4 md:text-base ${
                active === e.id ? "bg-ink text-paper" : "text-ink hover:bg-cream"
              }`}
            >
              {e.islandName}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
