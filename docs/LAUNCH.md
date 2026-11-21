# Launch checklist (Phase 4)

Live site: https://ai-perception.vercel.app · Repo: https://github.com/MagicRaven0/ai-perception

## 1. Content (the group)
- [ ] Thesis sentence in `content/site.ts` (updates the landing page, 2D intro, About page, chatbot and share image).
- [ ] Team names and roles, AI disclosure paragraph (`content/site.ts`).
- [ ] Era titles, 2–3 essay paragraphs each, "how this era supports our argument" (`content/eras.ts`).
- [ ] Every building: title, short teaser, full text, sources (`content/buildings.ts`).
- [ ] Benefit / risk / danger points from the previous project (`content/insights.ts`).
- [ ] Works cited in APA 7 with working links (`content/sources.ts`).
- [ ] Survey data with exact question wording, sample and dates; set `status: "verified"` (`content/datasets.ts`).
- [ ] Then-vs-now comparison text with sources (`content/comparisons.ts`).
- [ ] MP3s in `public/audio/`, transcripts in `content/transcripts/`, chapters (`content/episodes.ts`).
- [ ] Professor Aqeel's written OK, then `consentConfirmed: true` on the interview.
- [ ] Photos (licensed, credited) and any 3D models in `content/credits.ts`.
- [ ] Research notes for the chatbot in `content/corpus/*.md`.
- [ ] `npm run check-content` shows **0 placeholders**.

## 2. AI
- [ ] Choose live AI: add a card in Vercel (free monthly AI Gateway credit) **or** set `AI_PROVIDER=deepseek` + `DEEPSEEK_API_KEY` in Vercel. Without either, typed questions stay paused and pre-written answers still work.
- [ ] `npm run gen-ai` (works with the local Ollama model), then read `content/generated/*.json`, fix anything wrong, set `"checked": true`.
- [ ] Ask each persona 20 test questions (5 not in the research): they should cite sources and say "not found" for the 5.
- [ ] Optional: Upstash Redis from the Vercel Marketplace, so rate limits and the budget are shared across servers.

## 3. Final build
- [ ] In Vercel → Settings → Environment Variables (Production): `CONTENT_STRICT=1` so a leftover placeholder fails the deploy.
- [ ] `npm run verify` and `npm run test:e2e` pass locally.
- [ ] Lighthouse on `/read` in Chrome DevTools (mobile): Performance ≥ 90, Accessibility ≥ 95.
- [ ] Vercel → Analytics: enable Web Analytics (the code is already in the site).

## 4. Device check (PLAN 9)
| Device | Check |
| --- | --- |
| Windows laptop, Chrome + Edge | 3D at High, 2D, audio across pages, chat |
| MacBook, Safari + Chrome | 3D, 2D |
| iPhone (new and ~4 years old), Safari | choice screen → 2D; 3D at Low |
| Android mid-range, Chrome | choice screen → 2D; 3D at Low |
| Classroom projector PC | 3D at 1080p, driver's view, 360° turn |

## 5. Class day
- [ ] Print or project the QR codes in `docs/qr/` (`site.svg` for everyone; one per island to split the room). Regenerate with `npm run qr` if the URL changes.
- [ ] Visit every page once before class (warms the caches).
- [ ] Check `/api/health` shows `"classMode": false` (or that pre-written answers are ready if it is true).
- [ ] Screen-record a 2-minute run-through as a backup in case the Wi-Fi fails.
- [ ] Projector: drive the islands; phones: reading mode.

## 6. After class
- [ ] Vercel Analytics: which islands and buildings got attention (evidence for the reflection).
- [ ] Keep the site live until grades are out; then set `AI_DISABLED=1` in Vercel to stop live AI.
