"""Write each episode's WebVTT transcript from the script and the generated line lengths.

The audio is generated from lines.json, so the script is the exact wording (names spelled right), and the timings come
from the same line WAVs and gaps that assemble.py joins. Run check.py first (it uses Whisper to confirm the audio says
what the script says). Long lines are split at sentence ends; cue times are shared out by length.

Run from the repo root:  tools/voices/.venv/Scripts/python tools/voices/make_vtt.py episode-1 episode-2
"""
import json, pathlib, re, sys
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "tools/voices/out"
NAMES = {"rayyan": "Rayyan", "abdulrahman": "Abdulrahman Ahmad", "waleed": "Waleed Masri",
         "guest-1956": "1956 Workshop Researcher"}
FILES = {"episode-1": "ep-1.vtt", "episode-2": "ep-2.vtt", "episode-3": "ep-3.vtt"}
lines = json.loads((ROOT / "tools/voices/lines.json").read_text(encoding="utf-8"))

def stamp(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}.{ms:03}"

for ep in sys.argv[1:]:
    clock, prev, cues = 0.0, None, []
    for l in (x for x in lines if x["episode"] == ep):
        if prev is not None: clock += 1.0 if l["section"] != prev else 0.35
        prev = l["section"]
        info = sf.info(str(OUT / f"{l['id']}.wav"))
        length = info.frames / info.samplerate
        parts = [p.strip() for p in re.findall(r'.+?(?:[.!?]["\u201d]?(?=\s+[A-Z"\u201c])|$)', l["text"]) if p.strip()]
        # "U.S." is not a sentence end: join a cue that stops there to the one after it.
        for k in range(len(parts) - 2, -1, -1):
            if parts[k].endswith("U.S."): parts[k:k + 2] = [parts[k] + " " + parts[k + 1]]
        total, at = sum(len(p) for p in parts), clock
        for p in parts:
            d = length * len(p) / total
            cues.append(f"{stamp(at)} --> {stamp(at + d)}\n<v {NAMES[l['voice']]}>{p}")
            at += d
        clock += length
    path = ROOT / "content/transcripts" / FILES[ep]
    path.write_text("WEBVTT\n\n" + "\n\n".join(cues) + "\n", encoding="utf-8")
    print(f"{path.name}: {len(cues)} cues, {clock:.0f} s")
