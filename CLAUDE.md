# The Evolution of AI Perception

WRI-101 adaptation project (American University of Sharjah): an explorable 3D world of three islands + a 2D long-read + a persistent audio player + a grounded AI chatbot, all fed from `content/`.

- Build plan: `PLAN.md`. **`docs/VISION.md` overrides `PLAN.md` wherever they differ** (islands instead of one road, Late Checkout studio look, AUS mini campus, insight markers).
- Next.js rules: @AGENTS.md (this Next version differs from training data; read `node_modules/next/dist/docs/` before using an API).

## Stack (pinned, checked 17 Nov 2026)
Next 16.4.6 (App Router, Turbopack, Cache Components) · React 19.3 · Tailwind 4.3 (`@theme` tokens in `app/globals.css`) · Zod 4.6.7 · tsx.
Later phases: three 0.187 · @react-three/fiber 9.8 · drei 10.7 · @react-three/rapier 2.2 · ecctrl 2.0 · ai 7 + @ai-sdk/react 4 · zustand 5.1 · motion 14 · @upstash/ratelimit 2.2 + @upstash/redis 1.41. Verify with `npm view` before installing.

## Commands
- `npm run dev`: local dev server
- `npm run build`: production build (runs `check-content` first; `CONTENT_STRICT=1` makes leftover placeholders fail the build)
- `npm run verify`: typecheck + lint + check-content. **Run before saying any task is done.**
- `npm run check-content`: validate `content/` and list every `TODO:` placeholder
- `npm run test:e2e`: Playwright: axe accessibility on every route, audio across routes, screenshots at 375/1440 into `screenshots/`
- `npm run format`: Prettier (print width 120)

## Hard rules
- All copy, numbers, people, dates and quotes come from `content/`. Never invent facts, statistics or quotes. Missing content → a `TODO:` placeholder, rendered with `<ContentText>` (hatched box).
- Three font families only: Fustat (display), Inter Tight (text/UI), JetBrains Mono (labels). Colours only from theme tokens; z-index only from the `z-*` scale in `globals.css`.
- Mono uppercase labels are for column/table headers only, not stacked above every heading.
- Do not subscribe the R3F `<Canvas>` root to the store; player position goes through the transient channel (PLAN.md 5.2).
- Every chart gets a table twin and a source line. Every image, model and track gets a credit entry. Every insight has a source or `groupCommentary: true`.
- Real people: faceless low-poly figures + licensed photo billboards only. No 3D face likenesses. No real-person impersonation in chatbot personas. No Apple/Siri logos or UI recreations.
- Match Late Checkout's *style*; never copy its logo, copy, illustrations or code.
- Content arrives over time: every content slot must render a graceful "coming soon" state, and adding content must never need a code change.
- Before calling a task done: `npm run verify`, then `npm run test:e2e` (screenshots at 375 px and 1440 px).
