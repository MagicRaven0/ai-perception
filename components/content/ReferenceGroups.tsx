import type { ReactNode } from "react";
import type { Source } from "@/lib/content/schema";
import { groupByOrigin } from "@/lib/content/reference-groups";
import { ReferenceList, type ReferenceItem } from "./ReferenceList";

/** A reference list split into "From our essays" first, then "Added for the history". Items already sorted. */
export function ReferenceGroups({
  items,
  heading: H,
  anchors,
  size,
  extra,
}: {
  items: (ReferenceItem & { origin?: Source["origin"] })[];
  heading: "h2" | "h3" | "h4";
  anchors?: boolean;
  size?: "base" | "sm";
  extra?: (item: ReferenceItem) => ReactNode;
}) {
  return (
    <div className={`flex flex-col ${size === "sm" ? "gap-6" : "gap-12"}`}>
      {groupByOrigin(items).map((g) => (
        <section key={g.title} data-reference-group={g.title}>
          <H className={`mb-3 font-medium ${size === "sm" ? "text-lg" : "text-2xl"}`}>{g.title}</H>
          <ReferenceList items={g.items} anchors={anchors} size={size} extra={extra} />
        </section>
      ))}
    </div>
  );
}
