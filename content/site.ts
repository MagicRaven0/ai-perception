import type { Site } from "@/lib/content/schema";

/**
 * Site-wide copy. Edit this file to change the title, thesis, team everywhere.
 * Anything starting with "TODO:" is a placeholder; run `npm run check-content` to list them all.
 *
 * Thesis drafted 22 Nov 2026 (CONTENT_PROMPTS Prompt 2) from the group's three research essays
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
    { name: "Rayyan", role: "Research essay: why the ability to correct AI matters more than its intelligence; site build", statue: "stop-button" },
    { name: "Abdulrahman Ahmad", role: "Research essay: AI's potential and the gap between experts and the public", statue: "light-bulb" },
    { name: "Waleed Masri", role: "Research essay: whether AI is out of control or badly trained", statue: "robot" },
  ],
};
