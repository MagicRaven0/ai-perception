import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <ComingSoon
      title="Explore"
      phase="Phase 3"
      body="Drive between three islands (The Past, The Jobs Era, The Future) and open buildings to discover the story."
    />
  );
}
