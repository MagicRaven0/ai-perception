import type { Site } from "@/lib/content/schema";

/**
 * Site-wide copy. Edit this file to change the title, thesis, team or AI disclosure everywhere.
 * Anything starting with "TODO:" is a placeholder; run `npm run check-content` to list them all.
 */
export const site: Site = {
  title: "The Evolution of AI Perception",
  shortTitle: "AI Perception",
  course: "WRI-101",
  university: "American University of Sharjah",
  thesis: "TODO: the group's thesis sentence (one sentence that ties the three eras together)",
  team: [
    { name: "TODO: team member 1 name", role: "TODO: role" },
    { name: "TODO: team member 2 name", role: "TODO: role" },
    { name: "TODO: team member 3 name", role: "TODO: role" },
  ],
  aiDisclosure:
    "TODO: AI disclosure paragraph (which AI tools were used, for what, and how the group checked the output)",
};
