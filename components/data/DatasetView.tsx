import type { Dataset } from "@/lib/content/schema";
import { ContentText } from "@/components/content/ContentText";
import { datasetContext } from "@/lib/content/format";
import { ChartFigure } from "./ChartFigure";
import { StatCard } from "./StatCard";
import type { SourceRef } from "./SourceLine";

/**
 * One dataset as the right view: hatched "Data coming" (placeholder), a big stat, or a chart with its table twin
 * and source line. Client-safe (no server imports), so the era data band, the 3D drawer and the 2D building
 * section all draw a dataset the same way. Colours are for a dark surface: put it on bg-night (see EmbeddedChart).
 */
export function DatasetView({ dataset: d, source }: { dataset: Dataset; source?: SourceRef }) {
  if (d.status === "placeholder") return <DataComing title={d.title} />;
  if (d.chartType === "stat") {
    const y = d.series[0]?.points[0]?.y ?? 0;
    return <StatCard value={y} unit={d.unit} label={d.title} context={statContext(d)} source={source} />;
  }
  return <ChartFigure dataset={d} source={source} />;
}

/**
 * A dataset inside a building (content `media.datasetId`): the chart on its own dark card, so the chart's
 * snow-on-night colours keep their contrast on the paper drawer and the 2D page in both themes.
 */
export function EmbeddedChart({ dataset, source }: { dataset: Dataset; source?: SourceRef }) {
  return (
    <div data-embedded-chart={dataset.id} className="rounded-[12px] bg-night p-5 text-snow md:p-6">
      <DatasetView dataset={dataset} source={source} />
    </div>
  );
}

function statContext(d: Dataset): string {
  const c = datasetContext(d.questionWording);
  const lead = c.kind === "note" ? `Note: ${c.text}` : `Question: “${c.text}”`;
  return `${lead} ${d.population}${d.sampleSize ? `, n = ${d.sampleSize.toLocaleString()}` : ""}, ${d.fieldDates}.`;
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
      <p className="mt-3 max-w-2xl text-xl text-snow">
        <ContentText value={title} />
      </p>
      <p className="mt-2 text-sm text-chart-text">
        This chart appears once the survey numbers and their source are added. We never show placeholder numbers.
      </p>
    </div>
  );
}
