import type { z } from "zod";
import type { About } from "@/lib/content/schema";

/**
 * About page: the rhetorical situation of this adaptation (Handout 12.1 headings).
 * Rewritten 22 Nov 2026 (CONTENT_PROMPTS Prompt 2) to match the draft thesis in content/site.ts.
 * The group should read it and put it into its own words where needed.
 */
export const about: z.input<typeof About> = {
  rhetoricalSituation: [
    {
      element: "Author",
      answer:
        "A group of three WRI-101 students at the American University of Sharjah, adapting our three research essays: Rayyan's on why the ability to correct AI matters more than its intelligence, Abdulrahman Ahmad's on AI's potential, and Waleed Masri's on whether AI is out of control or badly trained. We are not AI experts, so our credibility comes from cited sources and a recorded interview with a local expert.",
    },
    {
      element: "Audience",
      answer:
        "Our classmates and professor first, on phones and laptops in class, and then curious visitors on the web. Most of them use AI tools every day but know little about where AI came from or how the debate about its risks developed. They want something they can explore quickly, and they need enough background to follow the argument without having read our essay.",
    },
    {
      element: "Purpose",
      answer:
        "To show that the way people have seen AI has followed how much control they felt they had over it, from a promise held by a few scientists in the 1950s, to friendly tools anyone could direct in the Jobs era, to agents that act on their own today. Our three essays show today's split view: AI's real potential, the risk of systems people cannot correct, and the evidence that misbehaviour comes from how AI is trained, which means it can be fixed. We want visitors to leave asking a new question of any AI system: not only what it can do, but whether people can still check and correct it.",
    },
    {
      element: "Context",
      answer:
        "Late 2026, when AI tools are part of daily life and experts still disagree about how dangerous they are. The site is first viewed in a classroom, often on phones over shared Wi-Fi, by students who are themselves deciding how much to trust AI.",
    },
    {
      element: "Genre",
      answer:
        "A hybrid adaptation of three research essays: an explorable 3D world of three islands, an editorial long-read version of the same content, a data story, podcast episodes with transcripts, and a chatbot that answers only from our research.",
    },
    {
      element: "Content and form",
      answer:
        "Each era has its own island, colours and car, so the visitor feels the change of period before reading about it. Short texts in the 3D world link to the full paragraphs in the reading view, every claim carries an APA citation, and numbers appear as charts with their sources underneath. Our shared argument about control shapes the design: the visitor drives and chooses where to go.",
    },
  ],
  genreRationale:
    "Most of the site's content comes from our three research essays: all of the present-day island, a \"then and now\" building on each older island, and the podcast's final episode. Extra sources fill in the 1950s and the Jobs era, which our essays do not cover. Our argument is that people's view of AI has followed how much control they felt they had over it, so a format that lets visitors feel that control works better than a static essay. On the first island AI is something you can only look at: large old machines and bold predictions you read about. On the second island the computer becomes a friendly tool you operate yourself. On the third island visitors use real AI through the chatbot and the summaries, and see labels telling them how far to trust it, which puts them in the same position as today's public. The long-read version keeps every paragraph and citation for readers who prefer text, and the podcast and interview add voices that a written essay cannot.",
};
