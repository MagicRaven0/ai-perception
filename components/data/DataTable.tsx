import type { Dataset } from "@/lib/content/schema";

/** Accessible twin of every chart: the same numbers as a table. */
export function DataTable({ dataset }: { dataset: Dataset }) {
  const xs = [...new Set(dataset.series.flatMap((s) => s.points.map((p) => String(p.x))))];
  const value = (label: string, x: string) =>
    dataset.series.find((s) => s.label === label)?.points.find((p) => String(p.x) === x)?.y;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-paper">
        <caption className="sr-only">{dataset.title}</caption>
        <thead>
          <tr className="border-b border-paper">
            <th scope="col" className="mono-label py-2 pr-4 font-normal text-chart-text">
              {dataset.chartType === "line" ? "Year" : "Answer"}
            </th>
            {dataset.series.map((s) => (
              <th key={s.label} scope="col" className="mono-label py-2 pr-4 text-right font-normal text-chart-text">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xs.map((x) => (
            <tr key={x} className="border-b border-chart-grid">
              <th scope="row" className="py-2 pr-4 font-normal">
                {x}
              </th>
              {dataset.series.map((s) => {
                const v = value(s.label, x);
                return (
                  <td key={s.label} className="py-2 pr-4 text-right tabular-nums">
                    {v === undefined ? "–" : `${v}${dataset.unit}`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
