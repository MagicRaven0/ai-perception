import type { z } from "zod";
import type { Source } from "@/lib/content/schema";

/**
 * Works cited (APA 7). Every fact on the site points to one of these by id.
 * url must be a working link (the class requires clickable works cited).
 *
 * Filled 22 Nov 2026 (CONTENT_PROMPTS Prompt 1). Groups:
 * - Rayyan's research essay: witt-2025, bengio-2025, krueger-2026.
 * - Abdulrahman Ahmad's essay: witt-2026, hastings-khan-2026, mims-2026, mcclain-2025.
 * - Waleed Masri's essay: bengio-2025, booth-2026, turner-2025.
 * - Our previous group project (AI and employment): casselman-2026, johansson-2026, tenev-2025.
 * - New sources for eras 1 and 2 (the essay has none for the 1950s or 1984–2011):
 *   mccarthy-1955, dartmouth-nd, simon-newell-1958, williams-2024, steve-jobs-archive-2024,
 *   popova-2011, ibm-nd, apple-2011. Keep only if the professor allows sources beyond the essay.
 * - New polls for era 3 (Prompt 6): pew-2025-us, pew-2025-global.
 * - Placeholder: aqeel-interview (until the interview is recorded).
 */
export const sources: z.input<typeof Source>[] = [
  // ---- Era 1: the 1950s ----
  {
    id: "mccarthy-1955",
    apa: "McCarthy, J., Minsky, M. L., Rochester, N., & Shannon, C. E. (1955). A proposal for the Dartmouth summer research project on artificial intelligence. Stanford University. http://jmc.stanford.edu/articles/dartmouth/dartmouth.pdf",
    url: "http://jmc.stanford.edu/articles/dartmouth/dartmouth.pdf",
    eraIds: ["era-1"],
    type: "report",
  },
  {
    id: "dartmouth-nd",
    apa: "Dartmouth College. (n.d.). Artificial intelligence (AI) coined at Dartmouth. Retrieved November 22, 2026, from https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth",
    url: "https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth",
    eraIds: ["era-1"],
    type: "website",
  },
  {
    id: "simon-newell-1958",
    apa: "Simon, H. A., & Newell, A. (1958). Heuristic problem solving: The next advance in operations research. Operations Research, 6(1), 1–10. https://doi.org/10.1287/opre.6.1.1",
    url: "https://doi.org/10.1287/opre.6.1.1",
    eraIds: ["era-1", "era-2"],
    type: "journal",
  },
  {
    id: "williams-2024",
    apa: "Williams, D. (2024, February 29). We've been here before: AI promised humanlike machines – in 1958. The Conversation. https://theconversation.com/weve-been-here-before-ai-promised-humanlike-machines-in-1958-222700",
    url: "https://theconversation.com/weve-been-here-before-ai-promised-humanlike-machines-in-1958-222700",
    eraIds: ["era-1", "era-2"],
    type: "article",
  },

  // ---- Era 2: 1984–2011 ----
  {
    id: "steve-jobs-archive-2024",
    apa: "Steve Jobs Archive. (2024, January 24). 40 years of the Macintosh. https://stevejobsarchive.com/stories/40-years-of-macintosh",
    url: "https://stevejobsarchive.com/stories/40-years-of-macintosh",
    eraIds: ["era-2"],
    type: "website",
  },
  {
    id: "popova-2011",
    apa: "Popova, M. (2011, December 21). Steve Jobs on why computers are like a bicycle for the mind (1990). The Marginalian. https://www.themarginalian.org/2011/12/21/steve-jobs-bicycle-for-the-mind-1990/",
    url: "https://www.themarginalian.org/2011/12/21/steve-jobs-bicycle-for-the-mind-1990/",
    eraIds: ["era-2"],
    type: "article",
  },
  {
    id: "ibm-nd",
    apa: "IBM. (n.d.). Deep Blue. IBM Heritage. Retrieved November 22, 2026, from https://www.ibm.com/history/deep-blue",
    url: "https://www.ibm.com/history/deep-blue",
    eraIds: ["era-1", "era-2"],
    type: "website",
  },
  {
    id: "apple-2011",
    apa: "Apple. (2011, October 4). Apple launches iPhone 4S, iOS 5 & iCloud [Press release]. https://www.apple.com/newsroom/2011/10/04Apple-Launches-iPhone-4S-iOS-5-iCloud/",
    url: "https://www.apple.com/newsroom/2011/10/04Apple-Launches-iPhone-4S-iOS-5-iCloud/",
    eraIds: ["era-2"],
    type: "website",
  },

  // ---- Era 3: Rayyan's essay (also bengio-2025 in Waleed's) ----
  {
    id: "witt-2025",
    apa: "Witt, S. (2025, October 10). The A.I. prompt that could end the world. The New York Times. https://www.nytimes.com/2025/10/10/opinion/ai-destruction-technology-future.html",
    url: "https://www.nytimes.com/2025/10/10/opinion/ai-destruction-technology-future.html",
    eraIds: ["era-3"],
    type: "article",
  },
  {
    id: "bengio-2025",
    apa: "Bengio, Y. (2025, April). The catastrophic risks of AI — and a safer path [Video]. TED Conferences. https://www.ted.com/talks/yoshua_bengio_the_catastrophic_risks_of_ai_and_a_safer_path",
    url: "https://www.ted.com/talks/yoshua_bengio_the_catastrophic_risks_of_ai_and_a_safer_path",
    eraIds: ["era-3"],
    type: "video",
  },
  {
    id: "krueger-2026",
    apa: "Krueger, D. (2026, March 27). Rogue AI is already here. Fortune. https://fortune.com/2026/03/27/rogue-ai-agents-autonomous-safety/",
    url: "https://fortune.com/2026/03/27/rogue-ai-agents-autonomous-safety/",
    eraIds: ["era-3"],
    type: "article",
  },

  // ---- Era 3: our previous group project (AI and employment) ----
  {
    id: "casselman-2026",
    apa: "Casselman, B. (2026, June 10). The hidden workers most threatened by A.I. The New York Times. https://www.nytimes.com/2026/06/10/business/economy/back-office-workers-ai.html",
    url: "https://www.nytimes.com/2026/06/10/business/economy/back-office-workers-ai.html",
    eraIds: ["era-3"],
    type: "article",
  },
  {
    id: "johansson-2026",
    apa: "Johansson, S., Madgavkar, A., & Schrader, U. (2026, July 9). Human skills in the age of automation. McKinsey & Company. https://www.mckinsey.com/featured-insights/charts/human-skills-in-the-age-of-automation",
    url: "https://www.mckinsey.com/featured-insights/charts/human-skills-in-the-age-of-automation",
    eraIds: ["era-3"],
    type: "report",
  },
  {
    id: "tenev-2025",
    apa: "Tenev, V. (2025, October). AI is coming for your job. Now what? [Video]. TED Conferences. https://www.ted.com/talks/vlad_tenev_ai_is_coming_for_your_job_now_what",
    url: "https://www.ted.com/talks/vlad_tenev_ai_is_coming_for_your_job_now_what",
    eraIds: ["era-3"],
    type: "video",
  },

  // ---- Era 3: public opinion polls (new, for content/datasets.ts) ----
  {
    id: "pew-2025-us",
    apa: "Kennedy, B., Yam, E., Kikuchi, E., Pula, I., & Fuentes, J. (2025, September 17). How Americans view AI and its impact on people and society. Pew Research Center. https://www.pewresearch.org/science/2025/09/17/how-americans-view-ai-and-its-impact-on-people-and-society/",
    url: "https://www.pewresearch.org/science/2025/09/17/how-americans-view-ai-and-its-impact-on-people-and-society/",
    eraIds: ["era-3"],
    type: "poll",
  },
  {
    id: "pew-2025-global",
    apa: "Pew Research Center. (2025, October 15). How people around the world view AI. https://www.pewresearch.org/global/2025/10/15/how-people-around-the-world-view-ai/",
    url: "https://www.pewresearch.org/global/2025/10/15/how-people-around-the-world-view-ai/",
    eraIds: ["era-3"],
    type: "poll",
  },

  // ---- Era 3: Abdulrahman Ahmad's essay ("A.I.'s potential: Shaping up a united future") ----
  {
    id: "witt-2026",
    apa: "Witt, S. (2026, October 7). He's the most powerful engineer on Earth. Here's why he thinks A.I. is going great. The New York Times. https://www.nytimes.com/2026/10/07/opinion/jensen-huang-ai-tech-nvidia.html",
    url: "https://www.nytimes.com/2026/10/07/opinion/jensen-huang-ai-tech-nvidia.html",
    eraIds: ["era-3"],
    type: "article",
  },
  {
    id: "hastings-khan-2026",
    apa: "Hastings, R., & Khan, S. (2026, April). Why AI is an even bigger deal than you think [Video]. TED Conferences. https://www.ted.com/talks/reed_hastings_and_sal_khan_why_ai_is_an_even_bigger_deal_than_you_think",
    url: "https://www.ted.com/talks/reed_hastings_and_sal_khan_why_ai_is_an_even_bigger_deal_than_you_think",
    eraIds: ["era-3"],
    type: "video",
  },
  {
    id: "mims-2026",
    apa: "Mims, C. (2026, June 21). What AI can't—or shouldn't—do for you. The Wall Street Journal. https://www.wsj.com/tech/ai/when-ai-more-harm-than-good-519a83e7",
    url: "https://www.wsj.com/tech/ai/when-ai-more-harm-than-good-519a83e7",
    eraIds: ["era-3"],
    type: "article",
  },
  {
    id: "mcclain-2025",
    apa: "McClain, C., Kennedy, B., Gottfried, J., Anderson, M., & Pasquini, G. (2025, April 3). How the U.S. public and AI experts view artificial intelligence. Pew Research Center. https://www.pewresearch.org/internet/2025/04/03/how-the-us-public-and-ai-experts-view-artificial-intelligence/",
    url: "https://www.pewresearch.org/internet/2025/04/03/how-the-us-public-and-ai-experts-view-artificial-intelligence/",
    eraIds: ["era-3"],
    type: "poll",
  },

  // ---- Era 3: Waleed's essay ("Is AI out of control, or badly trained?") ----
  {
    id: "booth-2026",
    apa: "Booth, R. (2026, March 27). Number of AI chatbots ignoring human instructions increasing, study says. The Guardian. https://www.theguardian.com/technology/2026/mar/27/number-of-ai-chatbots-ignoring-human-instructions-increasing-study-says",
    url: "https://www.theguardian.com/technology/2026/mar/27/number-of-ai-chatbots-ignoring-human-instructions-increasing-study-says",
    eraIds: ["era-3"],
    type: "article",
  },
  {
    id: "turner-2025",
    apa: "Turner, B. (2025, October 31). AI models refuse to shut themselves down when prompted — they might be developing a new 'survival drive,' study claims. Live Science. https://www.livescience.com/technology/artificial-intelligence/ai-models-refuse-to-shut-themselves-down-when-prompted-they-might-be-developing-a-new-survival-drive-study-claims",
    url: "https://www.livescience.com/technology/artificial-intelligence/ai-models-refuse-to-shut-themselves-down-when-prompted-they-might-be-developing-a-new-survival-drive-study-claims",
    eraIds: ["era-3"],
    type: "article",
  },

  // ---- Era 3: our own interview (placeholder until recorded) ----
  {
    id: "aqeel-interview",
    apa: "TODO: APA reference for our recorded interview with Professor Aqeel (name, date, our site as publisher)",
    url: "TODO: link to the interview page on our site once it is published",
    eraIds: ["era-3"],
    type: "interview",
  },
];
