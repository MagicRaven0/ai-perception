import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { episodes, eras, getEpisode, getTranscript } from "@/lib/content";
import { isPlaceholder } from "@/lib/content/placeholder";
import { toTrack } from "@/lib/audio/track";
import { formatTime } from "@/lib/audio/vtt";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { ContentText } from "@/components/content/ContentText";
import { PlayButton } from "@/components/audio/PlayButton";
import { ChapterList } from "@/components/audio/ChapterList";
import { TranscriptView } from "@/components/audio/TranscriptView";

export function generateStaticParams() {
  return episodes.map((e) => ({ episode: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/listen/[episode]">): Promise<Metadata> {
  const ep = getEpisode((await params).episode);
  if (!ep) return {};
  return { title: isPlaceholder(ep.title) ? "Episode" : ep.title };
}

export default function EpisodePage({ params }: PageProps<"/listen/[episode]">) {
  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main id="main" className="mx-auto w-full max-w-[1280px] px-6 pt-14 pb-16 md:px-12 md:pt-20">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <EpisodeContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

async function EpisodeContent({ params }: { params: PageProps<"/listen/[episode]">["params"] }) {
  const episode = getEpisode((await params).episode);
  if (!episode) notFound();

  const track = toTrack(episode, eras);
  const cues = getTranscript(episode.transcript);
  const eraNames = episode.eraIds.map((id) => eras.find((e) => e.id === id)?.islandName).filter(Boolean);

  return (
    <>
      <Link href="/listen" className="text-sm font-semibold text-muted hover:text-ink">
        ← All episodes
      </Link>
      <h1 className="mt-6 max-w-4xl font-display text-4xl leading-tight font-medium tracking-headline md:text-6xl">
        <ContentText value={episode.title} />
      </h1>
      <p className="mt-3 text-muted">
        {episode.kind === "interview" ? "Interview" : "Podcast"} · {eraNames.join(", ")}
        {episode.durationSec ? ` · ${formatTime(episode.durationSec)}` : ""}
      </p>
      <p className="mt-6 max-w-3xl text-xl leading-snug">
        <ContentText value={episode.summary} />
      </p>
      <div className="mt-8">
        {track ? (
          <PlayButton track={track} />
        ) : (
          <p className="text-muted">
            {episode.src && episode.kind === "interview"
              ? "This interview will be published once every speaker has given written consent."
              : "Recording coming soon."}
          </p>
        )}
      </div>

      <div className="mt-14 grid gap-12 md:grid-cols-12">
        <section aria-labelledby="speakers" className="md:col-span-4">
          <h2 id="speakers" className="mono-label border-b border-ink pb-2">
            Speakers
          </h2>
          <ul>
            {episode.speakers.map((s, i) => (
              <li key={i} className="border-b border-rule py-3">
                <span className="font-medium">
                  <ContentText value={s.name} />
                </span>
                <span className="block text-muted">
                  <ContentText value={s.role} />
                </span>
              </li>
            ))}
          </ul>
          {track && episode.chapters.length > 0 && (
            <>
              <h2 className="mono-label mt-10 border-b border-ink pb-2">Chapters</h2>
              <ChapterList chapters={episode.chapters} track={track} />
            </>
          )}
        </section>

        <section aria-labelledby="transcript" className="md:col-span-8">
          <h2 id="transcript" className="mb-4 text-2xl font-medium">
            Transcript
          </h2>
          {track ? (
            <TranscriptView cues={cues} track={track} />
          ) : cues.length > 0 ? (
            <ol className="border-t border-ink">
              {cues.map((c, i) => (
                <li key={i} className="grid grid-cols-[4rem_1fr] gap-4 border-b border-rule py-3">
                  <span className="font-mono text-xs leading-7 text-muted">{formatTime(c.start)}</span>
                  <span className="text-lg leading-relaxed">
                    {c.speaker && <span className="font-semibold">{c.speaker}: </span>}
                    {c.text}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted">The transcript appears here once it is added.</p>
          )}
        </section>
      </div>
    </>
  );
}
