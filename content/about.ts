import type { z } from "zod";
import type { About } from "@/lib/content/schema";

/**
 * About page: the rhetorical situation of this adaptation (Handout 12.1 headings).
 * Drafted from the project plan; the group should edit it into its own words.
 */
export const about: z.input<typeof About> = {
  rhetoricalSituation: [
    {
      element: "Author",
      answer:
        "A group of three WRI-101 students at the American University of Sharjah. Our credibility comes from cited sources, a recorded expert interview, and clear labels on everything AI produced.",
    },
    {
      element: "Audience",
      answer:
        "Classmates and our professor first, on phones and laptops in class; then curious web visitors. Most use AI tools every day but know little of their history.",
    },
    {
      element: "Purpose",
      answer: "TODO: purpose, written to match the final thesis",
    },
    {
      element: "Context",
      answer:
        "Late 2026: AI is everywhere and trust in it is divided. The site is first viewed in a classroom, often on phones over shared Wi-Fi.",
    },
    {
      element: "Genre",
      answer:
        "A hybrid: an explorable 3D world, an editorial long-read, a data story and a podcast, adapted from our research essay.",
    },
    {
      element: "Content and form",
      answer:
        "Each era has its own island, colours and materials. Short texts in the 3D world link to full paragraphs here in the reading view, and numbers appear as charts with their sources under them.",
    },
  ],
  genreRationale:
    "The topic is how people's perception of AI changed, so the site makes visitors perceive AI in three ways as they read about it: as a distant idea on the first island, as a friendly interface on the second, and as a tool they use themselves on the third, through the chatbot and summaries, each labelled with how far to trust it.",
};
