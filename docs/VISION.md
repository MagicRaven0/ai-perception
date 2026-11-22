# Vision decisions (override PLAN.md)

Agreed with the group on 17 Nov 2026. Deadline: about 1 Dec 2026. Where this file and `PLAN.md` disagree, this file wins.

## World
- **Three separate islands** joined by bridges or portals, not one continuous road: **The Past** (1950s), **The Jobs Era** (1984–2011, looks like modern times), **The Future** (2020s and next).
- **Camera and look: isometric, like latecheckout.studio.** Their homepage is an illustrated isometric town in WebGL: cream roads `#FBFAF6` with a soft curb edge, deep green ground `#267A60`, lime and yellow-green trees, pastel buildings, a little car on the road, sky gradient (`#9EE3EA` → `#E2E2EE`) on the loader, white pill navigation, and a round logo button. We use an orthographic, high-angle camera that follows the car, flat colours and soft shadows. Bruno Simon supplies the driving, physics and interaction.
- **Movement:** Bruno-style car. Buildings open when you are close (press E or tap). No auto-open.
- **Vibe:** lo-fi background music per island, golden-hour light, slow and floaty camera, ambient sounds (wind, birds, mainframe hum, city hum), mute always available.

## Content per island
- **The Past:** John McCarthy, who coined "artificial intelligence"; the 1956 Dartmouth workshop. Content spread over several buildings.
- **The Jobs Era:** Steve Jobs, personal computing, friendly interfaces, through to Siri (2011).
- **The Future:** Yoshua Bengio (public sources only, cited), today's polls (trust vs fear), an **AUS mini campus** in the centre (full campus, simplified, with the AUS name and logo; online photos used only as modelling reference), our local expert **Professor Aqeel** (recorded interview; get a written OK for public name/photo/audio), and the **chatbot guide character**.

## Buildings by content type
| Type | Building |
| --- | --- |
| Podcast | Podcast studio |
| Interview | Interview booth |
| Documents | Archive |
| Research | Lab |
| Video | Cinema (unlisted YouTube embeds) |
| Animation | Gallery |
| Experience | Arcade: small interactive scenes |

If time runs short: **more buildings, kept simpler**, rather than fewer polished ones.

## Insight markers (benefit / risk / danger)
From the group's previous project. Small signposts around and inside buildings on every island, each with one quick point and a colour tag, so the world never feels empty. They also appear in 2D, and the chatbot knows them. Data: `content/insights.ts`.

## People
Faceless low-poly figures + photo billboards (licensed, credited). No 3D face likenesses.

## AI
- Chatbot: an in-world guide character **and** a chat panel available everywhere (including 2D).
- 3 personas (1956 Workshop Researcher, 2026 Data Analyst, Project Research Guide), all also grounded in Professor Aqeel's material.
- Summaries pre-generated and checked by the group.

## Other
- Keep the full **2D reading mode** (phones, grading, accessibility, fallback).
- Thesis: placeholder until the group finalises it (`content/site.ts`).
- Team of 3; one member owns every account (GitHub, Vercel, AI Gateway, Upstash).
- **Load timeout: 20 s** (overrides PLAN 6.6's 10 s, because the 3D download on shared class Wi-Fi can exceed 10 s). Code: `LOAD_TIMEOUT_MS` in `lib/three/capabilities.ts`.
- **Touch interact button** (overrides PLAN 6.5): there is no separate round interact button. The interact prompt's own "Tap to open / Tap to talk" button is the touch interact button (at least 44 px tall), shown only when there is something to open; the joystick (bottom-left) and Boost (bottom-right) stay below it.

## Added features (requested 17 Nov 2026, not built yet)

### Dark mode (build at the start of Phase 2)
- A light/dark toggle in the top nav, defaulting to the visitor's system setting, remembered per browser.
- Dark palette from the same tokens: night `#141414` background, cream text, era colours kept as fills. Every text/background pair rechecked for WCAG AA, and the chart palette re-validated on the dark surface.
- Covers 2D pages, the audio dock and the chat panel. The 3D world keeps its own lighting per island, with the HUD panels following the theme.
- Do it before Phase 2 adds more components, so every new component is built with both themes from the start.

### Custom cursor (build in Phase 4 polish, after the 3D world)
- A small round cursor in the site's own style (Late Checkout studio feel): it grows over links and buttons, shows a "drag" state on sliders, and a "drive / open" hint over buildings in 3D.
- Desktop pointer devices only. Phones and tablets keep normal touch.
- Accessibility: the real system cursor stays available (the custom one follows it, never replaces text selection or input carets), and the effect turns off with `prefers-reduced-motion` and in high-contrast/forced-colours mode.
- Purely decorative, so it never blocks clicks.

## Built after Phase 3 (21 Nov 2026)
- **Era car:** the car morphs (~1.2 s) when you cross onto an island: 1950s sedan with chrome bumpers and fins (The Past), boxy hatchback with a pink bonnet stripe (The Jobs Era), low electric pod with a lime glow strip and thin wheels (The Future). Same collider in every era; top speed x0.85 / x1 / x1.15. Reduced motion: instant swap. Code: `components/three/car/EraCar.tsx`, colours in `lib/three/palette.ts` (`CAR_COLOURS`).
- **Driver's view:** HUD eye button or V. Perspective camera in the driver's seat; drag to look around, eases back to straight ahead; closer fog in this view. Not remembered between visits.
- **Runways and planes:** each island has a runway jutting off its edge (The Past: west, The Jobs Era: south, The Future: east). Drive off the open end and the car becomes the era's plane: a 1940s propeller plane, a twin-tail jet fighter, or a flying car with glowing hover rotors (generic shapes, no real markings). W / ▲ climb, S / ▼ dive, A D / ◀ ▶ turn, Shift boost; it keeps a safe height and turns back at the world's edge. L or the Land button lands on the nearest runway as a car.
- **Folding HUD:** the extra top-bar buttons (map, driver's view, time of day, options, controls, sound) fold behind a ⋯ button; the choice is remembered.

## Added 22 Nov 2026 (requested by Rayyan, not built yet)

### Reference library on every island
- Each island gets one extra **"References" building** (an archive/library look), placed automatically like the other buildings. It is not an entry in `content/buildings.ts`: it is generated from content, so it never needs manual upkeep.
- Its drawer lists the APA references **relevant to that island**: every source cited by that island's buildings, insights, datasets, comparisons and era text, plus sources whose `eraIds` include the island. Sorted alphabetically, each with its clickable link, and "coming soon" for `TODO:` entries.
- In 2D, each era page ends with the same "References for this era" list. The full `/sources` page stays.
- Counts toward island capacity (current use: 5 / 5 / 6 of 17 / 13 / 17, so there is room).

### NPC figures to make the world feel lived-in
- Several **generic, faceless low-poly people** per island who stand around (idle sway, occasional head turn or wave, maybe a slow stroll on a short loop path). They are not real people and carry no names or text.
- Era-appropriate outfits and props from `lib/three/palette.ts`, e.g. lab coats and clipboards on The Past, casual 1980s–2000s clothes and phones on The Jobs Era, students with laptops near the AUS mini campus on The Future.
- About 6–10 per island. Placed on plazas, near building entrances and along the ring road edges, never on the road or blocking a building's interact zone. No physics collisions needed (or a small static collider so the car can't drive through them).
- Performance: share one figure mesh with instancing or merged geometry; animations are cheap vertex/transform tweens, paused when off-screen and frozen under `prefers-reduced-motion`. Low-quality tier halves the count.
- Kept visually distinct from the anchor figures (McCarthy, Jobs, Bengio, Aqeel), which keep their billboards and labels.

### Free-look camera while zoomed out
- Today the camera is a fixed high-angle follow cam. Add **free look**: the visitor can rotate all the way around the car, tilt between high-angle and lower views, zoom out further, and pan away from the car to look anywhere on the island, then snap back.
- Desktop: right-drag (or left-drag on empty ground) to orbit, wheel to zoom, Shift+drag or middle-drag to pan; a **Recenter** button (and key C) eases back behind the car. Driving again also eases back after a short delay.
- Touch: one finger drives (joystick); two-finger drag orbits, pinch zooms, two-finger pan pans; a Recenter button.
- Limits: never below the ground or inside buildings; max zoom-out shows the whole island. The minimap shows the camera's view direction.
- Reduced motion: no easing, instant snaps. The driver's view (V) stays as it is.
