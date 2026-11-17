import type { Metadata } from "next";
import { episodes, eras } from "@/lib/content";
import { toTrack } from "@/lib/audio/track";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { EpisodeList } from "@/components/audio/EpisodeList";

export const metadata: Metadata = { title: "Listen" };

export default function ListenPage() {
  const items = episodes.map((e) => ({
    id: e.id,
    title: e.title,
    summary: e.summary,
    kind: e.kind,
    eraIds: e.eraIds,
    track: toTrack(e, eras),
  }));

  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main id="main" className="mx-auto w-full max-w-[1280px] px-6 pt-14 pb-16 md:px-12 md:pt-20">
        <h1 className="font-display text-5xl font-medium tracking-headline md:text-7xl">Listen</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Our podcast episodes and interviews. Audio keeps playing while you read or explore the 3D world.
        </p>
        <EpisodeList items={items} eras={eras.map((e) => ({ id: e.id, name: e.islandName }))} />
      </main>
      <Footer />
    </div>
  );
}
