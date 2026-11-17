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
