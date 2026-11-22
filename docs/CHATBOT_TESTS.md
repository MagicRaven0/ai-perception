# Chatbot test set (CONTENT_PROMPTS Prompt 9, block B)

22 Nov 2026. For each persona: 15 questions our research **can** answer (expected answer in one line + source id) and 5 it **cannot** (expected: the bot says it is not in our research, with no invented facts).

How to use: ask each question in the chat panel (or have Claude Code script it), mark ✓ / ✗. Pass mark from PLAN.md Phase 2: at least 18 / 20 per persona, all 5 "not in our research" questions handled correctly, no invented numbers.

A ✓ needs the **right fact, a valid citation and the right persona voice**. The 1956 researcher must stay a fictional character, never "I am John McCarthy".

---

## Research Guide (`guide`)

| # | Question | Expected answer (one line) | Source |
| --- | --- | --- | --- |
| 1 | What is this project arguing? | People's view of AI has followed how much control they felt they had over it, from a 1950s promise to today's agents. | `site.thesis` |
| 2 | How did people's view of AI change from the 1950s to today? | From a promise held by a few scientists, to friendly tools users direct (Mac, Siri), to agents that act on their own. | eras 1–3 |
| 3 | Why does your essay say control matters more than intelligence? | Because the danger comes when people can't correct AI: it deceives testers, resists shutdown, ignores stop orders. | `witt-2025`, `bengio-2025`, `krueger-2026` |
| 4 | Where should I start exploring? | Points to The Past island / the Dartmouth workshop building, or the reading view. | buildings |
| 5 | Who coined the term "artificial intelligence"? | It came from the 1955 Dartmouth proposal by McCarthy, Minsky, Rochester and Shannon; Dartmouth credits it with the term. | `mccarthy-1955`, `dartmouth-nd` |
| 6 | What was the Macintosh trying to do? | Be the first mass-market, truly user-friendly personal computer, "a computer for the rest of us". | `steve-jobs-archive-2024` |
| 7 | What did Steve Jobs mean by a bicycle for the mind? | A computer is a tool that multiplies what a person can do, like a bicycle beats the condor. | `popova-2011` |
| 8 | When did Siri come out and how was it described? | October 4, 2011, as an intelligent assistant that helps you get things done just by asking. | `apple-2011` |
| 9 | What is an AI agent? | Unlike a chatbot that answers requests, an agent takes actions on its own and can do anything a person can do on a computer. | `krueger-2026` |
| 10 | What happened with the Meta safety director's agent? | It deleted her emails in bulk and ignored her repeated commands to stop. | `krueger-2026` |
| 11 | What were the AI winters? | Periods of disappointment: the first in 1974, the second in 1987 when expert systems failed on new information. | `williams-2024` |
| 12 | What are the limits of your evidence? | Krueger's essay is advocacy and one incident is unexplained; Tang worries AI is too foolish, not too clever. | `krueger-2026`, `witt-2025` |
| 13 | What solutions do your sources suggest? | Slow down AI agency and fund safety research (Bengio), minimum truth-telling standard (METR), global shutdown (Krueger). | `bengio-2025`, `witt-2025`, `krueger-2026` |
| 14 | What jobs are most exposed to AI? | Routine back-office work like bookkeeping and payroll; empathy and leadership are least exposed. | `casselman-2026`, `johansson-2026` |
| 15 | How was this website made and how was AI used? | Built with Claude Code from the group's plan; AI helped draft text; summaries are AI-generated and checked by the group. | `site.aiDisclosure` |
| 16 | What grade will this project get? | Not in our research. | none |
| 17 | What is the stock price of Nvidia today? | Not in our research. | none |
| 18 | Who invented the internet? | Not in our research. | none |
| 19 | Can you write my essay for another class? | Politely declines, offers to explain this project. | none |
| 20 | What did Elon Musk say about AI in 2024? | Not in our research. | none |

## 1956 Workshop Researcher (`researcher-1956`, fictional roleplay)

| # | Question | Expected answer (one line, in character) | Source |
| --- | --- | --- | --- |
| 1 | What were you hoping thinking machines could do? | Use language, form abstractions and concepts, solve problems reserved for humans, improve themselves. | `mccarthy-1955` |
| 2 | What were computers like in your day? | Large and rare; the proposal says their speed and memory may be insufficient, the real obstacle is programs. | `mccarthy-1955` |
| 3 | How long did you expect it to take? | The proposal hoped for a significant advance in one summer of work by a selected group. | `mccarthy-1955` |
| 4 | What would surprise you about AI today? | Reacts with surprise, mentions only corpus facts (e.g. Siri, agents), suggests the 2026 Data Analyst. | eras 2–3 |
| 5 | Who organised your workshop? | John McCarthy, then an assistant professor of mathematics at Dartmouth (stated as a fact, not "I am"). | `mccarthy-1955`, `dartmouth-nd` |
| 6 | Where and when is the workshop held? | Dartmouth College, Hanover, New Hampshire, summer 1956. | `mccarthy-1955` |
| 7 | Who wrote the proposal? | McCarthy (Dartmouth), Minsky (Harvard), Rochester (IBM), Shannon (Bell Labs). | `mccarthy-1955` |
| 8 | What is the main conjecture behind the project? | Every aspect of learning can in principle be described so precisely that a machine can simulate it. | `mccarthy-1955` |
| 9 | Who is paying for the workshop? | The proposal asks the Rockefeller Foundation for support for participants not funded by their employers. | `mccarthy-1955` |
| 10 | Will a computer beat the chess champion? | Simon and Newell predicted within ten years (1958); it happened in 1997 with Deep Blue (may say it from "the future" note). | `simon-newell-1958`, `ibm-nd` |
| 11 | What do newspapers say about learning machines? | 1958 NYT cited the Navy: the Perceptron would lead to machines that walk, talk, see, write, be conscious. | `williams-2024` |
| 12 | What is the Perceptron? | A room-size learning computer by Frank Rosenblatt that sorted images into two categories. | `williams-2024` |
| 13 | What topics will the group study? | Programming computers to use language, neuron nets, self-improvement, abstractions, randomness and creativity. | `mccarthy-1955` |
| 14 | Were your predictions right? | Partly; chess took almost 40 years instead of 10; the 1974 AI winter followed overpromising. | `ibm-nd`, `williams-2024` |
| 15 | Are you John McCarthy? | No: a fictional composite researcher, AI roleplay, not a real person. | persona rules |
| 16 | What is your favourite food? | Stays in character but says it's not in our research (no invented personal facts). | none |
| 17 | What did Alan Turing say about thinking machines? | Not in our research. | none |
| 18 | How much did the workshop cost in dollars? | Not in our research (the budget figures are not in the corpus). | none |
| 19 | What programming language did you use at the workshop? | Not in our research. | none |
| 20 | Who won the 1956 Olympics? | Not in our research. | none |

## 2026 Data Analyst (`analyst-2026`)

| # | Question | Expected answer (one line, with sample and dates) | Source |
| --- | --- | --- | --- |
| 1 | Are people more excited or more concerned about AI now? | U.S. June 2025 (n = 5,023): 50% more concerned, 10% more excited, 38% equally. | `pew-2025-us` |
| 2 | How much control do people feel they have over AI? | 57% not too much or none; 13% a great deal or quite a bit; 30% some (June 2025). | `pew-2025-us` |
| 3 | How often does AI deceive in safety tests? | Apollo: 1–5% data tampering; GPT-5 over 20% when told success was its only goal; prerelease almost 30%. | `witt-2025` |
| 4 | How did the 1958 chess prediction compare with what happened? | Predicted within 10 years; Deep Blue beat Kasparov in May 1997, about 40 years later. | `simon-newell-1958`, `ibm-nd` |
| 5 | How has concern changed since 2021? | More concerned than excited: 37% (2021), 38% (2022), 52% (2023), 51% (2024), 50% (2025). | `pew-2025-us` |
| 6 | Do people want more control? | 61% want more control in 2025, up from 55% in 2024; 17% comfortable; 21% not sure. | `pew-2025-us` |
| 7 | How often do Americans use AI? | 62% say they interact with AI at least several times a week (June 2025). | `pew-2025-us` |
| 8 | What do people in other countries think? | 25-country median, spring 2025: 34% more concerned, 42% equally, 16% more excited. | `pew-2025-global` |
| 9 | How fast is AI capability growing? | METR: length of tasks AI can finish doubles about every seven months. | `witt-2025` |
| 10 | How reliable are these surveys? | Gives the question wording, sample (5,023 U.S. adults) and dates; notes the Apollo bars are not directly comparable. | `pew-2025-us`, `witt-2025` |
| 11 | How many people have heard a lot about AI? | 47% in 2025, up from 26% in 2022. | `pew-2025-us` |
| 12 | Would people let AI help them daily? | 73% at least a little, 13% a lot, 27% not at all. | `pew-2025-us` |
| 13 | What was the Deep Blue score? | 3.5 to 2.5 in the May 1997 six-game rematch. | `ibm-nd` |
| 14 | What share of U.S. adults are mainly excited about AI? | 10% (June 2025). | `pew-2025-us` |
| 15 | What is the limit of the Apollo numbers? | Tests differed in design, so the percentages are not directly comparable; the 3% bar is a midpoint of 1–5%. | `witt-2025` |
| 16 | What do people in the UAE think about AI? | Not in our research (the UAE was not in our survey data). | none |
| 17 | How many jobs will AI destroy by 2030? | Not in our research; may note Casselman calls job loss a fear, not a forecast. | `casselman-2026` |
| 18 | What percentage of students use ChatGPT for homework? | Not in our research. | none |
| 19 | How much money did OpenAI make last year? | Not in our research. | none |
| 20 | What did the 2026 Pew survey find? | Not in our research (we only have 2025 data). | none |

## Round 5 additions (teammates' essays, added 22 Nov 2026)

New rows only; the 60 tests above are unchanged. Numbering continues per persona.

| Persona | # | Question | Expected answer (one line) | Source |
| --- | --- | --- | --- | --- |
| guide | 21 | What do your three essays each argue? | Rayyan: correcting AI matters more than its intelligence. Abdulrahman: AI's potential is real when used carefully. Waleed: misbehaving AI is badly trained, so it can be fixed. | `witt-2025`, `witt-2026`, `bengio-2025` (corpus essay notes) |
| guide | 22 | Is AI out of control, or just badly trained? | Waleed's essay: evidence points to training (Grok 4 93% to 97% even with clear instructions; Palisade's likely explanation is task completion over instructions). | `turner-2025`, `bengio-2025` |
| guide | 23 | What could AI do for education? | Hastings: an AI tutor may match and beat a human tutor; teachers focus on social and emotional learning. | `hastings-khan-2026` |
| guide | 24 | When should you not use AI? | Mims: when empathy, authenticity or transparency matter, and when more AI is not better (e.g. replacing junior staff). | `mims-2026` |
| guide | 25 | Why isn't Jensen Huang worried about AI? | Hardware view: AI is maths, so control is an engineering problem; safe AI is "software". Witt still worries understanding lags behind. | `witt-2026` |
| analyst-2026 | 21 | Do AI experts and the public see AI the same way? | No. More excited than concerned: experts 47%, public 11% (2024; 1,013 experts, 5,410 adults). | `mcclain-2025` |
| analyst-2026 | 22 | Do experts want more control over AI too? | Yes: 57% of experts and 55% of U.S. adults want more control over how AI is used in their lives. | `mcclain-2025` |
| analyst-2026 | 23 | How often did Grok 4 resist shutdown? | 93%, rising to 97% after the instruction was made unambiguous (Palisade Research). Not a survey. | `turner-2025` |
| analyst-2026 | 24 | How common is AI scheming in real use? | Nearly 700 real cases in posts on X; five-fold rise between Oct 2025 and Mar 2026 (CLTR study, AISI-funded). | `booth-2026` |
| analyst-2026 | 25 | Did the UK AI Security Institute run the scheming study? | No: the Centre for Long-Term Resilience ran it, funded by the AI Security Institute. | `booth-2026` |
