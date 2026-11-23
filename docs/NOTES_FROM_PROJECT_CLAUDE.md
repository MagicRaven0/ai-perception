# Notes from the project Claude (22 Nov 2026)

Written by the Claude that holds the WRI-101 class files (essay, sources, notes). Covers CONTENT_PROMPTS Prompts 0–3.

## What changed in `content/`
| File | Prompt | State |
| --- | --- | --- |
| `sources.ts` | 1 | 15 sources, APA 7 with working links (1 placeholder: the Aqeel interview) |
| `site.ts` | 2 | Draft thesis, AI disclosure, team (only "Rayyan" known; 2 names TODO) |
| `about.ts` | 2 | All six rhetorical-situation answers + genre rationale, matched to the draft thesis |
| `eras.ts` | 3 | Titles, years, McCarthy / Jobs / Bengio filled with faceless looks; 2–3 paragraph summaries and thesis links for all three eras. Professor Aqeel's role and view stay TODO |

Checked against `lib/content/schema.ts` with zod 4.6.7 and `tsc --strict` in a scratch copy: parses and type-checks; no duplicate ids; no quote over 25 words; no em dashes. I could not run `npm run verify` on the laptop, so please run it.

Remaining placeholders from these files (9): team member 2 and 3 names and all three roles, Aqeel role + view, Aqeel interview APA + link.

## Source ids (Prompt 1), reuse these in Prompts 4–10
| id | What it is | Eras |
| --- | --- | --- |
| `mccarthy-1955` | The Dartmouth proposal (McCarthy, Minsky, Rochester, Shannon) | 1 |
| `dartmouth-nd` | Dartmouth College page, "AI coined at Dartmouth" | 1 |
| `simon-newell-1958` | Simon & Newell, chess-champion-in-ten-years prediction (Operations Research) | 1, 2 |
| `williams-2024` | The Conversation: 1958 NYT perceptron report, AI winters of 1974 and 1987 | 1, 2 |
| `steve-jobs-archive-2024` | Steve Jobs Archive, "40 years of the Macintosh" | 2 |
| `popova-2011` | The Marginalian: Jobs's 1990 "bicycle for our minds" quote | 2 |
| `ibm-nd` | IBM Heritage: Deep Blue beats Kasparov, 1997 | 1, 2 |
| `apple-2011` | Apple press release launching Siri, 4 Oct 2011 | 2 |
| `witt-2025` | Witt, NYT, "The A.I. prompt that could end the world" (essay source) | 3 |
| `bengio-2025` | Bengio, TED2025 (essay source) | 3 |
| `krueger-2026` | Krueger, Fortune, "Rogue AI is already here" (essay source) | 3 |
| `casselman-2026` | Casselman, NYT, back-office jobs (previous group project) | 3 |
| `johansson-2026` | McKinsey, human skills in the age of automation (previous group project) | 3 |
| `tenev-2025` | Tenev, TED, "job singularity" (previous group project) | 3 |
| `aqeel-interview` | Placeholder for our interview | 3 |

## Decisions the group must confirm
1. **Which essay is adapted.** I used Rayyan's research essay, *Why the Ability to Correct AI Matters More Than Its Intelligence* (Witt, Bengio, Krueger). It only covers era 3. If another member's essay is the one being adapted, send it and I'll redo eras 1–2 from it.
2. **New sources for eras 1 and 2.** The essay has nothing on the 1950s or 1984–2011, so I found and read 8 sources for them (primary where possible: the 1955 proposal, Simon & Newell 1958, Apple's 2011 press release, the Steve Jobs Archive, IBM). This depends on the professor allowing sources beyond the essay's library (WHAT_WE_NEED item 24). If the answer is no, those eras go back to TODO.
3. **Thesis (draft).** Built from the essay's conclusion (control matters more than capability), stretched across 70 years. Edit freely; the About page "Purpose" and every `thesisLink` follow it, so tell me if you change its main idea.
4. **AI disclosure.** It says Claude Code built the code, Claude drafted site text and suggested era 1–2 sources, and the group checks every summary and fact. Make sure that is true by launch (someone must actually open the 8 new sources and read the era text).
5. The 1958 perceptron quote is cited through Williams (2024), not the NYT archive, because I could not open the archive page. With the school NYT account you could cite the original instead.

## For Claude Code (please look at these)
1. **Era chunks have no source ids in the corpus.** `lib/ai/corpus.ts` pushes era overview, thesis-link and key-people docs with `sourceIds: []`. The era text now carries APA in-text citations like "(Witt, 2025, para. 57)", so the chatbot cites a chunk but cannot show which works it came from. Suggest either matching in-text citations to `sources` (author surname + year → id) or attaching all sources whose `eraIds` include that era. The first is more accurate.
2. **Sources page order.** `sources.ts` is grouped by era for editing. APA reference lists are alphabetical by first author, so please sort by `apa` when rendering (`/sources` and the About page if it lists them).
3. **In-text citations in prose.** Era paragraphs now contain citations in parentheses. If the 2D renderer turns markdown into HTML, parentheses are fine as plain text; optional nice touch: link each citation to `/sources#<id>`.
4. **A `TODO:` APA string** (`aqeel-interview`) should render as the hatched "coming soon" box on `/sources`, not as a normal reference line.
5. **Era 1 years** are kept at 1950–1959 (the "1950s" island). The sources inside cover 1955–1958; fine as is unless the timeline shows exact start years.
6. Run `npm run verify` and `npm run test:e2e` after pulling these files; screenshots of `/read`, `/about` and `/sources` at 375 px and 1440 px would show whether the longer paragraphs still fit the layout.

---

# Round 2 (22 Nov 2026): Prompts 4–8 and WHAT_WE_NEED

## What changed
| File | Prompt | State |
| --- | --- | --- |
| `content/sources.ts` | 6 | +2 Pew sources: `pew-2025-us` (Kennedy et al., 2025) and `pew-2025-global` (Pew Research Center, 2025) |
| `content/buildings.ts` | 4 | 16 buildings: The Past 5, The Jobs Era 5, The Future 6 (island capacity is 17 / 13 / 17, so no overlap) |
| `content/insights.ts` | 5 | 11 points, each with a source except one marked `groupCommentary` |
| `content/comparisons.ts` | 6 | 3 comparisons: chess prediction vs Deep Blue, 1958 promise vs 2025 evidence, Siri vs agents |
| `content/datasets.ts` | 6 | 7 datasets, all `verified`. Pew numbers copied from the June 2025 topline PDF |
| `content/episodes.ts` | 7 | `episode-1`, `episode-2`, `episode-3`, `interview-aqeel` with planned chapters and faceless looks |
| `content/corpus/*.md` | 8 | 14 research notes |
| `docs/RECORDING_PLAN.md` | 7 | Interview guide, consent line, 3 podcast outlines with timings and source ids |
| `docs/PHOTOS.md`, `docs/EMAILS.md`, `docs/WHAT_WE_NEED.md` | — | Photo licences, email drafts, status column |

Checked again in the scratch copy: all schemas parse, every `sourceIds` / `episodeId` / `buildingId` reference resolves, no building order clashes, every `short` is under 60 words, every insight under 25 words, no quote over 25 words.

## For Claude Code (round 2)
1. **Building ids changed.** Removed `era-2-interview` (no era-2 interview is planned) and `public-opinion-lab` (polls now live in `feelings-arcade`). New ids: `perceptron-cinema`, `predictions-arcade`, `bicycle-archive`, `ai-winter-lab`, `era-2-podcast`, `evidence-lab`, `agents-cinema`, `era-3-podcast`. Nothing in `app/`, `components/`, `lib/` or `tests/` referenced the old ids when I checked, but please grep once.
2. **Two arcade interactions are described in the text but need building:**
   - `predictions-arcade`: a year slider ("when did a computer first beat the world chess champion?"), then reveal 1997. Sources `simon-newell-1958`, `ibm-nd`.
   - `feelings-arcade`: a slider for the visitor's own feeling (more excited / equally / more concerned), then show it next to `public-trust-vs-fear` (2025 point) and `global-concern`. Never store the visitor's answer unless the optional class poll is switched on.
3. **Chart edge cases in `datasets.ts`:**
   - `public-trust-vs-fear` is a `line` chart with 3 series over 5 years.
   - `want-more-control` is a `bar` chart with 2 series (2024, 2025), so it needs grouped bars.
   - `apollo-deception` has long x labels: wrap them or use a horizontal bar chart. Its `questionWording` starts "Not a survey:", so please show it as a note rather than under a "Question:" heading.
   - `metr-task-doubling` uses `unit: "months"`, not `%`.
4. **Placeholder buildings with real `short` text:** the 3 podcasts and `aus-interview` have a finished `short` but a `TODO:` `long`, so they should show the teaser plus "coming soon", not a hatched box over the teaser.
5. **Photos:** follow `docs/PHOTOS.md`. This needs a content edit (credits, images, `imageId` on figures), so do it only after Rayyan says the project Claude is finished.
6. **Corpus:** 14 notes are now in `content/corpus/`. Their `sources:` header lines carry real ids, so the chatbot can show APA references for them. Re-run `npm run gen-ai` after merging so the pre-generated summaries and answers use the new content.
7. Run `npm run verify`, `npm run check-content` and `npm run test:e2e`. Put anything that fails because of content into `docs/CONTENT_ERRORS.md`.

---

# Round 3 (22 Nov 2026): Prompts 9–10, new features, next session

## What changed
- `content/suggested-questions.ts`: 4 starter questions per persona, all answerable from our research. I replaced the analyst's question about polls on AI and jobs, because we have no such poll.
- `content/corpus/pew-public-opinion.md`: one sentence added (13% would let AI help a lot, 27% not at all).
- `docs/CHATBOT_TESTS.md`: 60 test questions (15 answerable + 5 not covered, per persona) with expected answers and source ids.
- `docs/VIDEO_PLANS.md`: storyboards, narration and legal image sources for the 3 cinemas and the gallery, plus ready credit entries (the 1960 U.S. Navy Perceptron photo is public domain).
- `docs/VISION.md`: three new features Rayyan asked for (see "Added 22 Nov 2026"): a References building per island, NPC figures, and a free-look camera.
- `docs/NEXT_SESSION_PROMPT.md`: the prompt for the next Claude Code session.

## For Claude Code (round 3)
1. Build the three new features from `docs/VISION.md`. The References building is generated from content, not added to `content/buildings.ts`.
2. Use `docs/CHATBOT_TESTS.md` to test the chatbot and record results in `docs/CHATBOT_TEST_RESULTS.md`.
3. When the group sends YouTube ids, they go into `media.youtubeId` of `perceptron-cinema`, `interface-gallery`, `voice-assistant-cinema` and `agents-cinema`, with the credit entries from `docs/VIDEO_PLANS.md`.

---

# Round 4 (22 Nov 2026): podcast scripts and AI voices

## What changed
- `docs/PODCAST_SCRIPTS.md`: full two-host scripts for episodes 1–3, proofread against the sources. Episode 1 has a short part for the fictional 1956 Workshop Researcher (lines only from the 1955 proposal).
- `docs/AI_VOICE_PLAN.md`: choosing between real voices, cloning the group's own voices (ElevenLabs or a free local model), and a designed voice for the fictional guest. We deliberately do not clone Steve Jobs or any other real person.
- `content/episodes.ts`: chapter times now follow the scripts, and episode 1 lists the fictional guest as a speaker.
- Status: the professor email is sent, Professor Aqeel has given his OK (interview time pending), and team names come later.

## For Claude Code (round 4)
1. If the group picks the free local voice option, set up Qwen3-TTS or VoxCPM2 on Rayyan's laptop (RTX 5070, 8 GB). Write `scripts/tts-podcast.ts` (or Python) that reads `docs/PODCAST_SCRIPTS.md`, generates every **A:**, **B:** and **RESEARCHER:** line with the matching voice, skips the lines in *(brackets)*, and joins each episode into `public/audio/episode-N.mp3` (mono, 64–96 kbps).
2. Episode pages and the 3D drawers should show the speakers list, so the fictional guest's "not a real person" role is visible.
3. When AI voices are used, follow the labelling list at the end of `docs/AI_VOICE_PLAN.md` (episode summary, credit with `aiTool`, AI disclosure). These are content edits, so make them only when Rayyan asks.

---

# Round 5 (22 Nov 2026): the teammates' essays

## What changed
- `content/sources.ts`: 6 new sources (23 total): witt-2026, hastings-khan-2026, mims-2026, mcclain-2025 (Abdulrahman Ahmad's essay); booth-2026, turner-2025 (Waleed's essay, plus bengio-2025). All checked against the original articles.
- `content/site.ts`: thesis ends "understand, check and correct them"; team now has all three names with essay-based roles (Waleed's surname still missing); disclosure says "three research essays".
- `content/about.ts`: Author and Purpose now describe all three essays.
- `content/eras.ts` era-3: new anchor figure **Jensen Huang** (look: dark top, no prop; no photo yet, see `docs/PHOTOS.md`); perceptionSummary and thesisLink rewritten to cover all three essays.
- `content/buildings.ts` era-3: 4 new buildings (orders 4–7): `in-the-wild-archive` (documents), `training-lab` (research), `ai-potential-lab` (research), `experts-vs-public` (experience). Existing `feelings-arcade`, `aus-interview`, `era-3-podcast` moved to orders 8, 9, 10. Era 3 now has 10 buildings (capacity 17). `bengio-archive` text adds Scientist AI.
- `content/insights.ts`: 5 new era-3 insights (16 total), one with `groupCommentary: true` and no sources (Waleed's fix argument).
- `content/datasets.ts`: 2 new verified datasets: `experts-vs-public` (grouped bar, 2 series × 5 categories, `sampleSize: null` because there are two samples; both are in `population`) and `shutdown-resistance` (bar, "Not a survey:").
- `content/comparisons.ts`: new `lab-vs-everyday` (Bengio 2025 test vs Booth 2026).
- `content/corpus/`: 8 new notes (22 total): huang-engineering-view, ai-tutor-future, mims-when-not-to-use-ai, experts-vs-public, scheming-in-the-wild, shutdown-resistance, essay-ai-potential, essay-badly-trained. `correctability-argument` retitled as Rayyan's essay; `bengio-self-preservation` adds Scientist AI.
- `content/episodes.ts` episode-3: retitled "Three essays, one question", three named hosts (new `thirdHostLook`, laptop prop), new chapters. Script rewritten in `docs/PODCAST_SCRIPTS.md` (about 8 min, 1,160 words).
- `content/suggested-questions.ts`: guide #3 and analyst #4 swapped for questions on the teammates' essays.
- `docs/CHATBOT_TESTS.md`: 10 new rows at the end (old 60 unchanged).
- `docs/TEAM_ESSAY_NOTES.md`: for the group, where two essays differ from their sources. The site follows the sources.

## For Claude Code (round 5)
1. Re-read all of `content/` before editing anything: 10 content files and 9 corpus notes changed.
2. `experts-vs-public` is the first dataset with **two series on a bar chart**. Render it as grouped bars (experts vs U.S. adults per category) with a table twin; the five categories are separate questions, so no stacking and no total. Show `population` in the source line since `sampleSize` is null.
3. The `experts-vs-public` building (kind `experience`) should show that chart, like `feelings-arcade` shows the Pew line chart. `training-lab` can embed `shutdown-resistance`.
4. Three hosts in episode 3: the podcast building's NPC group needs a third figure (`thirdHostLook`). Episode 3 speakers have `consentConfirmed: true` because they are the group members themselves.
5. Jensen Huang has no `imageId` yet. Use the faceless figure only until a licensed photo is found (do not use a news photo). He is a real person: no likeness, no chatbot persona.
6. The References building on The Future now has 13 sources for era 3; make sure the list scrolls.
7. Re-run `npm run gen-ai` (suggested questions changed) and the chatbot tests, including the 10 new rows. Analyst test 25 checks a common mistake (the AISI did not run the study itself).
8. Island capacity: era 3 now uses 10 of 17 plots.

## Round 5b (22 Nov 2026): the professor's condition on extra sources
The professor allowed sources beyond our essays, **as long as there is also substantial content from our essays**. Changes:
- `content/buildings.ts`: 2 new buildings, `era-1-then-and-now` (era-1, order 6) and `era-2-then-and-now` (era-2, order 6), both built mainly from essay sources. Eras now have 6 / 6 / 10 buildings.
- `content/insights.ts`: `era-1-risk-2` and `era-2-danger-2` (essay sources).
- `content/eras.ts`: era-1 and era-2 thesisLink each end with a sentence linking to the essays.
- `content/about.ts`: genreRationale now starts by saying most content comes from our three essays.

### For Claude Code (round 5b)
1. Please make the essays' sources visible as the core of the site. Add an optional field to the Source schema, `origin: z.enum(["essay", "added"]).optional()`, then set it in `content/sources.ts` (this one content edit is allowed): **essay** = witt-2025, bengio-2025, krueger-2026, witt-2026, hastings-khan-2026, mims-2026, mcclain-2025, booth-2026, turner-2025; **added** = everything else. In each References building and on the reference page, list "From our essays" first, then "Added for the history".
2. The "then and now" buildings can sit near each island's dock or bridge, as a link to the next island.


## Round 6 (23 Nov 2026): photos
7 licensed photos (4 figures + 3 buildings) with credit lines and alt text: see "Round 6" in `docs/PHOTOS.md`.

## Round 7 (23 Nov 2026): AI voices and videos
The group decided to make the podcasts and video narration with **local voice cloning of their own voices** and to have the videos made by the project Claude.

### For Claude Code (round 7)
1. Add to `.gitignore`: `tools/voices/samples/` and `tools/voices/out/` (the repo is public; voice samples must never be pushed).
2. Follow `tools/voices/README.md`: set up one local cloning model on the RTX 5070, write `tools/voices/generate.py` (one WAV per line of `tools/voices/lines.json`), then run `assemble.py`. Do not edit the script text; if a line sounds wrong, fix pronunciation with a phonetic spelling map in `generate.py` only.
3. After assembling, set `src`, `durationSec` and the chapter `t` values in `content/episodes.ts` from what `assemble.py` prints (audio fields only).
4. Disclosure, because the voices are AI-generated:
   - add to each episode's `summary`: "The hosts' voices were generated with [model name] from our own recordings, with our permission. Scripts written by our group from our sources."
   - add a `credits` entry per episode with `kind: "audio"` and the model name;
   - write the AI disclosure sentence into `docs/CONTENT_ERRORS.md` as a request for the project Claude (it will update `content/site.ts`).
5. Video: `public/videos/interface-gallery.mp4` (60 s, 1280×720, loops; updated 23 Nov with an original synthesised lo-fi soundtrack and sound effects, and no on-screen AI label) is the `interface-gallery` animation. Add an optional `media.videoSrc` field to the Building schema, set it on `interface-gallery`, and play it looping in the gallery building: muted at a distance, with sound when the visitor is inside (duck the island's ambient music meanwhile), and with controls in the long-read. Its credit: `{ id: "video-interface-gallery", kind: "video", title: "A computer for the rest of us (animation)", author: "Our group, made with Claude (Anthropic)", licence: "All rights reserved by the authors (class project)", url: "/videos/interface-gallery.mp4" }`. The group chose a clean video without an on-screen AI label, so the AI disclosure must be visible next to the video instead: show the credit line ("made with Claude (Anthropic)") under the video in the gallery and in the long-read, and keep it in the About page credits. The soundtrack is part of the same credit (synthesised in code, no third-party music). The other three videos come after the photos and narration exist.

## Round 8 (23 Nov 2026): two more island animations
- New: `public/videos/perceptron-cinema.mp4` (era 1, 60 s, 12 MB) and `public/videos/agents-cinema.mp4` (era 3, 60 s, 2 MB). Same format as the gallery one: 1280×720, loops, original soundtrack, no on-screen AI label.
- `content/buildings.ts`: the `perceptron-cinema` text now says "Our short animation in this cinema retells the story in one minute."
- `tools/voices/voices.json` / `lines.json`: only `voice-assistant-cinema` still needs narration.

### For Claude Code (round 8)
1. Set `media.videoSrc` on `perceptron-cinema` (`/videos/perceptron-cinema.mp4`) and `agents-cinema` (`/videos/agents-cinema.mp4`); play them like the gallery video (sound only when the visitor is inside, island music ducked).
2. Credits, shown under each video and on the About page:
   - `video-perceptron-cinema`: "The machine that would walk, talk, see (animation)", author "Our group, made with Claude (Anthropic)", licence "All rights reserved by the authors (class project)".
   - `video-agents-cinema`: "When an agent will not stop (animation)", same author and licence. The inbox in it is a reconstruction with invented names, labelled on screen.
3. Rebuild `tools/voices/lines.json` with `python tools/voices/build_lines.py` after pulling (only one video narration left).
4. 12 MB is fine for Vercel, but load each video only when the visitor walks near its building (`preload="none"`).

