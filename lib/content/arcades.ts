import "server-only";
import { datasets, getSource } from "@/lib/content";
import type { SourceRef } from "@/components/data/SourceLine";

/**
 * The two "experience" buildings that are interactive (docs/NOTES_FROM_PROJECT_CLAUDE.md, round 2 note 2).
 * Each config is plain, serialisable data for the client components in components/arcade/, used by the 3D
 * drawer, the 2D era section and the 2D read page.
 *
 * The numbers come from content: the prediction year and the answer are the ones in the building's text
 * (content/buildings.ts `predictions-arcade`, citing Simon & Newell, 1958, p. 7 and IBM, n.d.); the poll
 * results are read from content/datasets.ts at build time, never typed here.
 */

export type PredictionsArcadeConfig = {
  kind: "predictions";
  /** Year of the prediction and how many years it allowed ("within ten years"). */
  predictedIn: number;
  withinYears: number;
  /** The year a computer first beat a reigning world chess champion in a match. */
  answerYear: number;
  answerText: string;
  sources: SourceRef[];
};

export type FeelingsChoice = { label: string; us: number | null; global: number | null };

export type FeelingsArcadeConfig = {
  kind: "feelings";
  /** The three answers in slider order (concerned → equally → excited), with the poll results for each. */
  choices: FeelingsChoice[];
  usLabel: string;
  globalLabel: string;
  sources: SourceRef[];
};

export type ArcadeConfig = PredictionsArcadeConfig | FeelingsArcadeConfig;

const ref = (id: string): SourceRef[] => {
  const s = getSource(id);
  return s ? [{ apa: s.apa, url: s.url }] : [];
};

const CHOICES = ["More concerned than excited", "Equally concerned and excited", "More excited than concerned"];

function feelings(): FeelingsArcadeConfig | null {
  const us = datasets.find((d) => d.id === "public-trust-vs-fear" && d.status === "verified");
  const global = datasets.find((d) => d.id === "global-concern" && d.status === "verified");
  if (!us && !global) return null;
  // U.S.: the latest point of each series. Global: one series, one point per answer.
  const usValue = (label: string) => {
    const s = us?.series.find((x) => x.label === label);
    return s?.points.length ? s.points[s.points.length - 1].y : null;
  };
  const usYear = us?.series[0]?.points.at(-1)?.x;
  const globalValue = (label: string) => global?.series[0]?.points.find((p) => String(p.x) === label)?.y ?? null;
  return {
    kind: "feelings",
    choices: CHOICES.map((label) => ({ label, us: usValue(label), global: globalValue(label) })),
    usLabel: `U.S. adults${usYear ? `, ${usYear}` : ""}`,
    globalLabel: `Median of 25 countries${global?.fieldDates ? `, ${global.fieldDates}` : ""}`,
    sources: [...(us?.sourceId ? ref(us.sourceId) : []), ...(global?.sourceId ? ref(global.sourceId) : [])],
  };
}

export function arcadeFor(buildingId: string): ArcadeConfig | null {
  if (buildingId === "predictions-arcade") {
    return {
      kind: "predictions",
      predictedIn: 1958,
      withinYears: 10,
      answerYear: 1997,
      answerText:
        "In May 1997, IBM's Deep Blue beat Garry Kasparov, the first computer to defeat a reigning world chess champion under standard tournament conditions.",
      sources: [...ref("simon-newell-1958"), ...ref("ibm-nd")],
    };
  }
  if (buildingId === "feelings-arcade") return feelings();
  return null;
}
