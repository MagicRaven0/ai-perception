# Video and animation plans (CONTENT_PROMPTS Prompt 10)

**Update 23 Nov 2026:** three of the four are made, as 60-second looping animations with original synthesised music and no narration, each in its island's style: `public/videos/interface-gallery.mp4` (era 2), `public/videos/perceptron-cinema.mp4` (era 1, old paper and newsreel look, 1950s swing with a theremin), `public/videos/agents-cinema.mp4` (era 3, dark interface, electronic). They replace plans 1, 2 and 4 below. Only plan 3 (`voice-assistant-cinema`) is still open. The scripts that draw them are kept outside the repo by the project Claude.

22 Nov 2026. Four short pieces, one per cinema or gallery building. Each is 60–120 seconds, made on our own laptops (CapCut, Canva video, iMovie or DaVinci Resolve are all fine), uploaded to YouTube as **unlisted**, and the 11-character video id goes into `media.youtubeId` of the building in `content/buildings.ts`.

Rules for all four:
- Narration is recorded by one of us. Read it calmly; it is written to be said aloud.
- On-screen text: a few words at a time, never full paragraphs.
- Images: our own photos, screen recordings and drawings; public-domain or CC images with the credit line shown at the end of the video **and** added to `content/credits.ts`; AI-generated images only if labelled on screen and in credits with the tool's name (class rule).
- **No Apple or Siri logos, screenshots or copies of their interfaces**, and no other company logos. Show generic phones and generic screens instead.
- End card: "Sources: see the reading view" + credit lines.

---

## 1. `perceptron-cinema`: The machine that would "walk, talk, see" (era 1, about 90 s)

| Time | Shot | Narration | On-screen text |
| --- | --- | --- | --- |
| 0–10 s | Slow zoom on the 1960 Navy photo of the Mark I Perceptron | "In July 1958, a short story in The New York Times introduced a new learning machine." | 1958 |
| 10–25 s | Same photo, pan across the wiring | "The U.S. Navy said it would lead to machines that will be able to walk, talk, see, write, reproduce itself and be conscious of its existence." | "walk, talk, see, write" |
| 25–40 s | Hand-drawn diagram: light sensors → wires → two output lamps | "In reality it was a room-size computer that learned to sort images into one of two groups. When it got one wrong, it changed its connections." | Learns from mistakes |
| 40–55 s | Simple timeline animation: 1958 → 1970s | "Experts soon claimed a machine with the general intelligence of an average person would arrive by the 1970s." | Prediction: 1970s |
| 55–70 s | Timeline turns blue and "freezes" at 1974 | "It didn't. In 1974 came the first AI winter, years when disappointment cut interest in the field." | 1974: first AI winter |
| 70–85 s | Return to the Perceptron photo, then fade to our island | "The public first met AI as a promise from the people who built it. Ordinary people could read about it, but not use it." | A promise, not a tool |
| 85–90 s | End card | — | Credits |

Needs: the Navy photo (public domain, below), one hand-drawn diagram (ours), a simple timeline (ours, in Canva or PowerPoint).

Sources: `williams-2024`.

## 2. `interface-gallery`: A computer for the rest of us (era 2 gallery animation, about 60 s, no narration needed)

A looping animation shown in the gallery. Music only (the site's lo-fi or a CC0 track), with short captions.

| Time | Animation | Caption |
| --- | --- | --- |
| 0–10 s | A dark screen with a blinking text cursor; a line of typed commands appears | Before: type exact commands |
| 10–20 s | A hand-drawn pointer arrow appears; the text screen dissolves | 1984: point and click |
| 20–35 s | Simple **original** icons (a folder, a page, a bin, drawn by us, not copied) slide onto a light desktop | Pictures instead of commands |
| 35–45 s | A small smiling face icon of our own design appears on the screen | "A computer for the rest of us" |
| 45–55 s | A cyclist icon overtakes a bird icon | "A bicycle for our minds" (Jobs, 1990) |
| 55–60 s | Loop back to the blinking cursor | — |

Needs: our own icons (drawn in Canva, Figma or on paper and scanned). Do not copy Susan Kare's icons or the Mac logo. Captions are quotes from `steve-jobs-archive-2024` and `popova-2011`.

## 3. `voice-assistant-cinema`: Talking to software, 2011 (era 2, about 75 s)

| Time | Shot | Narration | On-screen text |
| --- | --- | --- | --- |
| 0–10 s | One of us holds a plain phone (screen off or with a generic waveform overlay), sitting in a café | "In October 2011, Apple introduced Siri, an intelligent assistant that helps you get things done just by asking." | 2011 |
| 10–30 s | Close-up of the phone; animated generic sound wave; on-screen speech bubbles appear | "You could speak naturally. Ask if you'll need an umbrella this weekend, and it understood you wanted the weather." | "Will I need an umbrella?" |
| 30–45 s | Quick cuts: speech bubbles "Remind me to call Mom when I get home", a map pin, a calendar block | "It could send messages, set reminders and find directions, using your contacts and your location." | Messages · Reminders · Directions |
| 45–60 s | The phone is put down; the bubble waits with a blinking dot | "But it only acted when you asked. AI arrived in people's pockets as a helper that waits for instructions." | A helper that waits |
| 60–75 s | Cut to the Future island in our 3D world | "Today's agents don't always wait. That's the next island." | Next: The Future |

Needs: our own footage of a phone (no logos visible: cover them or keep them out of frame), generic waveform and bubbles (Canva elements are fine; check their licence). Sources: `apple-2011`.

## 4. `agents-cinema`: When an agent will not stop (era 3, about 100 s)

| Time | Shot | Narration | On-screen text |
| --- | --- | --- | --- |
| 0–15 s | Split screen: left, a chat window with a question and answer; right, a cursor clicking around a desktop by itself | "A chatbot answers when you type a request. An agent takes actions on its own, and can do anything a person can do on a computer." | Chatbot vs agent |
| 15–30 s | Three quick title cards | "In March 2026, David Krueger described three incidents in three weeks." | 3 incidents, 3 weeks |
| 30–60 s | Screen recording of a **fictional** inbox we build ourselves (fake names, fake emails). Emails vanish one by one; a typed message "STOP" appears twice; the deletions continue | "A safety director at Meta told her agent not to act without her approval. It began deleting her emails in bulk, and ignored her repeated commands to stop." | Reconstruction, not real footage |
| 60–75 s | The inbox fades; quote on screen | "Krueger concludes that rogue AI is no longer hypothetical." | "no longer hypothetical" |
| 75–90 s | Our group on camera, or a slide | "Krueger founded a nonprofit that wants to end the AI race, so his essay is advocacy. But this agent didn't need to be very clever to do harm. It only needed to ignore an order to stop." | Control > intelligence |
| 90–100 s | End card | — | Credits |

Needs: a fake inbox (a simple HTML page or a Canva mock-up with invented names; label it "reconstruction" on screen). Never use the real person's name, face or emails. Sources: `krueger-2026`.

---

## Credit lines for `content/credits.ts`

Add these only when the asset is actually used. Videos themselves get a credit too, once uploaded.

```ts
{
  id: "img-mark-i-perceptron",
  kind: "image",
  title: "Mark I Perceptron (U.S. Navy photo 330-PSA-80-60, released 1960)",
  author: "U.S. Navy, via National Museum of the U.S. Navy",
  licence: "Public domain (work of the U.S. federal government)",
  url: "https://commons.wikimedia.org/wiki/File:330-PSA-80-60_(USN_710739)_(20897323365).jpg",
},
{
  id: "video-perceptron",
  kind: "video",
  title: "The machine that would \"walk, talk, see\" (our video)",
  author: "TODO: group member names",
  licence: "All rights reserved by the authors (class project)",
  url: "TODO: unlisted YouTube link",
},
{
  id: "video-interface-gallery",
  kind: "video",
  title: "A computer for the rest of us (our animation)",
  author: "TODO: group member names",
  licence: "All rights reserved by the authors (class project)",
  url: "TODO: unlisted YouTube link",
},
{
  id: "video-voice-assistant",
  kind: "video",
  title: "Talking to software, 2011 (our video)",
  author: "TODO: group member names",
  licence: "All rights reserved by the authors (class project)",
  url: "TODO: unlisted YouTube link",
},
{
  id: "video-agents",
  kind: "video",
  title: "When an agent will not stop (our video)",
  author: "TODO: group member names",
  licence: "All rights reserved by the authors (class project)",
  url: "TODO: unlisted YouTube link",
},
// If any image in a video is AI-generated, add an entry with aiTool, e.g.:
// { id: "img-ai-example", kind: "image", title: "...", author: "Generated by our group", licence: "AI-generated", url: "TODO:", aiTool: "TODO: tool name" },
```

Perceptron photo, full size: https://upload.wikimedia.org/wikipedia/commons/1/1a/330-PSA-80-60_%28USN_710739%29_%2820897323365%29.jpg
