import type { Site } from "@/lib/content/schema";

/**
 * Site-wide copy. Edit this file to change the title, thesis, team or AI disclosure everywhere.
 * Anything starting with "TODO:" is a placeholder; run `npm run check-content` to list them all.
 *
 * Thesis and AI disclosure drafted 22 Nov 2026 (CONTENT_PROMPTS Prompt 2) from the group's three research essays
 * (Rayyan: correcting AI; Abdulrahman Ahmad: AI's potential; Waleed Masri: out of control or badly trained).
 * Team roles describe each essay; edit freely. Names confirmed 22 Nov 2026. The group should approve all of it.
 */
export const site: Site = {
  title: "The Evolution of AI Perception",
  shortTitle: "AI Perception",
  course: "WRI-101",
  university: "American University of Sharjah",
  thesis:
    "Across seventy years, the way people have seen AI has followed how much control they felt they had over it: in the 1950s it was a bold promise held by a few scientists, from the Macintosh to Siri friendly interfaces made computers feel like tools anyone could direct, and now that AI agents act on their own, trust depends on whether people can still understand, check and correct them.",
  team: [
    { name: "Rayyan", role: "Research essay: why the ability to correct AI matters more than its intelligence; site build" },
    { name: "Abdulrahman Ahmad", role: "Research essay: AI's potential and the gap between experts and the public" },
    { name: "Waleed Masri", role: "Research essay: whether AI is out of control or badly trained" },
  ],
  aiDisclosure:
    "We used AI openly in this project, and our professor encouraged it. Claude Code (Anthropic) wrote the website's code from a plan we reviewed. Claude (Anthropic) helped turn our three research essays and their sources into the site's text and suggested extra historical sources for the 1950s and the Jobs era, which we opened and read ourselves before keeping them. The chatbot and the three summary buttons use a language model that may only answer from our own research notes, and it says so when something is not in them. Every summary is read and corrected by our group before it is published and carries an \"AI-generated, checked by our group\" label. We checked every fact, number and quote on the site against the source it cites.",
};
