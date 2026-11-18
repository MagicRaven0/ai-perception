"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { ExploreData } from "@/lib/three/explore-data";
import { findBuilding, isEraId } from "@/lib/three/layout";
import { requestTeleport } from "@/lib/three/transient";

/**
 * Keeps /explore's URL and the world in step (rendered inside <Suspense>, as useSearchParams requires):
 * - ?b=<building-id>: drive the car to that building and open its drawer (shareable deep link);
 * - ?era=era-2: go to that island's spawn (NavLinks sends it), then drop it from the URL;
 * - opening / closing a drawer writes / removes ?b= with history.replaceState (no navigation).
 * Sibling of the canvas, so its re-renders never touch the 3D tree.
 */
export function UrlSync({ data, ready }: { data: ExploreData; ready: boolean }) {
  const params = useSearchParams();
  const b = params.get("b");
  const era = params.get("era");

  // URL -> world (on first ready frame, and whenever the params change later).
  useEffect(() => {
    if (!ready) return;
    const s = useStore.getState();
    if (b && b !== s.openBuildingId) {
      const placed = findBuilding(data.world, b);
      if (placed) {
        requestTeleport(placed.approach);
        s.setActiveEra(placed.eraId);
        s.openBuilding(b);
      }
    } else if (!b && isEraId(era)) {
      // The param is removed right below, so this only runs for an explicit link to an island.
      requestTeleport(data.world.islands[era].spawn);
      s.setActiveEra(era);
    }
    if (era) {
      const url = new URL(window.location.href);
      url.searchParams.delete("era");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  }, [b, era, ready, data.world]);

  // World -> URL: mirror the open drawer as ?b=.
  useEffect(() => {
    return useStore.subscribe((s, prev) => {
      if (s.openBuildingId === prev.openBuildingId) return;
      // Leaving /explore closes the drawer; never rewrite the URL of the page we are going to.
      if (window.location.pathname !== "/explore") return;
      const url = new URL(window.location.href);
      if (s.openBuildingId) url.searchParams.set("b", s.openBuildingId);
      else url.searchParams.delete("b");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    });
  }, []);

  return null;
}
