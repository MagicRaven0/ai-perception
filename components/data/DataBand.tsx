import type { Dataset } from "@/lib/content/schema";
import { getSource } from "@/lib/content";
import { ContentText } from "@/components/content/ContentText";
import { Reveal } from "@/components/ui/Reveal";
import { ChartFigure } from "./ChartFigure";
import { StatCard } from "./StatCard";

/** Ceros-style dark band holding an era's statistics. Placeholder data never shows fake numbers. */
export function DataBand({ datasets, heading }: { datasets: Dataset[]; heading: string }) {
  if (datasets.length === 0) return null;

  return (
    <section aria-label={heading} className="bg-night text-paper">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-6 py-16 md:px-12 md:py-24">
        <h3 className="font-display text-3xl font-medium tracking-headline md:text-5xl">{heading}</h3>
        {datasets.map((d) => {
          const src = d.sourceId ? getSource(d.sourceId) : undefined;
          const source = src ? { apa: src.apa, url: src.url } : undefined;

          if (d.status === "placeholder") return <DataComing key={d.id} title={d.title} />;

          if (d.chartType === "stat") {
            const y = d.series[0]?.points[0]?.y ?? 0;
            return (
              <Reveal key={d.id}>
                <StatCard value={y} unit={d.unit} label={d.title} source={source} />
              </Reveal>
            );
          }
          return (
            <Reveal key={d.id}>
              <ChartFigure dataset={d} source={source} />
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function DataComing({ title }: { title: string }) {
  return (
    <div
      className="rounded-[4px] border border-dashed border-chart-text/50 p-8"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent 0 10px, color-mix(in srgb, var(--color-chart-text) 12%, transparent) 10px 11px)",
      }}
    >
      <p className="mono-label text-chart-text">Data coming</p>
      <p className="mt-3 max-w-2xl text-xl text-paper">
        <ContentText value={title} />
      </p>
      <p className="mt-2 text-sm text-chart-text">
        This chart appears once the survey numbers and their source are added. We never show placeholder numbers.
      </p>
    </div>
  );
}
