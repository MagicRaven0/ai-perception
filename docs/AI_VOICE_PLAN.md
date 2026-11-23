# Recording the podcasts: real voices or AI voices

22 Nov 2026. Scripts: `docs/PODCAST_SCRIPTS.md` (about 6–7 minutes each, about 2,900 words in total).

## Option A (recommended): record yourselves
The fastest and safest route, and the one that sounds most like a student project.
- Read straight from the scripts; you don't need to memorise anything. Plan about 20–25 minutes per episode including retakes.
- A quiet room, phones 20–30 cm from your mouths, both recording at once (or one shared phone between you). Record each section separately so a mistake only means redoing one section.
- Edit in Audacity or CapCut: cut gaps, normalise volume, export MP3 mono 64–96 kbps.
- The fictional 1956 researcher in episode 1 can be read by a third person, by one of you with a slightly different voice, or made with AI (see below).

## Option B: clone your own voices with AI
Each person clones **only their own voice**, records their own sample, and agrees in writing (a group chat message is enough) to the clone being used.

**B1. ElevenLabs (easiest, paid).** The free plan has no voice cloning. The Starter plan (about $5–6 a month, check the live price at https://elevenlabs.io/pricing) includes Instant Voice Cloning from a 1–3 minute sample and roughly 30 minutes of generated speech a month, which covers all three episodes (about 20 minutes). Each person makes the clone on their own account and shares it, or you use one account and each person records their own sample on it.

**B2. Free, on Rayyan's laptop (RTX 5070, 8 GB).** Two open models that can clone a voice from a short sample and run on an 8 GB graphics card:
- **Qwen3-TTS 1.7B Base:** clones from about 3 seconds of reference audio, model about 4 GB.
- **VoxCPM2 (OpenBMB):** Apache 2.0 licence, voice cloning and voice design, runs on 8 GB of VRAM.

Claude Code can set either up and write a small script that reads `docs/PODCAST_SCRIPTS.md`, generates every **A:** and **B:** line in the right voice, and joins them into one MP3 per episode.

**Steps for either:**
1. Each person records 1–3 minutes of clean speech (read any paragraph from the scripts, normal pace, quiet room).
2. Generate line by line, not whole pages, so mistakes are easy to redo.
3. Listen to everything. Fix names the AI mispronounces (Bengio, Krueger, Rosenblatt, Kasparov, Kare) by spelling them phonetically in the input.
4. Add a little room tone or quiet music under the voices so the joins don't sound robotic.

**Mixed approach:** record yourselves, and use AI only for the fictional 1956 guest. This gives the most natural result with the least risk.

## The fictional 1956 guest's voice
Use a **designed voice** (ElevenLabs voice design, or one of the built-in voices in Qwen3-TTS or VoxCPM2), not a clone of anyone. Every guest line in the script comes from the 1955 Dartmouth proposal, and the hosts say out loud that the guest is fictional.

## Why not Steve Jobs's voice
We should not make an AI copy of Steve Jobs's voice saying lines he never said. Listeners would hear invented words in a real person's mouth, which goes against our own site rules (no real-person impersonation) and against the honest sourcing the whole project depends on. Instead, episode 2 has the hosts read his real, cited quotes ("a computer for the rest of us", "a bicycle for our minds").

If you want a guest voice in episode 2 as well, we could add a *fictional* character labelled as such, for example a 2011 phone user trying Siri for the first time, with lines built only from Apple's press release.

## Labelling (class rule: AI use must be disclosed)
If any voice in an episode is AI-generated:
- Say so at the start of the episode (episode 1 already does this for the guest).
- Add a line to the episode summary in `content/episodes.ts`, for example: "The voices of [names] were generated with [tool] from their own recordings, with their permission. Scripts written by our group from our sources."
- Add a credit in `content/credits.ts` with `kind: "audio"` and `aiTool: "[tool name]"`.
- Add one sentence about it to the AI disclosure in `content/site.ts`.

Sources for this page:
- ElevenLabs pricing: https://elevenlabs.io/pricing, plus https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/elevenlabs-pricing-voice-cloning-no-fakes-act and https://neuraplus-ai.github.io/blog/elevenlabs-pricing-plans-and-features-explained-2026.html
- Qwen3-TTS: https://localaimaster.com/blog/qwen3-tts-local-setup
- VoxCPM2: https://betterstack.com/community/guides/ai/voxcpm2-local-tts/ and https://en.kocpc.com.tw/?p=3711
