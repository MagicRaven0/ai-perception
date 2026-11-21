# What the site still needs from the group

Deadline target: about 1 Dec 2026. Send items as they're ready; every slot already shows "coming soon" until filled.
The prompts in `docs/CONTENT_PROMPTS.md` produce most of the text items in the right format.

## Words and research (Prompts 1–6, 8)
| # | Item | Where it goes | Prompt |
| --- | --- | --- | --- |
| 1 | Works cited (APA 7 + links) | `content/sources.ts` | 1 |
| 2 | Thesis sentence, team names + roles, AI disclosure | `content/site.ts` | 2 |
| 3 | Rhetorical situation answers (Purpose especially) | `content/about.ts` | 2 |
| 4 | Era titles, 2–3 essay paragraphs each, "supports our argument" paragraph | `content/eras.ts` | 3 |
| 5 | Roles + views for McCarthy, Jobs, Bengio, Professor Aqeel | `content/eras.ts` | 3 |
| 6 | 4–6 buildings per island: title, teaser, full text, sources | `content/buildings.ts` | 4 |
| 7 | Benefit / risk / danger points (previous project) | `content/insights.ts` | 5 |
| 8 | Real poll numbers with exact question wording, sample, dates | `content/datasets.ts` | 6 |
| 9 | 1956 prediction vs today comparison(s) | `content/comparisons.ts` | 6 |
| 10 | Research notes for the chatbot | `content/corpus/*.md` | 8 |
| 11 | Starter questions + 20-question test set per persona | `content/suggested-questions.ts` | 9 |

## Recordings (Prompt 7)
| # | Item | Notes |
| --- | --- | --- |
| 12 | Podcast MP3s (one per island suggested) | Mono, 64–96 kbps; put in `public/audio/` |
| 13 | Professor Aqeel interview MP3 | Plus his **written OK** to publish name, photo and recording |
| 14 | Transcripts (.vtt) for every recording | Free: Whisper locally; fix names by hand |
| 15 | Chapter times for each recording | Seconds + title |

## Visuals (Prompt 10)
| # | Item | Notes |
| --- | --- | --- |
| 16 | Videos for "cinema" buildings | Upload to YouTube as **unlisted**, send the video id |
| 17 | Animations for "gallery" buildings | Short video (YouTube unlisted) or image sequence |
| 18 | Photos for figure billboards (McCarthy, Jobs, Bengio, Professor Aqeel) | Licensed (e.g. Wikimedia Commons) with exact credit line, or Professor Aqeel's own photo with his OK |
| 19 | Figure "looks" (outfit colours + one prop, faceless) | Comes from Prompts 3 and 7 |
| 20 | Reference images for the islands (optional) | Only if you want a specific look changed |

## Accounts and decisions (you)
| # | Item | Why |
| --- | --- | --- |
| 21 | Live AI: card on Vercel (free monthly credit) **or** DeepSeek key in Vercel env | Typed chatbot questions; without it only pre-written answers work |
| 22 | Enable Vercel Web Analytics (dashboard toggle) | Evidence for the reflection |
| 23 | Optional: Upstash Redis (Vercel Marketplace) | Shared rate limits during class |
| 24 | Ask the professor: may the adaptation add sources beyond the essay's library? | Affects polls, interviews, Bengio |
| 25 | Presentation date and how you'll present (projector / phones) | Final testing plan |
| 26 | Optional: lo-fi music / ambient loops per island (CC0 or your own) | The world has sound slots; it's silent until files are added |

## What I do once things arrive
Insert and format everything, run `npm run gen-ai` (pre-written summaries and answers for you to check), place buildings and figures, wire recordings and videos, check every number has a source, then the final checks in `docs/LAUNCH.md`.
