import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Read" };

export default function ReadPage() {
  return (
    <ComingSoon
      title="Read"
      phase="Phase 1"
      body="The full long-read: all three eras in order, with sources, charts and audio."
    />
  );
}
