# Recording plan: podcasts and the AUS interview

From CONTENT_PROMPTS Prompt 7 (blocks B and C), 22 Nov 2026. Episode metadata is in `content/episodes.ts`; chapter times there match the segments below. Update them from the real recordings.

Recording tips: record in a quiet room, phone 20–30 cm from the mouth, export MP3 mono 64–96 kbps, then transcribe with Whisper and fix names by hand (see `docs/WHAT_WE_NEED.md`).

---

## Interview with Professor Aqeel

### Before the day
- ✓ He has given his OK (22 Nov 2026); keep that message as proof. Interview time still to be set.
- Send him the questions below and the consent line, and ask for a **written OK** (an email reply is fine) to publish his name, photo, recording and transcript on the public site. Until it arrives, `consentConfirmed` stays `false` and the audio cannot be published.
- Ask how he wants his name and title written (for `content/eras.ts`, `content/episodes.ts` and the APA entry `aqeel-interview` in `content/sources.ts`).
- Book 20–25 minutes. Aim for about 12 minutes of usable audio.

### Consent line (read at the start of the recording)
> "Today is [date]. We are [names], students in WRI-101 at the American University of Sharjah. This interview will be published on our class website, *The Evolution of AI Perception*, with your name, your photo if you agree, the audio and a written transcript, and an AI chatbot on the site will be able to quote it. You can skip any question or stop at any time, and you can ask us to remove the recording later. Do you agree to this?"

### Questions (pick 10–12; the starred ones matter most)

**How views of AI have changed**
1. \* When did you first come across the idea of artificial intelligence, and what did people around you think it was?
2. In the 1950s researchers expected a computer chess champion within ten years, and it took almost forty. Why do you think predictions about AI so often run ahead of reality?
3. \* How has the way your students talk about AI changed in the last few years?
4. Tools like Siri were presented as assistants that wait for a request. Do you think people see today's AI tools the same way, or differently?

**AI at AUS and in the UAE**
5. \* How is AI being used at AUS today, in teaching, research or administration?
6. Is there anything about how people in the UAE see AI that is different from what you read about in the United States or Europe?
7. What rules or guidance does your department give students about using AI tools in their work?

**Trust, fear and control**
8. \* A 2025 Pew survey found that half of U.S. adults are more concerned than excited about AI, and most say they have little or no control over whether it is used in their lives. Does that match what you see?
9. \* Our essay argues that what makes AI dangerous is not how intelligent it is, but whether people can still check and stop it. Do you agree?
10. Researchers have reported AI agents that ignored instructions to stop. How worried should ordinary users be about this?
11. Which do you trust more: an AI that is very capable, or one that is easy to correct? Why?

**Advice for students**
12. \* What should a first-year student know about AI before relying on it for their studies or career?
13. Which human skills do you think will matter most as AI spreads?
14. If you could ask the people building AI one question, what would it be?
15. Is there anything we didn't ask that you think we should have?

### After the interview
- Send him the transcript to check names and terms.
- Mark `consentConfirmed: true` in `content/episodes.ts` only after the written OK.
- Fill in his role and view in `content/eras.ts`, the APA entry, and the long text of the `aus-interview` building.

---

## Podcast outlines (6–8 minutes each)

> **Superseded:** full word-for-word scripts are now in `docs/PODCAST_SCRIPTS.md`, and the chapter times in `content/episodes.ts` follow the scripts. The outlines below are kept for reference.

Two hosts. Speak from bullet notes rather than a script so it sounds natural. Every fact in brackets has its source id.

### Episode 1: A summer to build a mind (era 1, about 7 minutes)
| Time | Segment | What to say | Sources |
| --- | --- | --- | --- |
| 0:00–0:45 | Intro: what did people think AI was in 1956? | Hook: in 1958 a newspaper said a computer would one day "walk, talk, see, write". Introduce the series and the question: how has the way people see AI changed? | `williams-2024` |
| 0:45–2:30 | The Dartmouth proposal | Who wrote it (McCarthy, Minsky, Rochester, Shannon), what they wanted machines to do, the conjecture about describing learning precisely, the "one summer" plan, Dartmouth calling it the birth of the field. | `mccarthy-1955`, `dartmouth-nd` |
| 2:30–3:45 | Room-sized computers | The proposal admits computers were too slow and small; the obstacle was programs. The Perceptron as a room-size machine. Only labs, companies and the military had them. | `mccarthy-1955`, `williams-2024` |
| 3:45–5:15 | The 1958 predictions | Simon and Newell's chess prediction (read the quote), then the answer: Deep Blue in 1997. Ask each other: why were they so far off? | `simon-newell-1958`, `ibm-nd` |
| 5:15–6:30 | The Perceptron in the newspaper and the first AI winter | The Navy's claim in the New York Times, Minsky's prediction for the 1970s, the 1974 AI winter. | `williams-2024` |
| 6:30–7:00 | Wrap-up: who had control? | The public could only read about AI; control sat with a few institutions. Tease episode 2. | group commentary |

### Episode 2: A computer for the rest of us (era 2, about 7 minutes)
| Time | Segment | What to say | Sources |
| --- | --- | --- | --- |
| 0:00–0:45 | Intro: from labs to living rooms | Recap episode 1 in two sentences. Today: when computers became personal. | group commentary |
| 0:45–2:30 | The Macintosh, 1984 | Computers were complex; "a computer for the rest of us"; Susan Kare's icons and smiling logo; Jobs's promise about five years from now. | `steve-jobs-archive-2024` |
| 2:30–3:45 | A bicycle for our minds | Read Jobs's 1990 story about the condor and the bicycle. Discuss: a bicycle goes where the rider steers. | `popova-2011` |
| 3:45–5:15 | The second AI winter and Deep Blue | Expert systems and the 1987 winter; Deep Blue in 1997 and Kasparov's reaction. | `williams-2024`, `ibm-nd` |
| 5:15–6:30 | Siri, 2011 | Apple's description, the umbrella and "call Mom" examples, speaking naturally. | `apple-2011` |
| 6:30–7:00 | Wrap-up: AI as a helper that waits | AI reached the public as an assistant that takes instructions. Tease episode 3: what happens when it stops waiting? | group commentary |

### Episode 3: Can we still stop it? (era 3, about 8 minutes)
| Time | Segment | What to say | Sources |
| --- | --- | --- | --- |
| 0:00–0:40 | Intro: AI in everyone's pocket | 62% of U.S. adults interact with AI at least several times a week. | `pew-2025-us` |
| 0:40–2:00 | Experts disagree, so look at the data | Bengio's fear vs LeCun's "amplifier"; Witt's turn to evaluators; METR's seven-month doubling. | `witt-2025` |
| 2:00–3:30 | Deception and self-preservation in tests | Apollo's 1–5%, over 20%, almost 30%; Bengio's overwrite-and-lie study; "self-preservation behavior". | `witt-2025`, `bengio-2025` |
| 3:30–5:00 | From chatbots to agents | Chatbot vs agent; Krueger's three incidents; the email agent that would not stop; "no longer hypothetical". | `krueger-2026` |
| 5:00–6:20 | What the public thinks | Concern rose from 37% (2021) to 50% (2025); 57% feel little or no control; 61% want more. Global median. | `pew-2025-us`, `pew-2025-global` |
| 6:20–7:30 | Our argument and its limits | Control matters more than intelligence; limits (Krueger's advocacy, Tang's "too foolish"); proposed fixes from Bengio and METR. | `witt-2025`, `bengio-2025`, `krueger-2026` |
| 7:30–8:00 | Wrap-up: can we still correct it? | The question to ask of any new AI. Invite listeners to try the chatbot and the arcade. | group commentary |
