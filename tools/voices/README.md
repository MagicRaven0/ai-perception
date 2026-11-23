# Podcast and narration voices (local voice cloning)

Made 23 Nov 2026 by the project Claude. Each of us clones **only our own voice**, from our own recording, with written permission in the group chat. The 1956 guest uses a designed voice, never a clone of a real person. No Steve Jobs or other real-person voices.

## 1. Samples (the group)
Each person records 30–60 seconds of clean speech: quiet room, phone 20–30 cm away, normal pace. Read any paragraph from `docs/PODCAST_SCRIPTS.md`. Save as WAV (or send the voice memo and Claude Code converts it):

```
tools/voices/samples/rayyan.wav
tools/voices/samples/abdulrahman.wav
tools/voices/samples/waleed.wav
tools/voices/samples/<name>.txt   ← exactly what you said in the sample (some models need it)
```

**The repo is public, so `samples/` and `out/` must never be committed.** Anyone with a clean sample could clone your voice. They are in `.gitignore`.

## 2. Who reads what
`voices.json` maps each script label to a person. Episode 3 is fixed (each of us reads our own essay). Change episodes 1 and 2 and the video narrators however you like, then rebuild the list:

```
python tools/voices/build_lines.py      # → tools/voices/lines.json (163 lines: 3 episodes + 3 video narrations)
```

## 3. Generate (Claude Code, on the laptop's RTX 5070)
Set up one local voice-cloning model that runs on 8 GB of VRAM (options in `docs/AI_VOICE_PLAN.md`: Qwen3-TTS 1.7B Base or VoxCPM2; check their current docs and licences first). Write `tools/voices/generate.py` that reads `lines.json` and saves one file per line: `tools/voices/out/<id>.wav`. Skip lines whose WAV already exists, so a single bad line can be deleted and regenerated.

Names to check by ear (spell them phonetically in a `pronounce` map if needed): Bengio, Krueger, Rosenblatt, Kasparov, Kare, Huang, Mims, Palisade, Grok, Shaffer Shane.

## 4. Assemble
```
python tools/voices/assemble.py
```
Writes `public/audio/ep-1.mp3`, `ep-2.mp3`, `ep-3.mp3` (mono, 80 kbps, loudness-normalised) and `out/<video>-narration.wav` for the three videos, and prints each episode's chapter start times.

## 5. Listen
Listen to every episode from start to end before publishing. Fix mispronounced or robotic lines by deleting their WAV and generating again.
