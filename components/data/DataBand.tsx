import type { Dataset } from "@/lib/content/schema";
import { sourceRef } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { DatasetView } from "./DatasetView";

/** Ceros-style dark band holding an era's statistics. Placeholder data never shows fake numbers. */
export function DataBand({ datasets, heading }: { datasets: Dataset[]; heading: string }) {
  if (datasets.length === 0) return null;

  return (
    <section aria-label={heading} className="bg-night text-snow">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-6 py-16 md:px-12 md:py-24">
        <h3 className="font-display text-3xl font-medium tracking-headline md:text-5xl">{heading}</h3>
        {datasets.map((d) => {
          const view = <DatasetView key={d.id} dataset={d} source={sourceRef(d.sourceId)} />;
          return d.status === "placeholder" ? view : <Reveal key={d.id}>{view}</Reveal>;
        })}
      </div>
    </section>
  );
}
