"""Join generated line audio into one MP3 per episode / video narration.
Expects tools/voices/out/<line id>.wav for every line in lines.json (made by the TTS step).
Run from the repo root:  python tools/voices/assemble.py   (needs ffmpeg on PATH)"""
import json, pathlib, subprocess, collections

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "tools/voices/out"; DEST = ROOT / "public/audio"; DEST.mkdir(parents=True, exist_ok=True)
lines = json.loads((ROOT / "tools/voices/lines.json").read_text(encoding="utf-8"))
groups = collections.OrderedDict()
for l in lines: groups.setdefault(l["episode"], []).append(l)

def gap(sec, name):
    p = OUT / name
    if not p.exists():
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(sec), str(p)], check=True)
    return p

for ep, ls in groups.items():
    lst = OUT / f"{ep}.txt"; prev_section = None; parts = []; chapters = []; clock = 0.0
    dur = lambda f: float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                                         capture_output=True, text=True, check=True).stdout)
    for l in ls:
        wav = OUT / f"{l['id']}.wav"
        if not wav.exists(): raise SystemExit(f"missing {wav}")
        if prev_section is not None:
            g = gap(1.0 if l["section"] != prev_section else 0.35, f"gap_{'long' if l['section'] != prev_section else 'short'}.wav")
            parts.append(g); clock += dur(g)
        if l["section"] != prev_section: chapters.append({"t": round(clock), "section": l["section"]})
        parts.append(wav); clock += dur(wav); prev_section = l["section"]
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    name = {"episode-1": "ep-1", "episode-2": "ep-2", "episode-3": "ep-3"}.get(ep, ep + "-narration")
    target = DEST / f"{name}.mp3" if ep.startswith("episode") else OUT / f"{name}.wav"
    args = ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-ar", "24000", "-ac", "1",
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11"]
    args += ["-c:a", "libmp3lame", "-b:a", "80k"] if target.suffix == ".mp3" else []
    subprocess.run(args + [str(target)], check=True)
    print(ep, "->", target, f"({round(clock)} s)")
    for c in chapters: print(f"   t: {c['t']:4d}  {c['section']}")   # copy into chapters in content/episodes.ts
