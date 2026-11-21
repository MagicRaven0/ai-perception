"use client";

import { useId, useState } from "react";
import type { Dataset } from "@/lib/content/schema";
import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { DataTable } from "./DataTable";
import { SourceLine, type SourceRef } from "./SourceLine";
import { datasetContext } from "@/lib/content/format";

/** A chart with its honest context: question wording, who was asked, a table twin and the source. */
export function ChartFigure({ dataset, source }: { dataset: Dataset; source?: SourceRef }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const tableId = useId();
  const context = datasetContext(dataset.questionWording);

  return (
    <figure className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption className="max-w-2xl">
          <span className="block text-xl font-medium text-snow md:text-2xl">{dataset.title}</span>
          <span className="mt-1 block text-sm text-chart-text">
            {context.kind === "note" ? (
              <>
                <span className="font-semibold text-snow">Note:</span> {context.text}
              </>
            ) : (
              <>
                <span className="font-semibold text-snow">Question:</span> “{context.text}”
              </>
            )}
          </span>
          <span className="mt-1 block text-sm text-chart-text">
            {dataset.population}
            {dataset.sampleSize ? ` · n = ${dataset.sampleSize.toLocaleString()}` : ""} · {dataset.fieldDates}
          </span>
        </figcaption>
        <button
          type="button"
          onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
          aria-controls={tableId}
          aria-pressed={view === "table"}
          className="rounded-full border border-chart-text/40 px-4 py-1.5 text-sm font-semibold text-snow transition-colors hover:bg-snow/10"
        >
          {view === "chart" ? "Show table" : "Show chart"}
        </button>
      </div>

      <div id={tableId}>
        {view === "table" ? (
          <DataTable dataset={dataset} />
        ) : dataset.chartType === "line" ? (
          <LineChart dataset={dataset} />
        ) : (
          <BarChart dataset={dataset} />
        )}
      </div>

      <SourceLine source={source} />
    </figure>
  );
}
