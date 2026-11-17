import type { z } from "zod";
import type { Dataset } from "@/lib/content/schema";

/**
 * Survey and statistics data. Charts are drawn from these, with a table version and a source line.
 *
 * Keep status: "placeholder" until real numbers and a source exist: the site then shows a hatched
 * "Data coming" box and never invents numbers. Switch to "verified" once filled in.
 *
 * chartType: "bar" (compare groups), "line" (change over time), "stat" (one big number).
 * Example verified series: [{ label: "2023", points: [{ x: "Excited", y: 10 }, { x: "Concerned", y: 52 }] }]
 */
export const datasets: z.input<typeof Dataset>[] = [
  {
    id: "public-trust-vs-fear",
    eraId: "era-3",
    title: "TODO: chart title (e.g. Are people more excited or more concerned about AI?)",
    questionWording: "TODO: exact survey question",
    population: "TODO: who was asked (e.g. U.S. adults)",
    sampleSize: null,
    fieldDates: "TODO: when the survey ran",
    unit: "%",
    chartType: "bar",
    series: [],
    status: "placeholder",
  },
  {
    id: "ai-adoption-headline",
    eraId: "era-3",
    title: "TODO: headline statistic (e.g. share of people who have used a chatbot)",
    questionWording: "TODO: exact survey question",
    population: "TODO: who was asked",
    sampleSize: null,
    fieldDates: "TODO: when the survey ran",
    unit: "%",
    chartType: "stat",
    series: [],
    status: "placeholder",
  },
];
