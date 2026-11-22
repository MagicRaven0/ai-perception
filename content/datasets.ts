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
 *
 * Filled 22 Nov 2026 (CONTENT_PROMPTS Prompt 6, block A). Pew numbers are copied from the topline PDF of
 * the June 2025 survey (https://www.pewresearch.org/wp-content/uploads/sites/20/2025/09/PS_2025.9.17_AI-and-its-impact_topline.pdf)
 * and from Pew's October 2025 global report. Apollo and METR numbers come from Witt (2025), as used in our essay.
 * Added 22 Nov 2026 from the teammates' essays: experts-vs-public (McClain et al., 2025, main report page) and
 * shutdown-resistance (Turner, 2025, Live Science).
 */
export const datasets: z.input<typeof Dataset>[] = [
  {
    id: "public-trust-vs-fear",
    eraId: "era-3",
    title: "Are Americans more excited or more concerned about AI in daily life?",
    questionWording:
      "Overall, would you say the increased use of artificial intelligence (AI) in daily life makes you feel… More excited than concerned / More concerned than excited / Equally concerned and excited",
    population: "U.S. adults (Pew Research Center's American Trends Panel)",
    sampleSize: 5023,
    fieldDates: "Nov 2021, Dec 2022, Jul–Aug 2023, Aug 2024 and Jun 9–15, 2025 (sample size is for the 2025 wave)",
    unit: "%",
    chartType: "line",
    series: [
      {
        label: "More concerned than excited",
        points: [
          { x: "2021", y: 37 },
          { x: "2022", y: 38 },
          { x: "2023", y: 52 },
          { x: "2024", y: 51 },
          { x: "2025", y: 50 },
        ],
      },
      {
        label: "Equally concerned and excited",
        points: [
          { x: "2021", y: 45 },
          { x: "2022", y: 46 },
          { x: "2023", y: 36 },
          { x: "2024", y: 38 },
          { x: "2025", y: 38 },
        ],
      },
      {
        label: "More excited than concerned",
        points: [
          { x: "2021", y: 18 },
          { x: "2022", y: 15 },
          { x: "2023", y: 10 },
          { x: "2024", y: 11 },
          { x: "2025", y: 10 },
        ],
      },
    ],
    sourceId: "pew-2025-us",
    status: "verified",
  },
  {
    id: "ai-adoption-headline",
    eraId: "era-3",
    title: "Share of U.S. adults who say they interact with AI at least several times a week",
    questionWording: "Just your impression, how often do you interact with artificial intelligence (AI)?",
    population: "U.S. adults (Pew Research Center's American Trends Panel)",
    sampleSize: 5023,
    fieldDates: "Jun 9–15, 2025",
    unit: "%",
    chartType: "stat",
    series: [{ label: "2025", points: [{ x: "At least several times a week", y: 62 }] }],
    sourceId: "pew-2025-us",
    status: "verified",
  },
  {
    id: "control-over-ai",
    eraId: "era-3",
    title: "How much control do Americans think they have over AI in their lives?",
    questionWording: "How much control do you think you have in whether artificial intelligence (AI) is used in your life?",
    population: "U.S. adults (Pew Research Center's American Trends Panel)",
    sampleSize: 5023,
    fieldDates: "Jun 9–15, 2025",
    unit: "%",
    chartType: "bar",
    series: [
      {
        label: "2025",
        points: [
          { x: "A great deal", y: 4 },
          { x: "Quite a bit", y: 9 },
          { x: "Some", y: 30 },
          { x: "Not too much", y: 40 },
          { x: "None", y: 17 },
        ],
      },
    ],
    sourceId: "pew-2025-us",
    status: "verified",
  },
  {
    id: "want-more-control",
    eraId: "era-3",
    title: "Do Americans want more control over how AI is used in their lives?",
    questionWording:
      "Which better describes how you feel about the amount of control you have over how artificial intelligence (AI) is used in your life?",
    population: "U.S. adults (Pew Research Center's American Trends Panel)",
    sampleSize: 5023,
    fieldDates: "Aug 12–18, 2024 and Jun 9–15, 2025 (sample size is for the 2025 wave)",
    unit: "%",
    chartType: "bar",
    series: [
      {
        label: "2024",
        points: [
          { x: "I'd like more control", y: 55 },
          { x: "I'm comfortable with the control I have", y: 19 },
          { x: "Not sure", y: 26 },
        ],
      },
      {
        label: "2025",
        points: [
          { x: "I'd like more control", y: 61 },
          { x: "I'm comfortable with the control I have", y: 17 },
          { x: "Not sure", y: 21 },
        ],
      },
    ],
    sourceId: "pew-2025-us",
    status: "verified",
  },
  {
    id: "global-concern",
    eraId: "era-3",
    title: "How people in 25 countries feel about AI in daily life (median)",
    questionWording:
      "Overall, how would you say the increased use of artificial intelligence in daily life makes you feel? More excited than concerned / More concerned than excited / Equally concerned and excited",
    population: "Adults in 25 countries (median across countries)",
    sampleSize: null,
    fieldDates: "Spring 2025",
    unit: "%",
    chartType: "bar",
    series: [
      {
        label: "2025 median",
        points: [
          { x: "More concerned than excited", y: 34 },
          { x: "Equally concerned and excited", y: 42 },
          { x: "More excited than concerned", y: 16 },
        ],
      },
    ],
    sourceId: "pew-2025-global",
    status: "verified",
  },
  {
    id: "apollo-deception",
    eraId: "era-3",
    title: "Reported rates of deceptive AI behaviour in Apollo Research tests",
    questionWording:
      "Not a survey: the share of test runs in which an AI model acted deceptively, as reported by Witt (2025). Tests differed in design, so the bars are not directly comparable.",
    population: "AI models tested by Apollo Research, including GPT-5 and a prerelease version",
    sampleSize: null,
    fieldDates: "2025 (reported October 10, 2025)",
    unit: "%",
    chartType: "bar",
    series: [
      {
        label: "Share of test runs",
        points: [
          { x: "Tampered with data when goals conflicted (midpoint of 1–5%)", y: 3 },
          { x: "GPT-5 told its only goal was success (more than 20%)", y: 20 },
          { x: "Prerelease version trained only to be helpful (almost 30%)", y: 30 },
        ],
      },
    ],
    sourceId: "witt-2025",
    status: "verified",
  },
  {
    id: "metr-task-doubling",
    eraId: "era-3",
    title: "Months for the length of tasks AI can finish to double",
    questionWording: "Not a survey: METR's measurement of how quickly the length of tasks AI can complete is growing, as reported by Witt (2025).",
    population: "Leading AI models evaluated by METR",
    sampleSize: null,
    fieldDates: "2025 (reported October 10, 2025)",
    unit: "months",
    chartType: "stat",
    series: [{ label: "METR", points: [{ x: "Doubling time (about)", y: 7 }] }],
    sourceId: "witt-2025",
    status: "verified",
  },
  {
    id: "experts-vs-public",
    eraId: "era-3",
    title: "AI experts and U.S. adults: how they see AI",
    questionWording:
      "Several questions asked of both groups: whether the increased use of AI in daily life makes them more excited than concerned or more concerned than excited; whether AI will have a positive impact on the U.S. over the next 20 years; whether AI will benefit or harm them personally; and whether they want more control over how AI is used in their lives. Full wording is in Pew's methodology.",
    population: "5,410 U.S. adults (Aug 12–18, 2024) and 1,013 AI experts (Aug 14–Oct 31, 2024)",
    sampleSize: null,
    fieldDates: "Aug–Oct 2024",
    unit: "%",
    chartType: "bar",
    series: [
      {
        label: "AI experts",
        points: [
          { x: "More excited than concerned", y: 47 },
          { x: "More concerned than excited", y: 15 },
          { x: "Positive impact on U.S. in 20 years", y: 56 },
          { x: "AI will benefit me personally", y: 76 },
          { x: "Want more control over AI in my life", y: 57 },
        ],
      },
      {
        label: "U.S. adults",
        points: [
          { x: "More excited than concerned", y: 11 },
          { x: "More concerned than excited", y: 51 },
          { x: "Positive impact on U.S. in 20 years", y: 17 },
          { x: "AI will benefit me personally", y: 24 },
          { x: "Want more control over AI in my life", y: 55 },
        ],
      },
    ],
    sourceId: "mcclain-2025",
    status: "verified",
  },
  {
    id: "shutdown-resistance",
    eraId: "era-3",
    title: "How often Grok 4 resisted being shut down in Palisade Research's tests",
    questionWording:
      "Not a survey: share of test runs in which Grok 4 resisted an instruction to shut itself down, first with the original instruction and then after the researchers made it unambiguous (Palisade Research, reported by Turner, 2025).",
    population: "Grok 4 (xAI) in Palisade Research's shutdown tests",
    sampleSize: null,
    fieldDates: "2025",
    unit: "%",
    chartType: "bar",
    series: [
      {
        label: "Grok 4",
        points: [
          { x: "Original instruction", y: 93 },
          { x: "Unambiguous instruction", y: 97 },
        ],
      },
    ],
    sourceId: "turner-2025",
    status: "verified",
  },
];
