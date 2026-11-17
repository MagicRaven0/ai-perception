import type { Era } from "@/lib/content/schema";

/**
 * The three eras = the three islands in 3D = the three chapters in 2D.
 * Years and summaries are placeholders until the group confirms them from the essay.
 */
export const eras: Era[] = [
  {
    id: "era-1",
    slug: "the-past",
    number: 1,
    islandName: "The Past",
    title: "TODO: era 1 title (e.g. Origins and academic optimism)",
    years: { start: 1950, end: 1959 },
    anchorFigures: [{ name: "John McCarthy", role: "TODO: role, from the essay" }],
    perceptionSummary: "TODO: 2-3 paragraphs from the essay on how AI was perceived in this era",
    thesisLink: "TODO: one paragraph on how this era supports the thesis",
    palette: { base: "#e8d9b0", accent: "#3bd16f" },
  },
  {
    id: "era-2",
    slug: "the-jobs-era",
    number: 2,
    islandName: "The Jobs Era",
    title: "TODO: era 2 title (e.g. Personal computing and the interface)",
    years: { start: 1984, end: 2011 },
    anchorFigures: [{ name: "Steve Jobs", role: "TODO: role, from the essay" }],
    perceptionSummary: "TODO: 2-3 paragraphs from the essay on how AI was perceived in this era",
    thesisLink: "TODO: one paragraph on how this era supports the thesis",
    palette: { base: "#d8d2c4", accent: "#ff87a2" },
  },
  {
    id: "era-3",
    slug: "the-future",
    number: 3,
    islandName: "The Future",
    title: "TODO: era 3 title (e.g. Generative AI, public opinion and hard data)",
    years: { start: 2020, end: "present" },
    anchorFigures: [
      { name: "Yoshua Bengio", role: "TODO: role, from public sources" },
      { name: "Professor Aqeel", role: "TODO: role at American University of Sharjah" },
    ],
    perceptionSummary: "TODO: 2-3 paragraphs from the essay on how AI is perceived now",
    thesisLink: "TODO: one paragraph on how this era supports the thesis",
    palette: { base: "#141414", accent: "#d5ff95" },
  },
];

export function getEra(id: Era["id"]): Era {
  const era = eras.find((e) => e.id === id);
  if (!era) throw new Error(`Unknown era ${id}`);
  return era;
}
