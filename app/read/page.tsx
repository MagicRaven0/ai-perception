import type { Metadata } from "next";
import Link from "next/link";
import { comparisons, eras, getSource, site } from "@/lib/content";
import { eraYears } from "@/lib/content/labels";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { ContentText } from "@/components/content/ContentText";
import { EraSection } from "@/components/editorial/EraSection";
import { EraObserver } from "@/components/editorial/EraObserver";
import { ComparisonSlider } from "@/components/data/ComparisonSlider";

export const metadata: Metadata = {
  title: "Read",
  description:
    "The full long-read: how public perception of AI changed across three eras, with sources, data and audio.",
};

export default function ReadPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopNav />

      <main id="main">
        {/* Intro */}
        <div className="mx-auto max-w-[1280px] px-6 pt-14 pb-16 md:px-12 md:pt-20">
          <h1 className="max-w-4xl font-display text-5xl leading-[1.02] font-medium tracking-headline md:text-7xl">
            {site.title}
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-snug md:text-2xl">
            <ContentText value={site.thesis} />
          </p>
          <nav aria-label="Eras" className="mt-12 border-t border-ink">
            <ol className="grid md:grid-cols-3">
              {eras.map((era) => (
                <li key={era.id} className="border-b border-ink md:border-r md:border-b-0 md:last:border-r-0">
                  <Link href={`#${era.slug}`} className="group flex items-baseline gap-4 py-4 md:px-4 md:first:pl-0">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: era.palette.accent }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold group-hover:underline">{era.islandName}</span>
                    <span className="text-muted">{eraYears(era)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {eras.map((era) => (
          <EraSection key={era.id} era={era} />
        ))}

        {/* After the last era: then vs now, and the visitor's own view */}
        <section aria-labelledby="then-and-now" className="bg-cream">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-12 px-6 py-16 md:px-12 md:py-24">
            <h2 id="then-and-now" className="font-display text-4xl font-medium tracking-headline md:text-6xl">
              Then and now
            </h2>
            {comparisons.map((c) => {
              const ls = c.left.sourceId ? getSource(c.left.sourceId) : undefined;
              const rs = c.right.sourceId ? getSource(c.right.sourceId) : undefined;
              return (
                <ComparisonSlider
                  key={c.id}
                  left={{ ...c.left, source: ls && { apa: ls.apa, url: ls.url } }}
                  right={{ ...c.right, source: rs && { apa: rs.apa, url: rs.url } }}
                  takeaway={c.takeaway}
                />
              );
            })}
          </div>
        </section>

        <div className="mx-auto flex max-w-[1280px] flex-wrap gap-3 px-6 py-16 md:px-12">
          <Link href="/sources" className="rounded-full border border-ink bg-paper px-6 py-3 font-semibold">
            Works cited
          </Link>
          <Link href="/about" className="rounded-full border border-ink bg-paper px-6 py-3 font-semibold">
            About this project
          </Link>
          <Link href="/listen" className="rounded-full border border-ink bg-paper px-6 py-3 font-semibold">
            All episodes
          </Link>
        </div>
      </main>

      <Footer />
      <EraObserver />
    </div>
  );
}
