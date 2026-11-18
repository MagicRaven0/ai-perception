import type { Metadata } from "next";
import { buildExploreData } from "@/lib/content/explore";
import { ExploreClient } from "@/components/explore/ExploreClient";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Drive between three islands (The Past, The Jobs Era, The Future) and open buildings to discover how public perception of AI changed.",
};

/**
 * Server component: loads content and computes the world layout (no coordinates live in content files),
 * then hands serialisable props to the client shell, which runs the capability gate before any 3D code
 * downloads. URL params (?era=, ?b=) are read client-side, so this page stays fully prerendered.
 */
export default function ExplorePage() {
  return <ExploreClient data={buildExploreData()} />;
}
