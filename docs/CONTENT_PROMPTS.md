# Prompts for the project Claude (the one with your essay, sources and notes)

Paste **Prompt 0** first, then the others one at a time. Each answer is a code block you can paste into the named file in `content/` (or send to me and I'll insert it). After pasting, run `npm run check-content`: it lists anything missing or wrong.

---

## Prompt 0: rules (paste first)

```
You are helping my WRI-101 group turn our research essay into content for our website "The Evolution of AI Perception" (American University of Sharjah). The site has three eras / 3D islands:
- era-1 "The Past" (1950s): John McCarthy, the 1956 Dartmouth workshop, academic optimism, room-sized computers.
- era-2 "The Jobs Era" (1984–2011): Steve Jobs, personal computing, friendly interfaces, Siri (2011).
- era-3 "The Future" (2020s–now): generative AI, public opinion polls, Yoshua Bengio (public statements only), our local expert Professor Aqeel (AUS, recorded interview).

Rules for everything you write:
1. Use ONLY our essay, our source library and our notes that you have access to. Never invent facts, numbers, dates, quotes, names or sources.
2. If something is missing, write the literal text "TODO: <what is missing>" in that field instead of guessing.
3. Every factual sentence must be traceable to a source id from our works cited. Our group's own opinions are allowed but must be marked as group commentary.
4. Quotes must be exact and short (under 25 words).
5. Plain, clear English. Real paragraphs, not slogans (our professor said punchy one-liners read as AI-generated).
6. Output TypeScript exactly in the format I give, inside one code block, with no extra commentary inside the block. Use straight double quotes, escape any double quote inside text as \", and separate paragraphs inside a string with \n\n.
7. IDs are lowercase kebab-case (e.g. "dartmouth-workshop", "mccarthy-1955").
Reply "ready" and wait for the next prompt.
```

---

## Prompt 1: sources (do this first, everything else points to these ids)

```
Make our works cited as a TypeScript array for content/sources.ts. One entry per source in our library:
{ id: "author-year" (kebab-case, unique), apa: "full APA 7 reference", url: "working link (https://...) or TODO: link", eraIds: ["era-1" | "era-2" | "era-3", ...] (eras it supports, can be empty), type: "book" | "article" | "journal" | "report" | "poll" | "website" | "video" | "interview" | "other" }
Output: export const sources: z.input<typeof Source>[] = [ ... ];
Also list, after the code block, the id you gave each source so I can reuse them.
```

---

## Prompt 2: thesis, team, about page

```
Write two blocks.

Block A, for content/site.ts (keep title/shortTitle/course/university as they are):
thesis: our thesis in ONE sentence that ties the three eras together;
team: [{ name, role }] for our 3 members (TODO if you don't know names);
aiDisclosure: one paragraph saying which AI tools we used, for what, and how we checked the output.

Block B, for content/about.ts, the rhetorical situation (Handout 12.1 headings). Fill "answer" for:
Author, Audience, Purpose, Context, Genre, Content and form; plus genreRationale (one paragraph: why an explorable 3D world + long-read + podcast suits an argument about how perception of AI changed).
Format: { rhetoricalSituation: [{ element: "Author", answer: "..." }, ...], genreRationale: "..." }
```

---

## Prompt 3: the three eras

```
For content/eras.ts, give me for each of era-1, era-2, era-3:
title: plain heading, e.g. "Origins and academic optimism";
years: { start: number, end: number or "present" };
anchorFigures: [{ name, role, view (what they expected/argued about AI, from our sources), look }] where look describes how their FACELESS low-poly figure is dressed: { top: "#hex", bottom: "#hex", prop: "none" | "microphone" | "laptop" | "book" | "chalk" | "headphones" | "clipboard" | "phone" }. No faces, no likeness, just period-appropriate clothing colours and one prop (e.g. 1950s academic: tweed brown top, grey trousers, chalk).
People: era-1 John McCarthy; era-2 Steve Jobs; era-3 Yoshua Bengio and Professor Aqeel.
perceptionSummary: 2–3 real paragraphs from our essay on how AI was perceived in that era (separate paragraphs with \n\n);
thesisLink: one paragraph on how that era supports our thesis.
Keep id, slug, number, islandName and palette as in my file; only output the fields above per era, labelled by era id.
```

---

## Prompt 4: buildings (the content of each island)

```
Each island has buildings you drive to. One building = one piece of content. Plan 4–6 buildings per era (max 6). For each:
{ id, eraId, order (1 = first on the island), kind: "podcast" | "interview" | "documents" | "research" | "video" | "animation" | "experience",
  title: plain heading,
  short: 1–2 sentences, max 60 words (shown in the 3D drawer),
  long: full section text, 1–4 paragraphs from our essay (\n\n between paragraphs),
  sourceIds: [ids from Prompt 1] (empty only if groupCommentary is true),
  groupCommentary: true/false,
  media: { episodeId?: "id of a podcast/interview episode", startAt?: seconds, youtubeId?: "11-char unlisted video id or omit", documentUrl?: "https://..." } }
Kinds: podcast studio, interview booth, archive (documents), research lab, cinema (video), gallery (animation), arcade (experience = a small interactive moment). Use a mix across islands. The AUS interview with Professor Aqeel must be an "interview" building on era-3 with media.episodeId "interview-aqeel".
Output: export const buildings: z.input<typeof Building>[] = [ ... ];
```

---

## Prompt 5: benefits, risks and dangers (from our previous project)

```
From our previous group project on AI benefits, risks and dangers, make 2–4 quick points per era for content/insights.ts:
{ id, eraId, kind: "benefit" | "risk" | "danger", text: one point, max 25 words, sourceIds: [...], groupCommentary: true/false, buildingId?: "id of the building it belongs next to (optional)" }
Points must fit the era (1950s, 1984–2011, 2020s). Use sources where we have them; otherwise mark groupCommentary true.
Output: export const insights: z.input<typeof Insight>[] = [ ... ];
```

---

## Prompt 6: survey data and "then vs now"

```
Block A, content/datasets.ts. Only REAL numbers from our sources (polls on trust/fear, adoption, jobs). For each:
{ id, eraId: "era-3", title, questionWording: "the exact survey question", population: "who was asked", sampleSize: number or null, fieldDates: "when", unit: "%", chartType: "bar" | "line" | "stat",
  series: [{ label: "2023", points: [{ x: "Excited", y: 10 }, ...] }], sourceId: "...", status: "verified" }
If we have a topic but not the exact numbers, keep status "placeholder", series [] and TODO text. Never estimate.

Block B, content/comparisons.ts. 1–3 "prediction vs reality" or "then vs now" pairs:
{ id, kind: "prediction-vs-reality" | "then-vs-now", left: { label, year, statement, sourceId }, right: { label, year, statement, sourceId }, takeaway: 1–2 sentences, eraIds: [...] }
```

---

## Prompt 7: podcasts, the AUS interview, and recording plan

```
Block A, content/episodes.ts metadata (before recording):
{ id, title, kind: "podcast" | "interview", eraIds: [...], summary: 1–2 sentences,
  speakers: [{ name, role, consentConfirmed: false, look: { top, bottom, prop } }],
  src: null, durationSec: null, chapters: [{ t: 0, title: "Intro" }, ...] (planned, seconds approximate), transcript: null }
Include: one podcast per era (ids "episode-1", "episode-2", "episode-3") and "interview-aqeel" (Professor Aqeel, era-3). Speaker looks are faceless outfits only (e.g. hosts with headphones, Professor Aqeel with a clipboard or laptop).

Block B (plain text, not code): a 12–15 question interview guide for Professor Aqeel about how perception of AI has changed, AI at AUS and in the UAE, trust vs fear, and what students should know. Include a short consent line we can read at the start of the recording.

Block C (plain text): a 6–8 minute outline for each podcast episode with segment timings that match the chapters, and which sources each segment uses.
```

---

## Prompt 8: research notes for the chatbot

```
Write research notes for our site's AI guide, one note per topic, 150–300 words each, in our own words (no long copied passages). One note per key source or topic (aim for 8–15 notes). Format each note as a separate code block that becomes a file content/corpus/<id>.md:

era: era-1
sources: source-id-1, source-id-2

# Title of the note

Text...
```

---

## Prompt 9: chatbot questions and test set

```
Block A, content/suggested-questions.ts: 4 starter questions per persona that our research CAN answer:
{ guide: [...4], "researcher-1956": [...4], "analyst-2026": [...4] }
(guide = friendly guide to the whole project; researcher-1956 = fictional 1956 workshop researcher roleplay; analyst-2026 = numbers-first data analyst.)

Block B (plain text): a test set of 20 questions per persona, 15 answerable from our research (with the expected answer in one line and the source id) and 5 NOT covered by our research (expected: "not in our research"). We'll use this to check the chatbot.
```

---

## Prompt 10: videos and animations

```
For each "video" and "animation" building from Prompt 4, write a short production plan:
- 60–120 second storyboard (shots with timings), narration script, on-screen text;
- what footage or images we need and where they may legally come from (our own recordings, CC0/CC-BY with credit lines, or AI-generated clearly labelled with the tool name);
- credit lines in this format for content/credits.ts: { id, kind: "image" | "video" | "music" | "audio" | "model", title, author, licence, url, aiTool? }.
We will upload videos to YouTube as unlisted and give the site the 11-character video id.
```
