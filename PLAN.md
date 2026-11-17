# The Evolution of AI Perception: Architecture and Rollout Plan

WRI-101 Adaptation Project. Plan for Claude Code. **No code in this document.**
Research date: 17 Nov 2026. Re-check package versions at kickoff (Phase 0).

How to use this file: put it in the repo root as `PLAN.md`, next to a short `CLAUDE.md` (Section 10). Run Claude Code one phase at a time, in plan mode first, and approve each phase plan before it writes code.

---

## 0. What the research found (read this first)

### 0.1 Mentor sites, measured

| Mentor | What it actually looks like (measured Nov 2026) | What we borrow |
| --- | --- | --- |
| **Bruno Simon** (bruno-simon.com) | Drivable low-poly world. Three.js with TSL so it runs on WebGPU and falls back to WebGL (the options panel tells you which renderer you got). Rapier physics, Howler audio. Fonts: Nunito (UI) and Amatic SC (display). Accents: pink `#FF87A2`, lime `#D5FF95`, square corners. Small round icon buttons over the canvas: map, home, options, controls, achievements, audio. Options panel has Audio, Quality (High/Low), **"I'm stuck!" respawn**, Reset. A controls panel lists keys for mouse/keyboard, touch (one finger drives, two fingers camera, tap car to jump) and gamepad. Source is MIT on GitHub (`brunosimon/folio-2025`); assets are compressed with glTF-Transform and KTX2 (ETC1S), UI images converted to WebP; the game loop runs in ordered stages (physics before render). | Drive-to-discover navigation, proximity "interact" points, respawn button, quality toggle, controls panel per input type, map, renderer/quality honesty, asset compression pipeline. |
| **Late Checkout** (latecheckout.studio) | The studio page was in maintenance during research (blank cream page `#FBFAF6`, purple `#5E489B`, orange `#EEA132`, cloud loader). Its live sibling **latecheckout.agency (LCA)** carries the editorial look the blueprint describes, so values below are from LCA. White page, ink `#121211`, muted text `#66655F`. Headline font Suisse Intl (paid), 30 px at narrow width, tight tracking (about -0.03em), weight 400. Body 18 px / 1.5, muted grey. **Section labels and table headers in Suisse Intl Mono, 12 px, uppercase, about 0.1em tracking.** 1 px solid ink rules separate rows. Content in two-column "table" rows (TITLE / ENGAGEMENT). Belief statements as short H3s (21 px, weight 500) with a paragraph under each. A serif (Exposure) appears as an accent. | Editorial grid, 1 px rules, mono column headers, generous white space, one confident headline per screen, "belief statement + paragraph" rhythm. |
| **Ceros** (ceros.com) | Dark page `#141414`, white text. Display font **Fustat** (free on Google Fonts) at about 100 px for H1, 56 px H2. Body **Source Sans 3** 16 px. Primary blue `#33AAFF`. White pill buttons (radius 35 px), inputs radius 4 px. Content is scroll-driven reveals, hover/click states, animated stat cards ("16% higher deal win rate"), tabbed proof sections, a timeline component with named animation tracks. | Dark data bands, huge numerals, animated stat cards, tabbed comparisons, scroll-triggered reveals, before/after slider. |

### 0.2 Stack facts that change the plan

- **Next.js 16** is current (16.4.x as of Oct 2026). Turbopack is the default bundler. Next 16.3 made AI coding agents read docs matching the project's Next version, which helps Claude Code.
- **React Three Fiber v9 pairs with React 19.** v10 (WebGPU support) is still alpha/canary. **Use v9 + WebGL2.** Do not chase WebGPU for a class deadline.
- **@react-three/rapier v2** is the line for R3F v9 / React 19.
- **ecctrl v2** (pmndrs) now ships character, **vehicle** and drone controllers plus `Joystick` and `VirtualButton` touch inputs. It needs three 0.184+, R3F 9.4+, rapier 2.2+. This gives us a Bruno-style vehicle and the mobile joystick without writing a controller from scratch.
- **AI SDK 7** shipped 25 June 2026 (v6 code needs the codemod). Use v7 from day one.
- **Vercel AI Gateway:** every Vercel account gets **$5 of free credits every 30 days** after the first request; zero markup; one model string switches provider.
- **Gemini free tier was cut hard in 2026** (single-digit RPM, about 100 requests/day on Flash for free users per trackers, and free-tier prompts may be used to train Google models). Not safe for 25 students chatting at once.
- **Vercel Hobby:** free, non-commercial only (a class project qualifies). About 100 GB transfer, 1M function invocations, 4 h active CPU per month; function max duration 300 s. Over the limit, the feature stops until the 30 days reset (no surprise bill).
- **Hobby blocks deploys from private repos with collaborators** ("The Hobby Plan does not support collaboration for private repositories"). **Use a public GitHub repo** owned by the person who owns the Vercel project. Keys live in Vercel env vars, never in the repo.
- **Upstash Redis free tier:** 256 MB, 500K commands/month. Plenty for rate limiting and a class poll.

### 0.3 Class rules that shape the build (from the WRI-101 materials)

- Rhetorical analysis vocabulary the class uses (Handout 12.1): author, audience, purpose, context, genre, content and form. The site's About page and the reflection should use these exact headings (Section 1.3).
- Professor's feedback on the infographic: short "punchy" text and bland colours read as AI-generated; content felt simplified; visuals should show the topic and how to feel about it at a glance. So: **real paragraphs in 2D mode, era colours with character, no generic neon "AI" look.**
- Design rules from lecture: no more than **3 font families**, small coherent palette, white space, consistent headings, the most important element is the biggest.
- Every image needs a credit; AI-generated images must say so and name the tool. Works cited links must be clickable.
- In the research essay all evidence had to come from the source library. **Ask the professor** whether the adaptation may add sources (polls, interviews). The chatbot is locked to whatever the corpus contains either way.
- The professor now encourages AI use. The site should still disclose every AI feature.

---

## 1. Rhetorical strategy

### 1.1 Argument in one line
`[THESIS PLACEHOLDER]`: lives in `content/site.ts`, rendered as the landing hero, the 2D intro, the chatbot's base prompt and the About page. One edit updates all four.

### 1.2 Why this genre fits the argument
The topic is how people's *perception* of AI changed. The site makes the visitor perceive AI three ways while reading about it:
1. **Era 1** is about AI as a distant, room-sized idea. The 3D zone is big, slow and imposing; the visitor is small.
2. **Era 2** is about interfaces making computers feel personal. The zone is human-scale and friendly; the interface (HUD) itself becomes the subject.
3. **Era 3** is about mass adoption with mixed trust. The visitor *uses* live AI (chatbot, summarizer) and sees a label saying how much to trust it.

So the form (spatial, interactive, AI-powered) is evidence for the content. That sentence is the core of the reflection.

### 1.3 Rhetorical situation map (Handout 12.1 headings)

| Element | Our answer |
| --- | --- |
| Author | Student group; credibility from cited sources, recorded interviews, transparent AI labels. |
| Audience | Classmates and professor first (on phones and laptops, in class), then curious web visitors. Know AI tools personally, know little history. |
| Purpose | Show that public perception of AI followed interfaces and evidence, not just capability (adjust to thesis). Visitors leave able to compare 1956 predictions with present data. |
| Context | Late 2026, AI everywhere, polarised trust. Viewed in a classroom on shared Wi-Fi, often on phones. |
| Genre | Hybrid: explorable 3D world + editorial long-read + data story + podcast. |
| Content and form | Era-specific materials and colour; short drawer text in 3D linked to full paragraphs in 2D; numbers as animated stat cards with sources under each. |

### 1.4 Mentor-text moves, mapped

| Move | From | Where it appears |
| --- | --- | --- |
| Discover by moving, not scrolling | Bruno | 3D world, checkpoint beacons |
| Credibility through restraint (rules, mono labels, white space) | LCA | 2D mode, sources page, drawers |
| Numbers you can feel (huge numerals, sliders, before/after) | Ceros | Era 3 data band, 1956 vs now comparison |
| Honesty about the machine (renderer and quality shown to user) | Bruno | Quality toggle, AI labels, "checked by our group" badges |

---

## 2. Visual system ("same style as the websites")

### 2.1 Three registers, one system
- **Paper register (LCA)** for reading: 2D mode, sources, about, all drawers.
- **Dark data register (Ceros)** for statistics: full-width `#141414` bands inside 2D mode, stat cards, charts.
- **Playful HUD register (Bruno)** for the 3D overlay: round icon buttons, square-cornered panels, bright accent fills.

### 2.2 Fonts (3 families, all free; meets the class rule)
| Role | Font | Stands in for |
| --- | --- | --- |
| Display (hero, era titles, big numbers) | **Fustat** | Ceros display (it *is* Ceros's font) |
| Text and UI | **Inter Tight** (or Geist) | Suisse Intl (LCA body/headlines) |
| Labels, table headers, data, terminals in 3D | **JetBrains Mono** (or IBM Plex Mono) | Suisse Intl Mono (LCA labels) |

Load with `next/font` (self-hosted, no layout shift). No fourth font, not even in 3D textures.

### 2.3 Colour
| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#FFFFFF` | Page background (LCA) |
| `paper-warm` | `#FBFAF6` | Alternate sections (Late Checkout studio cream) |
| `ink` | `#121211` | Text and 1 px rules (LCA) |
| `muted` | `#66655F` | Secondary text (LCA) |
| `night` | `#141414` | Data bands, HUD panels (Ceros) |
| `signal-blue` | `#33AAFF` | Links on dark, chart highlight (Ceros) |
| Era 1 | manila `#E8D9B0`, phosphor `#3BD16F` | Punch cards, terminal glow |
| Era 2 | platinum `#D8D2C4`, pink `#FF87A2` | Beige-box era, Bruno pink as warmth |
| Era 3 | night `#141414`, lime `#D5FF95` | Data city, Bruno lime as glow |

Contrast rule: lime, pink and phosphor are **fills only** on light backgrounds; text on them is `ink`. Check every pair at WCAG AA.

### 2.4 Type and layout rules (LCA-derived)
- 12-column grid, max width about 1280 px, outer margin 24 px mobile / 48 px desktop.
- Headline tracking about -0.03em, weight 400 to 500 (LCA does not shout with bold).
- Mono labels are **column headers and table headers only**, the way LCA uses them. Do not stack a small uppercase label above every heading (that reads as AI-template).
- Rows separated by 1 px ink rules; no card shadows; radius 0 to 4 px except Ceros-style pill buttons (radius 999).
- Body copy 18 px / 1.5 in `muted`, paragraphs from the essay, not slogans.
- Plain headings ("1956: The Dartmouth proposal"), not clever full-sentence taglines.

### 2.5 Motion (Ceros-derived)
- Reveal on scroll: fade + 16 px rise, 400 ms, once. Numbers count up once when visible.
- Before/after slider and tab switches animate at 250 ms.
- `prefers-reduced-motion`: no count-ups, no camera swoops, instant transitions.

### 2.6 IP and image guardrails
- No Apple logo, no Macintosh icon recreations, no Siri logo or UI copies. Era 2 uses generic beige-box geometry and a generic voice waveform.
- Photos of real people (McCarthy, Jobs) only from licensed sources (Wikimedia Commons with the exact licence and credit line) and listed on the Credits page.
- Low-poly models: made in Blender or CC0 packs (Kenney, Quaternius); CC-BY models get a credit line.

---

## 3. Repository and directory blueprint

```
ai-perception/
├─ CLAUDE.md                    Rules for Claude Code (Section 10)
├─ PLAN.md                      This file
├─ README.md                    How teammates add content without coding
├─ .env.example                 Names of every env var, no values
├─ next.config.ts               transpilePackages: three; image + header config
├─ app/
│  ├─ layout.tsx                Root: fonts, providers, TopNav, ModeToggle, AudioDock, ChatDrawer, SkipLink.
│  │                            Persistent across routes, which is what keeps audio playing between modes.
│  ├─ page.tsx                  Landing: thesis hero + "Explore in 3D" / "Read in 2D" choice + device check
│  ├─ explore/page.tsx          3D route. Dynamically imports the canvas (no SSR). Reads ?cp= and ?era= deep links
│  ├─ read/page.tsx             2D long-read: all eras in order (the grading view)
│  ├─ read/[era]/page.tsx       Single-era page for deep links and QR codes
│  ├─ listen/page.tsx           Episode list with era filters
│  ├─ listen/[episode]/page.tsx Episode page: chapters + full synced transcript
│  ├─ sources/page.tsx          APA references with links, grouped by era
│  ├─ about/page.tsx            Rhetorical statement (Section 1.3 table), team, AI disclosure, image/model/audio credits
│  ├─ api/chat/route.ts         Streaming grounded chatbot (Section 7)
│  ├─ api/summarize/route.ts    Live fallback summarizer; serves cached results first
│  ├─ api/health/route.ts       Returns AI budget state for "class mode" banner
│  ├─ opengraph-image.tsx       Share card for the class link
│  └─ globals.css               Tailwind v4 theme tokens (colours, fonts, z-index scale)
├─ components/
│  ├─ ui/                       Button, PillButton, Rule, MonoLabel, Drawer, BottomSheet, Toast, IconButton
│  ├─ layout/                   TopNav, ModeToggle, SkipLink, Footer, ClassModeBanner
│  ├─ editorial/                EraSection, EraHeader, PeopleTable (LCA table rows), BeliefRow, SourceNote, ImageWithCredit
│  ├─ data/                     StatCard, BeforeAfterSlider, SentimentSlider, BarChart, LineChart, DataTable (accessible twin of every chart)
│  ├─ audio/                    AudioDock, MiniPlayer, TranscriptView, ChapterList, EpisodeCard
│  ├─ ai/                       ChatDrawer, PersonaSwitcher, MessageList, CitationChip, SuggestedQuestions, SummarizerChips, SummaryPanel, AiLabel
│  ├─ three/                    Experience (Canvas root), World, Ground, Road, Lighting, Fog, Vehicle, CameraRig,
│  │  │                         CheckpointBeacon, ZoneSensor, WorldBounds, PerformanceGate
│  │  └─ zones/                 Zone1950s, Zone1980s2011, Zone2020s, Transition gates (each lazy-loaded)
│  └─ hud/                      Minimap, FastTravelBar, InteractPrompt, CheckpointDrawer, MobileControls,
│                               OptionsPanel (quality, audio, "I'm stuck"), ControlsPanel, ProgressCounter
├─ content/                     SINGLE SOURCE OF TRUTH. Both modes and the AI read only from here.
│  ├─ site.ts                   Title, thesis, team, course, AI disclosure text
│  ├─ eras.ts                   3 eras (schema 4.1)
│  ├─ checkpoints.ts            All checkpoints (schema 4.2)
│  ├─ comparisons.ts            Comparison cards (4.3)
│  ├─ datasets/*.json           One file per survey/stat set (4.4)
│  ├─ episodes/*.json           Episode metadata (4.5)
│  ├─ transcripts/*.vtt         WebVTT transcripts + chapter tracks
│  ├─ corpus/essay.md           The adapted essay, split by headings
│  ├─ corpus/sources/*.md       Source notes in the group's own words
│  ├─ sources.ts                APA citations + URLs (4.6)
│  ├─ credits.ts                Images, models, music, fonts with licence
│  └─ generated/summaries.json  Pre-generated summaries, reviewed by the group (7.6)
├─ lib/
│  ├─ content/                  Zod schemas, loaders, cross-reference checks, placeholder detector
│  ├─ store/                    Zustand store, slices, selectors, transient player channel (Section 5)
│  ├─ audio/engine.ts           One HTMLAudioElement for the whole app + Media Session (lock-screen controls)
│  ├─ ai/                       models.ts, corpus-index.ts (chunks with IDs), prompts/base.ts, prompts/personas.ts,
│  │                            prompts/summarize.ts, citations.ts (validate cited IDs), ratelimit.ts, visitor-id.ts, budget.ts
│  ├─ three/                    capabilities.ts (WebGL2, memory, touch, reduced motion), quality.ts (tiers), layout.ts (zone coordinates)
│  └─ analytics.ts              Thin wrapper over Vercel Web Analytics custom events
├─ public/
│  ├─ models/*.glb              Compressed (Meshopt or Draco)
│  ├─ textures/*.ktx2           Compressed palette and decal textures
│  ├─ audio/*.mp3               Episodes (or Vercel Blob URLs if over ~100 MB total)
│  └─ images/                   WebP/AVIF images
├─ scripts/
│  ├─ check-content             Validates schemas, links, IDs, lists every remaining placeholder
│  ├─ gen-summaries             Calls the model once per summarizable item, writes generated/summaries.json for review
│  ├─ compress-assets           glTF-Transform + KTX2 + WebP (Bruno's pipeline)
│  └─ transcribe                Optional: Whisper locally → VTT
└─ tests/
   ├─ unit/                     Schemas, citation validator, rate-limit keys, prompt assembly
   └─ e2e/                      Playwright: mode switch keeps audio, deep links, chat 429 path, axe accessibility on 2D
```

---

## 4. Data and content schema

All content is typed with Zod and checked at build. IDs are stable kebab-case strings. **Placeholders use the literal prefix `TODO:`**; `check-content` lists them, warns in dev, and fails a production build.

### 4.1 Era
| Field | Type | Notes |
| --- | --- | --- |
| id | `era-1` / `era-2` / `era-3` | |
| slug, number, title | string, 1–3, string | "Origins and academic optimism" |
| years | {start, end \| "present"} | |
| anchorFigures | {name, role, imageId?}[] | |
| perceptionSummary | markdown | 2–3 real paragraphs from the essay (`TODO:` until supplied) |
| thesisLink | markdown | One paragraph: how this era supports the thesis |
| palette | {base, accent, ink} | From 2.3 |
| zone | {center [x,z], size [w,d], spawn [x,y,z], spawnYaw} | 3D placement (Section 6.1) |
| checkpointIds, comparisonIds, datasetIds, episodeIds, sourceIds | string[] | Cross-checked |

### 4.2 Checkpoint
| Field | Type | Notes |
| --- | --- | --- |
| id, eraId, order | string, ref, number | Order also drives 2D section order |
| title | string | Plain heading |
| short | markdown, ≤ 60 words | Shown in the 3D drawer |
| long | markdown | Shown in 2D mode and "Read more" |
| media | {imageId?, episodeId?, startAt?} | Can jump audio to a timestamp |
| position, radius | [x,y,z], metres | Sensor placement |
| landmark | model key | Which low-poly prop marks it |
| sourceIds | string[] | Required unless marked as group commentary |
| summarizable | boolean | Gets the 3 summary chips |

### 4.3 ComparisonCard
| Field | Type |
| --- | --- |
| id, kind | `prediction-vs-reality` \| `then-vs-now` |
| left / right | {label, year, statement, sourceId, imageId?} |
| takeaway | markdown, one or two sentences |
| eraIds | string[] |

### 4.4 StatisticalDataset
| Field | Type | Notes |
| --- | --- | --- |
| id, title | string | |
| questionWording | string | Exact survey question, for honesty |
| population, sampleSize, fieldDates | string, number, string | Shown under the chart |
| unit, chartType | `%`… , `bar` \| `line` \| `stat` \| `diverging` | |
| series | {label, points: {x, y}[]}[] | |
| sourceId | ref | Required |
| status | `placeholder` \| `verified` | Placeholder charts render a hatched "Data coming" state, never fake numbers |

### 4.5 AudioEpisode and transcript
| Field | Type | Notes |
| --- | --- | --- |
| id, title, kind | string, `podcast` \| `interview` | |
| eraIds | string[] | Era tags |
| speakers | {name, role, consentConfirmed: boolean}[] | Interview consent is required before publishing |
| src, durationSec | URL, number | MP3, 64–96 kbps mono for speech |
| chapters | {t, title, eraId?}[] | Also exported as a VTT chapters track |
| transcriptSrc | URL to .vtt | Cues drive click-to-seek and live highlight |
| summarizable | boolean | |

### 4.6 Research corpus (what the AI may know)
| Object | Fields |
| --- | --- |
| Source | id, apa (full APA 7 string), url, author, year, type, accessed |
| CorpusDoc | id, kind (`essay` \| `source-note` \| `transcript` \| `dataset-note`), title, eraIds, sourceIds, markdown |
| Chunk (built at build time) | id `C001…`, docId, eraId, heading, text (~150–300 words), sourceIds |

Relationships: Era → Checkpoints/Comparisons/Datasets/Episodes (one-to-many by ID). Everything with a fact → Source. Chunks are derived; never edited by hand.

---

## 5. Global state and synchronisation (Zustand 5)

### 5.1 Store slices
| Slice | State | Persisted? |
| --- | --- | --- |
| ui | `viewMode` ('3d' \| '2d'), `chatOpen`, `optionsOpen`, `quality` ('high' \| 'low' \| 'auto') | viewMode + quality in localStorage |
| era | `activeEra`, `visitedCheckpoints` (Set), `nearbyCheckpoint` | visited in localStorage (progress counter, "3 / 14 found") |
| checkpoint | `activeCheckpointModal` (id \| null) | URL `?cp=` mirrors it, so links are shareable |
| player | `spawnRequest` (era or checkpoint to teleport to), last saved position | position saved every 2 s to sessionStorage |
| audio | `episodeId`, `status`, `currentTime` (throttled 4/s), `duration`, `rate`, `volume` | episode + time in localStorage |
| chat | `persona`, `messagesByPersona`, `budgetState` | sessionStorage only |

### 5.2 Rules that keep the canvas from re-rendering
1. **The `<Canvas>` root subscribes to nothing.** Each 3D component selects the one primitive it needs with a selector.
2. **Player coordinates never go through React state.** The vehicle writes position into a plain mutable object (the "transient channel") every frame. The minimap reads it in its own `requestAnimationFrame` loop and moves an SVG dot by setting a transform directly. Zone and checkpoint changes come from physics sensor events, not from polling position.
3. **Sensor events write to the store only on change** (enter/leave), so a store update happens a few times per minute, not 60 times a second.
4. **Audio time lives in the audio engine,** not in React. The store mirrors it at 4 updates per second for the dock and transcript highlight; the 3D world never reads it.
5. **Mode switching:** the root layout keeps AudioDock and ChatDrawer mounted across `/explore` and `/read`, so audio and chat never reset. On desktop the 3D canvas stays mounted but hidden with `frameloop="never"` when in 2D, so returning is instant. On low-tier devices it unmounts and restores from the saved position.
6. **Two-way sync:** opening a checkpoint in 3D sets `activeEra`; scrolling an era into view in 2D also sets `activeEra`. Switching mode then lands you in the same era (2D scrolls to it; 3D teleports to its spawn).

### 5.3 Sync diagram
```
 Rapier sensors ──(enter/leave)──► store.era / store.checkpoint ──► HUD, drawer, URL ?cp=
 Vehicle (useFrame) ──► transient player object ──► Minimap (own rAF, direct DOM)
 Audio engine (HTMLAudioElement) ──(4 Hz)──► store.audio ──► AudioDock, TranscriptView
 2D IntersectionObserver ──► store.era.activeEra ──► TopNav era indicator, ModeToggle target
 ModeToggle ──► router push (/explore ⇄ /read) + store.ui.viewMode (layout persists)
```

---

## 6. 3D overworld and physics

### 6.1 World layout (metres, Y up, road runs along +X)
| Area | X range | Feel | Key landmarks (final list depends on essay content) |
| --- | --- | --- | --- |
| Start plaza | -30 to 0 | Calm, explains controls | Title sign, controls board, "Read in 2D instead" sign |
| Zone 1: 1950s lab | 0 to 110 | Oversized, cold, grey and manila | Giant mainframe cabinets, punch-card stacks, 1956 workshop "monument", chalkboard of predictions |
| Gate 1 | 110 to 130 | Road narrows, decade arch | Year markers along the road |
| Zone 2: design studio | 130 to 240 | Human-scale, warm platinum and pink | Desk-sized beige computers, giant mouse pointer, window-and-icon wall, voice-wave sculpture for 2011 |
| Gate 2 | 240 to 260 | Lights come on | |
| Zone 3: data city | 260 to 370 | Night, lime glow, dense | Polling "monoliths" whose heights are the real survey numbers, 1956 vs now comparison plaza, chatbot "terminal" |

Width about 80 m per zone, fences at the edges. 4–6 checkpoints per zone. A gentle S-curve road so the whole route is about 2–3 minutes of driving; fast travel skips it.

### 6.2 Movement and physics
- **Vehicle:** ecctrl `EcctrlVehicle` (or the character controller if a walking avatar is chosen). One low-poly rover, tinted per era.
- **Colliders:** ground and road as fixed cuboids/heightfield; landmarks as simple cuboid/convex hulls, never full trimesh for props.
- **Checkpoints:** sensor colliders (radius 4–6 m). On enter, the beacon brightens and an "Press E / Tap to open" prompt appears. **Do not auto-open drawers** (it blocks driving and annoys).
- **Zones:** large sensors set `activeEra`, crossfade fog and sky colour, switch background music if any.
- **Safety:** "I'm stuck" button (R key) respawns at last checkpoint; falling below Y = -10 respawns automatically.
- **Fast travel:** era buttons fade to black, set the rigid body position at the era spawn, fade back.

### 6.3 Camera rig
Third-person follow with smoothing (position lerp about 0.1, look-ahead along velocity). Drag (mouse) or two-finger drag (touch) orbits, released camera eases back. When a drawer opens, camera eases to a framing shot of the landmark; on close it returns. Reduced motion: hard cuts instead of eases.

### 6.4 Performance budget (target 60 fps on a school laptop, 30+ on mid phones)
| Budget | High tier | Low tier |
| --- | --- | --- |
| Triangles on screen | ≤ 150k | ≤ 60k |
| Draw calls | ≤ 120 (instancing for repeats) | ≤ 60 |
| Textures | One shared palette texture + a few KTX2 decals | Same |
| Shadows | One directional, small map, static bake where possible | Off (baked AO only) |
| Device pixel ratio | min(devicePixelRatio, 1.5), drops on slow frames | 1 |
| Post-processing | Light bloom in Zone 3 only | None |
| Total 3D download | ≤ 8 MB, zones lazy-loaded | Same |

Use drei `PerformanceMonitor` to drop tier automatically; show the current tier in Options (Bruno does this honestly). Compress with glTF-Transform (Meshopt) + KTX2, as in Bruno's repo.

### 6.5 Mobile controls
ecctrl `Joystick` bottom-left, `VirtualButton` (interact, boost) bottom-right, placed above the audio mini-bar. `touch-action: none` on the canvas only. Two-finger drag rotates camera (Bruno's scheme).

### 6.6 Automatic fallback to 2D
Check before loading any 3D code:
- No WebGL2, or `deviceMemory < 4`, or `prefers-reduced-motion`, or Save-Data on → land in 2D with a "Try 3D anyway" button.
- Phones default to 2D with a clear "Explore in 3D" button (classmates scanning a QR code should see content in 1 second).
- WebGL context lost → toast "3D stopped, switched to reading mode", keep audio playing.
- 3D chunk fails to load in 10 s → same fallback.

### 6.7 Accessibility in 3D
Skip link "Go to reading mode" is the first focusable element. Drawers are normal DOM (focus trapped, Escape closes, headings real). Everything in 3D exists in 2D, so screen-reader users lose nothing.

---

## 7. UI/UX wireframes and component hierarchy

### 7.1 Layer order (z-index tokens in the theme)
| z | Layer | Contents |
| --- | --- | --- |
| 0 | Canvas | 3D world |
| 10 | World labels | Floating signs (drei Html, used sparingly) |
| 20 | HUD | Minimap (top-right), fast-travel bar (top-centre), progress counter, interact prompt, mobile controls |
| 30 | Checkpoint drawer | Right panel on desktop (420 px), bottom sheet on mobile (70% height) |
| 40 | Chat drawer | Right panel 400 px, full-screen sheet on mobile |
| 50 | Audio dock | Bottom bar 72 px desktop / 56 px mini-bar mobile, always visible |
| 60 | Toasts, modals | Options, controls, class-mode banner |
| 70 | Skip link | |

When chat and checkpoint drawer are both open on desktop, the chat docks beside the drawer; on mobile only one sheet at a time.

### 7.2 Landing (above the fold)
```
┌──────────────────────────────────────────────────────────────┐
│ The Evolution of AI Perception        Read  Explore  Listen  │ ← TopNav, mode toggle pill
│──────────────────────────────────────────────────────────────│
│                                                              │
│  [THESIS, Fustat 64–96 px, ink on paper]                     │
│                                                              │
│  1956 ───────────── 19xx ───── 2011 ───────────── 2026        │ ← thin ink timeline, 3 era dots (years from eras.ts)
│                                                              │
│  ( Explore in 3D )   ( Read the long version )               │ ← pill buttons (Ceros)
│  WRI-101 · Group names · 6 min read / 10 min drive           │ ← muted
└──────────────────────────────────────────────────────────────┘
│ ▶ Episode 1 · 00:00 / 12:40 · Transcript · Era 1      ▢ Chat │ ← audio dock
```

### 7.3 2D long-read structure (per era)
1. **Era header** on era colour: huge year range in Fustat, plain title, anchor figures.
2. **Editorial block** (paper, LCA grid): 2–3 essay paragraphs in a 7-column measure, side column with source notes.
3. **People table** (LCA "counterparts" style): mono column headers FIGURE / ROLE / WHAT THEY EXPECTED, 1 px rules.
4. **Checkpoint sections** in order, each with summarizer chips (3-bullet, key stats, ELI12).
5. **Data band** (night `#141414`, Ceros): stat cards with count-up, chart, data table toggle, source line under every chart.
6. **Listen strip:** era episode clip with "Play from 03:12".
7. After Era 3: **1956 vs now** before/after slider, and the **optimism/fear slider** (visitor sets their own feeling, sees how polls compare).
8. Sources, credits, AI disclosure.

### 7.4 Ceros-style interactive mechanics
- **BeforeAfterSlider:** drag handle (and arrow keys) reveals 1956 prediction vs present reality; snaps at 0/50/100; text never hidden from screen readers.
- **SentimentSlider:** 0–100 "How do you feel about AI?" Visitor's own answer stays local (not stored) unless the optional class poll is on (Section 11).
- **StatCard:** big numeral (Fustat), one-line label, source in mono beneath. At most one giant stat per screen.
- **Charts:** custom SVG with d3-scale/d3-shape + Motion (lighter than Recharts and matches the look). Every chart has a "Show table" twin.

### 7.5 3D HUD (Bruno-style)
Round 44 px icon buttons, top-left: Home, Map, Options, Controls, Chat. Minimap top-right with era bands and found/unfound checkpoint dots. Fast-travel bar: three era pills. Options panel lists Quality (High/Low/Auto), Audio, "I'm stuck", Reset progress, current renderer/tier. Controls panel has tabs for keyboard, touch, gamepad (optional).

### 7.6 Responsive breakpoints
- `< 640` phone: 2D default, single column, bottom sheets, mini audio bar, HUD reduced to Map + Options + fast travel.
- `640–1024` tablet: two-column editorial, drawers as sheets.
- `> 1024` desktop: full grid, side drawers.

---

## 8. Grounded AI pipeline

### 8.1 Provider plan ($0 target)
- **Default:** AI SDK 7 through **Vercel AI Gateway** with a small, cheap, fast model (pick at kickoff from the Gateway list). The $5/30-day credit should cover a class session: with a corpus of a few thousand tokens per request and a short answer, each reply costs a fraction of a cent on small models, so $5 is on the order of a thousand-plus replies. Confirm with real token counts in Phase 2.
- **Backup:** the group's own DeepSeek key through the AI SDK provider, switched by one env var.
- **Not** Gemini free tier for live chat (limits too low for a class, and free-tier prompts may be used for training).

### 8.2 Grounding (no vector database needed)
The corpus is small (essay of about 1,000 words + source notes + transcripts). So:
1. At build time, split corpus into chunks with IDs (`C001`…), each tagged with era and source IDs.
2. Send the **whole chunk list** in the system prompt (context stuffing), filtered by persona era when useful. No embeddings, no retrieval errors.
3. Model must cite chunk IDs in square brackets after each factual sentence.
4. Server checks cited IDs exist; the UI turns them into CitationChips linking to the 2D section and APA source. **An answer with no valid citation shows a warning label** ("Not found in our research").
5. Temperature about 0.2, max output about 350 tokens, last 6 messages of history only.

### 8.3 Prompt layers
```
[Base rules]   You only know the CORPUS below. If the answer isn't in it, say so and suggest a related
               checkpoint. Never invent numbers, dates, quotes or names. Cite chunk IDs. Keep to 120 words
               unless asked for more. Thesis: {site.thesis}.
[Persona]      Voice + scope (below)
[Corpus]       <chunk id="C001" era="era-1" sources="s2">…</chunk> …
[Safety]       Decline off-topic tasks (homework for other classes, etc.) politely, in persona.
```

| Persona | Voice | Scope | Guardrail |
| --- | --- | --- | --- |
| **1956 Workshop Researcher** (fictional composite) | Formal, optimistic, curious; talks about logic, "thinking machines", mainframes | Era 1 chunks first | Labelled "AI roleplay, not a real person". Never speaks *as* McCarthy or quotes him beyond corpus quotes. Asked about later decades: reacts in character with surprise, then offers to hand over to the Data Analyst. |
| **2026 Data Analyst** | Precise, cautious, numbers-first, mentions sample size and question wording | Era 3 datasets and polls | Only numbers present in datasets; always gives source. |
| **Project Research Guide** | Friendly guide to the whole site | All chunks | Can point to checkpoints and episodes; explains thesis and how the site is built. |

### 8.4 Summarizer
| Mode | Output rules |
| --- | --- |
| 3-Bullet TL;DR | Exactly 3 bullets, ≤ 18 words each, only from the given text |
| Key Statistics | List every number in the text with what it measures and its source; "No statistics in this section" if none |
| Explain Like I'm 12 | ≤ 90 words, plain words, one everyday comparison, no new facts |

**Pre-generate all summaries at build time** (`gen-summaries`) for every summarizable item, store them in `content/generated/summaries.json`, and have the group read and fix them. The UI shows them instantly with an "AI-generated · checked by our group" label. The live `/api/summarize` route only runs for items without a cached summary, and caches its result. This costs about nothing, cannot fail during class, and is itself an argument: AI output became trustworthy here because humans checked it.

### 8.5 Rate limiting and abuse (class-aware)
Important: **on campus Wi-Fi the whole class shares one public IP.** Per-IP limits alone would lock everyone out after a few messages.
- Primary key: anonymous visitor ID (random, in an httpOnly cookie). Limit about 8 messages/min and 40/day per visitor.
- Secondary: loose per-IP limit (about 200/hour) to stop scripts.
- Global: daily request cap and a running spend estimate in Redis. Past 80% of budget, `/api/health` flips **class mode**: chat answers from Suggested Questions cache only, banner explains why.
- Input cap 500 characters; reject empty or repeated spam; strip HTML.
- Upstash Redis (free tier) via `@upstash/ratelimit`, sliding window.

### 8.6 Streaming and states
- `useChat` streams tokens; typing dots before first token; Stop button; Retry on error.
- 429 → friendly in-persona message + suggested questions (which have cached answers).
- Network/Gateway error → same fallback; never a blank bubble.
- Suggested questions per persona (4 each), with pre-generated answers, so the chatbot still demos well if the API is down on presentation day.

---

## 9. Phased roadmap with Definition of Done

Phase order follows the blueprint: 2D first (it is the grading view and the fallback), 3D last (highest risk).

### Phase 0: Setup (half a day)
- Create public GitHub repo (owned by the Vercel account holder), Vercel project, AI Gateway key, Upstash Redis from Vercel Marketplace.
- `create-next-app` with TypeScript, Tailwind, App Router. Verify versions with `npm view` and pin them. Install Vercel's Claude Code plugin.
- Add `CLAUDE.md`, `PLAN.md`, `.env.example`, content skeleton with `TODO:` placeholders, theme tokens, fonts.

**Done when:** an empty themed page deploys to a `*.vercel.app` URL from `main`; a teammate's PR to the public repo produces a preview deploy; `check-content` runs and lists placeholders.

### Phase 1: Data + 2D editorial + multimedia
- Zod schemas, loaders, cross-reference checks.
- Landing, `/read`, `/read/[era]`, `/sources`, `/about`, `/listen`, `/listen/[episode]`.
- Editorial components, data components with table twins, placeholder data state.
- Audio engine, AudioDock, transcripts with click-to-seek and live highlight, chapters, Media Session.
- Zustand store with ui/era/audio slices; mode toggle wired (3D route can be a stub).

**Done when:**
- All three eras render from `content/` only; changing the thesis in `site.ts` updates landing, 2D and About.
- Audio keeps playing while switching between every route.
- Clicking a transcript line seeks; the current line highlights within 0.3 s.
- Lighthouse on `/read` (mobile): Performance ≥ 90, Accessibility ≥ 95; axe finds no serious issues.
- Every chart has a table toggle and a source line. Three font families only.
- Looks right at 375 px, 768 px, 1440 px (Playwright screenshots attached to PR).

### Phase 2: AI chatbot + summarizer
- Corpus chunker, prompt layers, persona switcher, citation validation.
- `/api/chat` streaming with rate limits (visitor + IP + global), budget tracker, class mode.
- `gen-summaries` script + review flow; SummarizerChips reading cached summaries; live fallback route.

**Done when:**
- 20 test questions per persona (written by the group, including 5 that are *not* in the corpus): ≥ 18/20 correct with valid citations; all 5 off-corpus questions answered "not in our research".
- No invented numbers in 50 sampled answers (checked against datasets).
- Simulated 30 visitors from one IP can all chat; one visitor sending 10/min gets limited.
- Killing the API key shows the fallback, not an error.
- Token cost per reply measured and written in README; projected class-session cost < $2.

### Phase 3: 3D overworld + physics
- Capability gate and fallback; Canvas with frameloop control; road, zones (lazy), vehicle, camera rig.
- Sensors for checkpoints and zones; drawer integration; minimap via transient channel; fast travel; options and controls panels; mobile joystick.
- Asset compression pipeline.

**Done when:**
- 60 fps average on a mid laptop (Chrome performance panel) at High; ≥ 30 fps on a mid Android phone at Low.
- React DevTools Profiler shows the Canvas root does not re-render while driving.
- Every checkpoint is reachable, opens its drawer, and deep link `?cp=` teleports to it.
- WebGL forced off → lands in 2D with notice; context loss → switches to 2D, audio continues.
- Total 3D download ≤ 8 MB; first drivable frame ≤ 5 s on school Wi-Fi.

### Phase 4: Content injection + QA + class launch
- Drop in final thesis, essay paragraphs, datasets, MP3s, transcripts, images with credits; `check-content` returns zero `TODO:`.
- Review all generated summaries; finalise suggested-question answers.
- Device matrix test (below), dry run with 3–5 friends at once, then class launch (Section 12).

**Done when:** zero placeholders; every number has a source; every image, model and track has a credit; About page has the rhetorical table and AI disclosure; dry run passes with no blocking bugs.

### Device matrix
| Device | Browser | Mode |
| --- | --- | --- |
| Windows laptop | Chrome, Edge | 3D High, 2D |
| MacBook | Safari, Chrome | 3D, 2D |
| iPhone (recent and ~4 years old) | Safari | 2D default, 3D Low |
| Android mid-range | Chrome | 2D default, 3D Low |
| Projector (classroom PC) | whatever is installed | 3D at 1080p |

### Scope cut line (if time runs short)
Keep: 2D mode complete, audio, chatbot with one persona, pre-generated summaries.
Shrink: 3D to one fully detailed zone (the one tied to the thesis) + two simpler zones; drop gamepad, achievements, world labels.

---

## 10. Working with Claude Code

### 10.1 `CLAUDE.md` (keep it short)
Contents to write in Phase 0:
- Project one-liner and link to `PLAN.md`.
- Pinned versions and commands (dev, build, lint, typecheck, test, check-content, gen-summaries).
- Hard rules:
  - All copy, numbers, people, dates come from `content/`. Never invent facts, statistics or quotes. Missing content → `TODO:` placeholder.
  - Three fonts only; colours only from theme tokens; z-index only from the scale.
  - Do not subscribe the Canvas root to the store; player position goes through the transient channel.
  - Every chart gets a table twin and a source line. Every image gets a credit entry.
  - No Apple/Siri logos or UI recreations; no real-person impersonation in personas.
  - Before saying a task is done: typecheck, lint, unit tests, `check-content`, and Playwright screenshots at 375/1440.

### 10.2 Session pattern
1. One phase (or one sub-feature) per session. Start in plan mode: "Read PLAN.md Phase N and CLAUDE.md. Propose a step list. Don't code yet."
2. Approve, then let it build. Commit after each working step.
3. Use the installed Vercel plugin skills (Next.js, AI SDK, functions, deploy) and a frontend design skill for styling passes.
4. Use Playwright (via MCP or tests) to screenshot pages and compare against Section 2 rules.
5. Start a fresh session between phases so context stays clean.

### 10.3 Group workflow (non-coders included)
- Content edits happen in `content/` files through GitHub's web editor, as PRs. Claude Code or the repo owner merges.
- One person owns the Vercel and Gateway accounts; others never need keys.
- Transcripts: record episodes, then transcribe locally for free with Whisper (a laptop GPU handles this fast) and export VTT; or use the free tier of any speech-to-text service. Fix names by hand.

---

## 11. Optional creative add-ons (pitch, don't build unless the group picks one)

| Idea | What it is | Why it would land in class | Rough build time |
| --- | --- | --- | --- |
| **Live class poll** | Visitors answer "How do you feel about AI?" at the start and again at the end; a live chart shows the room's before/after next to the 1956 and 2026 data. Stored anonymously in Upstash. | Turns the audience into data that tests the thesis in real time. | 1 day |
| **Prediction time capsule** | Visitors leave a 30-character prediction for 2056 (like Bruno's "whispers"), shown on a wall in Zone 3, moderated by a word filter + approval. | Mirrors the 1956 predictions; fun to read aloud. | 1–1.5 days |
| **Narrated guided tour** | One button drives the vehicle along the road automatically while an episode plays and checkpoints open on its chapter marks. | Perfect for presenting on the projector without driving live. | 1 day |

---

## 12. From launch to "the whole class uses it"

### 12.1 Before class
- Short URL (e.g. `ai-perception.vercel.app`) and a QR code that opens `/?ref=class` (phones land in 2D with a big "Explore in 3D" button).
- Optional QR codes per era (`/read/era-2`) to split the room into groups.
- Set AI budget alert; check `/api/health`; warm caches by visiting every page once.
- Screen-record a 2-minute run-through as a backup if Wi-Fi fails.

### 12.2 During class
- Projector: desktop 3D with guided tour or live driving; students on phones in 2D.
- Expected load: about 30 visitors, mostly static CDN pages; 3D at about 8 MB each is about 240 MB total, far under Hobby limits. Chat is protected by per-visitor limits and class mode.

### 12.3 After class
- Vercel Web Analytics (free tier) shows which era and checkpoints got most attention; use it as evidence in the reflection.
- Keep the site live until grades are out; then lower the global AI cap to near zero or switch chat to cached-only.
- Rotate keys if the repo was ever shared with a key in history.

---

## 13. Open questions for the group (answer before Phase 1)
1. Which essay is being adapted, and what is the final thesis sentence? (The blueprint's three eras need a thesis that ties them together.)
2. Deadline and presentation date?
3. May the adaptation add new sources (polls, interviews), or only the essay's source library?
4. Vehicle (Bruno-style car) or walking avatar?
5. How many podcast episodes and interviews, and are consent confirmations collected?
6. Budget: strictly $0, or can someone cover a few dollars of AI credit as a safety net?
7. Who owns the GitHub repo and Vercel account?

---

## Sources
- Bruno Simon portfolio (live, inspected Nov 2026): https://bruno-simon.com/
- Bruno Simon, folio-2025 source and asset pipeline: https://github.com/brunosimon/folio-2025
- Late Checkout studio (maintenance page during research): https://www.latecheckout.studio/
- Late Checkout Agency (editorial style measured): https://www.latecheckout.agency/
- Ceros homepage (style measured): https://www.ceros.com/
- Next.js 16.3 release notes: https://nextjs.org/blog/next-16-3
- Next.js version history (16.4.1, Oct 2026): https://www.versio.io/de/product-release-end-of-life-eol-vercel-nextjs.html
- R3F installation (v9 pairs with React 19): https://r3f.docs.pmnd.rs/getting-started/installation
- ecctrl v2 README (vehicle + joystick, peer versions): https://cdn.jsdelivr.net/npm/ecctrl@2.0.0/README.md
- react-three-rapier docs (v2 for React 19): https://docsearch.algolia.com/mcp/docs/repo/pmndrs/react-three-rapier
- AI SDK 7 note: https://alexcloudstar.com/md/blog/ai-sdk-v6-developer-guide-2026/
- Vercel AI Gateway pricing ($5 per 30 days): https://docs.vercel.com/docs/ai-gateway/pricing
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Hobby private-repo collaboration block: https://community.vercel.com/t/title-deployment-blocked-on-hobby-plan-private-repo-from-cli/42775
- Upstash Redis pricing (500K commands free): https://upstash.com/docs/Redis/overall/pricing
- Gemini free-tier changes 2026: https://agentdeals.dev/gemini-api-pricing-changes
- WRI-101 materials: Handout 12.1 (rhetorical analysis), lecture notes (design and citation rules), professor feedback on infographic.
