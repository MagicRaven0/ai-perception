# What the site still needs from the group

Deadline target: about 1 Dec 2026. Send items as they're ready; every slot already shows "coming soon" until filled.
The prompts in `docs/CONTENT_PROMPTS.md` produce most of the text items in the right format.

**Status updated 22 Nov 2026 by the project Claude (all prompts 0–10 done; round 5 added Abdulrahman's and Waleed's essays).** "Drafted" means the text is in the site but the group must read and approve it. Details and open questions: `docs/NOTES_FROM_PROJECT_CLAUDE.md`.

## Words and research (Prompts 1–6, 8)
| # | Item | Where it goes | Prompt | Status |
| --- | --- | --- | --- | --- |
| 1 | Works cited (APA 7 + links) | `content/sources.ts` | 1 | **Done:** 23 sources (1 placeholder: the Aqeel interview). 13 come from our three essays; 10 are new, beyond the essays: see item 24 |
| 2 | Thesis sentence, team names + roles, AI disclosure | `content/site.ts` | 2 | **Drafted:** thesis (now covers all three essays), disclosure, 3 names with roles based on each essay. **Names confirmed.** Group: check the roles |
| 3 | Rhetorical situation answers (Purpose especially) | `content/about.ts` | 2 | **Drafted:** all six + genre rationale (updated for three essays) |
| 4 | Era titles, 2–3 essay paragraphs each, "supports our argument" paragraph | `content/eras.ts` | 3 | **Drafted:** all three eras; era 3 now uses all three essays |
| 5 | Roles + views for McCarthy, Jobs, Bengio, Professor Aqeel | `content/eras.ts` | 3 | **Drafted:** McCarthy, Jobs, Bengio, Jensen Huang (new, from Abdulrahman's essay). **Missing:** Aqeel (after the interview) |
| 6 | 4–6 buildings per island: title, teaser, full text, sources | `content/buildings.ts` | 4 | **Drafted:** 20 buildings (5 / 5 / 10). 4 still "coming soon" until recorded: 3 podcasts + the interview |
| 7 | Benefit / risk / danger points (previous project) | `content/insights.ts` | 5 | **Drafted:** 16 points (3 / 4 / 9); era 3 uses all three essays and the AI-and-jobs project |
| 8 | Real poll numbers with exact question wording, sample, dates | `content/datasets.ts` | 6 | **Done:** 9 verified datasets (5 from Pew 2025, experts vs public from Pew 2024, 2 from Witt, 1 from Palisade via Live Science). Nothing estimated |
| 9 | 1956 prediction vs today comparison(s) | `content/comparisons.ts` | 6 | **Drafted:** 4 comparisons |
| 10 | Research notes for the chatbot | `content/corpus/*.md` | 8 | **Drafted:** 22 notes, including one per group essay |
| 11 | Starter questions + 20-question test set per persona | `content/suggested-questions.ts` | 9 | **Done:** 4 starter questions per persona (all answerable from our research); 70-question test set in `docs/CHATBOT_TESTS.md` |

## Recordings (Prompt 7)
| # | Item | Notes | Status |
| --- | --- | --- | --- |
| 12 | Podcast MP3s (one per island suggested) | Mono, 64–96 kbps; put in `public/audio/` | **Scripts ready to record:** `docs/PODCAST_SCRIPTS.md` (3 episodes, about 6–8 min each, proofread against the sources; episode 3 has all three of us, each presenting our own essay). Real voices or AI voices: `docs/AI_VOICE_PLAN.md` |
| 13 | Professor Aqeel interview MP3 | Plus his **written OK** to publish name, photo and recording | **OK received** (keep the message). Waiting on an interview time. Questions + consent line in `docs/RECORDING_PLAN.md` |
| 14 | Transcripts (.vtt) for every recording | Free: Whisper locally; fix names by hand | After recording |
| 15 | Chapter times for each recording | Seconds + title | Planned times in `content/episodes.ts`; update from the real audio |

## Visuals (Prompt 10)
| # | Item | Notes | Status |
| --- | --- | --- | --- |
| 16 | Videos for "cinema" buildings | Upload to YouTube as **unlisted**, send the video id | **To film.** Storyboards, narration and legal image sources for all 3 cinemas in `docs/VIDEO_PLANS.md` |
| 17 | Animations for "gallery" buildings | Short video (YouTube unlisted) or image sequence | **To make.** 60-second plan for `interface-gallery` in `docs/VIDEO_PLANS.md` (our own icons, no Apple designs) |
| 18 | Photos for figure billboards (McCarthy, Jobs, Bengio, Huang, Professor Aqeel) | Licensed (e.g. Wikimedia Commons) with exact credit line, or Professor Aqeel's own photo with his OK | **Found:** 3 CC BY-SA photos with credit lines in `docs/PHOTOS.md` (Claude Code downloads them). Huang: no free photo found yet. Aqeel's photo: ask him |
| 19 | Figure "looks" (outfit colours + one prop, faceless) | Comes from Prompts 3 and 7 | **Done:** in `content/eras.ts` and `content/episodes.ts` |
| 20 | Reference images for the islands (optional) | Only if you want a specific look changed | Optional |

## Accounts and decisions (you)
| # | Item | Why | Status |
| --- | --- | --- | --- |
| 21 | Live AI: card on Vercel (free monthly credit) **or** DeepSeek key in Vercel env | Typed chatbot questions; without it only pre-written answers work | Rayyan |
| 22 | Enable Vercel Web Analytics (dashboard toggle) | Evidence for the reflection | Rayyan |
| 23 | Optional: Upstash Redis (Vercel Marketplace) | Shared rate limits during class | Rayyan |
| 24 | Ask the professor: may the adaptation add sources beyond our essays' sources? | Eras 1–2, the Pew polls and the interview depend on it | **Answered 22 Nov 2026: yes**, as long as there is also substantial content from our essays. Done: the essays now feed all of The Future island, a "then and now" building and an insight on each older island, the era-1 and era-2 thesis links, 3 of 4 comparisons, podcast episode 3 and 11 chatbot notes |
| 25 | Presentation date and how you'll present (projector / phones) | Final testing plan | Group |
| 26 | Optional: lo-fi music / ambient loops per island (CC0 or your own) | The world has sound slots; it's silent until files are added | **Not needed:** the site already generates its own lo-fi music per island (`content/ambience.ts`). Ambient sound files stay optional |
| 27 | Read and approve every "Drafted" item above | The AI disclosure says the group checked every fact | **Group, before launch** |
| 28 | Abdulrahman and Waleed: read `docs/TEAM_ESSAY_NOTES.md` | Small spelling and source fixes in both essays (the site already follows the sources) | **Group** |
| 29 | Whose presentation is `AIs_Potential_Presentation.pptx`? | Its footer says Aboud | **Done:** it's Abdulrahman's (Aboud). Its slides match the What AI could do for us building |

## What I do once things arrive
Insert and format everything, run `npm run gen-ai` (pre-written summaries and answers for you to check), place buildings and figures, wire recordings and videos, check every number has a source, then the final checks in `docs/LAUNCH.md`.
