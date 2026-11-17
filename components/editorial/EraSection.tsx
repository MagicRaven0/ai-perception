import type { Building, Era, Insight } from "@/lib/content/schema";
import {
  buildingsForEra,
  datasetsForEra,
  episodesForEra,
  eras,
  getEpisode,
  getSource,
  insightsForEra,
} from "@/lib/content";
import { BUILDING_LABEL, INSIGHT_LABEL, eraYears } from "@/lib/content/labels";
import { isPlaceholder } from "@/lib/content/placeholder";
import { toTrack } from "@/lib/audio/track";
import { ContentText } from "@/components/content/ContentText";
import { Markdown } from "@/components/content/Markdown";
import { DataBand } from "@/components/data/DataBand";
import { PlayButton } from "@/components/audio/PlayButton";
import { YouTubeEmbed } from "./YouTubeEmbed";

/** One era of the long-read (PLAN.md 7.3): header, essay, people, buildings, insights, data, listening. */
export function EraSection({ era, headingLevel = 2 }: { era: Era; headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  const buildings = buildingsForEra(era.id);
  const insights = insightsForEra(era.id);
  const datasets = datasetsForEra(era.id);
  const episodes = episodesForEra(era.id);

  return (
    <section id={era.slug} data-era={era.id} aria-labelledby={`${era.slug}-title`} className="scroll-mt-4">
      {/* 1. Era header on the era colour */}
      <header style={{ background: era.palette.base, color: era.palette.ink }}>
        <div className="mx-auto max-w-[1280px] px-6 pt-16 pb-12 md:px-12 md:pt-24 md:pb-16">
          <p
            className="font-display text-6xl leading-none font-medium tracking-headline md:text-9xl"
            aria-hidden="true"
          >
            {eraYears(era)}
          </p>
          <H
            id={`${era.slug}-title`}
            className="mt-6 max-w-4xl text-3xl leading-tight font-medium tracking-headline md:text-5xl"
          >
            <span className="sr-only">{eraYears(era)}: </span>
            {era.islandName}
            <span className="block text-xl font-normal md:text-2xl">
              <ContentText value={era.title} />
            </span>
          </H>
          <p className="mt-6 flex flex-wrap gap-x-2 text-lg">
            {era.anchorFigures.map((f, i) => (
              <span key={f.name}>
                {i > 0 && <span aria-hidden="true">· </span>}
                {f.name}
              </span>
            ))}
          </p>
        </div>
      </header>

      {/* 2. Editorial block */}
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 md:grid-cols-12 md:px-12 md:py-20">
        <div className="flex flex-col gap-5 text-lg leading-[1.6] text-muted md:col-span-7">
          <Markdown value={era.perceptionSummary} />
        </div>
        <aside className="md:col-span-4 md:col-start-9">
          <h3 className="border-b border-ink pb-2 font-semibold">How this era supports our argument</h3>
          <div className="mt-4 flex flex-col gap-4 leading-relaxed text-muted">
            <Markdown value={era.thesisLink} />
          </div>
        </aside>
      </div>

      {/* 3. People table (LCA "counterparts" rows) */}
      <div className="mx-auto max-w-[1280px] px-6 pb-16 md:px-12">
        <PeopleTable era={era} />
      </div>

      {/* 4. Buildings, in island order */}
      <div className="mx-auto max-w-[1280px] px-6 pb-16 md:px-12">
        <h3 className="mb-6 font-display text-3xl font-medium tracking-headline md:text-4xl">On this island</h3>
        <div className="border-t border-ink">
          {buildings.map((b) => (
            <BuildingRow key={b.id} building={b} insights={insights.filter((i) => i.buildingId === b.id)} />
          ))}
        </div>
      </div>

      {/* 5. Free-standing insight markers */}
      <InsightGrid insights={insights.filter((i) => !i.buildingId)} />

      {/* 6. Data band */}
      <DataBand datasets={datasets} heading={`${era.islandName} in numbers`} />

      {/* 7. Listen strip */}
      {episodes.length > 0 && (
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12">
          <h3 className="mb-6 font-display text-3xl font-medium tracking-headline md:text-4xl">Listen</h3>
          <ul className="border-t border-ink">
            {episodes.map((e) => {
              const track = toTrack(e, eras);
              return (
                <li key={e.id} className="grid gap-3 border-b border-rule py-5 md:grid-cols-12 md:items-center">
                  <span className="text-muted md:col-span-3">{e.kind === "interview" ? "Interview" : "Podcast"}</span>
                  <span className="text-lg font-medium md:col-span-6">
                    <ContentText value={e.title} />
                  </span>
                  <span className="md:col-span-3 md:text-right">
                    {track ? <PlayButton track={track} /> : <span className="text-muted">Recording coming soon</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function PeopleTable({ era }: { era: Era }) {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">Key people in {era.islandName}</caption>
      <thead>
        <tr className="border-b border-ink">
          <th scope="col" className="mono-label w-1/4 py-3 pr-4 font-normal">
            Figure
          </th>
          <th scope="col" className="mono-label w-1/4 py-3 pr-4 font-normal">
            Role
          </th>
          <th scope="col" className="mono-label hidden py-3 font-normal md:table-cell">
            What they expected
          </th>
        </tr>
      </thead>
      <tbody>
        {era.anchorFigures.map((f) => (
          <tr key={f.name} className="border-b border-ink align-top">
            <th scope="row" className="py-4 pr-4 text-lg font-medium">
              {f.name}
            </th>
            <td className="py-4 pr-4 text-muted">
              <ContentText value={f.role} />
              {f.view && (
                <span className="mt-2 block md:hidden">
                  <ContentText value={f.view} />
                </span>
              )}
            </td>
            <td className="hidden py-4 text-muted md:table-cell">{f.view && <ContentText value={f.view} />}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BuildingRow({ building: b, insights }: { building: Building; insights: Insight[] }) {
  const comingSoon = isPlaceholder(b.long);
  const episode = b.media.episodeId ? getEpisode(b.media.episodeId) : undefined;
  const track = episode ? toTrack(episode, eras) : null;
  const sources = b.sourceIds.map(getSource).filter((s) => s !== undefined);

  return (
    <article id={b.id} className="grid scroll-mt-4 gap-4 border-b border-ink py-8 md:grid-cols-12 md:gap-8">
      <p className="text-muted md:col-span-3">{BUILDING_LABEL[b.kind]}</p>
      <div className="flex flex-col gap-4 md:col-span-8">
        <h4 className="text-2xl leading-snug font-medium tracking-headline md:text-[1.75rem]">
          <ContentText value={b.title} />
        </h4>
        {comingSoon ? (
          <p className="text-muted">Coming soon. This part of the story is still being written.</p>
        ) : (
          <div className="flex max-w-[68ch] flex-col gap-4 text-lg leading-[1.6] text-muted">
            <Markdown value={b.long} />
          </div>
        )}

        {b.media.youtubeId && <YouTubeEmbed id={b.media.youtubeId} title={b.title} />}
        {b.media.documentUrl && (
          <a
            href={b.media.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            Open the document
          </a>
        )}
        {track && <PlayButton track={track} startAt={b.media.startAt} />}

        {insights.length > 0 && (
          <ul className="flex flex-col gap-2">
            {insights.map((i) => (
              <InsightChip key={i.id} insight={i} />
            ))}
          </ul>
        )}

        {(sources.length > 0 || b.groupCommentary) && (
          <p className="font-mono text-xs leading-relaxed text-muted">
            {b.groupCommentary && sources.length === 0
              ? "Group commentary"
              : sources.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && "; "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {s.apa}
                    </a>
                  </span>
                ))}
          </p>
        )}
      </div>
    </article>
  );
}

const INSIGHT_STYLE = {
  benefit: "border-benefit",
  risk: "border-risk",
  danger: "border-danger",
} as const;

const INSIGHT_DOT = {
  benefit: "bg-benefit",
  risk: "bg-risk",
  danger: "bg-danger",
} as const;

function InsightChip({ insight: i }: { insight: Insight }) {
  return (
    <li className={`flex items-start gap-3 border-l-4 bg-cream py-2 pr-3 pl-3 ${INSIGHT_STYLE[i.kind]}`}>
      <span className="shrink-0 font-semibold">{INSIGHT_LABEL[i.kind]}</span>
      <span className="text-muted">
        <ContentText value={i.text} />
      </span>
    </li>
  );
}

function InsightGrid({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-16 md:px-12">
      <h3 className="mb-6 font-display text-3xl font-medium tracking-headline md:text-4xl">
        Benefits, risks and dangers
      </h3>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((i) => (
          <li key={i.id} className="flex flex-col gap-3 rounded-[4px] border border-ink bg-paper p-5">
            <span className="flex items-center gap-2 font-semibold">
              <span className={`size-3 rounded-full ${INSIGHT_DOT[i.kind]}`} aria-hidden="true" />
              {INSIGHT_LABEL[i.kind]}
            </span>
            <span className="text-lg leading-snug">
              <ContentText value={i.text} />
            </span>
            <span className="mt-auto font-mono text-xs text-muted">
              {i.groupCommentary && i.sourceIds.length === 0 ? "Group commentary" : `${i.sourceIds.length} source(s)`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
