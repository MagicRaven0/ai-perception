"""Build the interview MP3 and its transcript from one recording per question.

Input (never committed): tools/interview/raw/Q1.*, Q2.*, ... and exit.*  (any audio or video format).
Each clip: mono 44.1 kHz, light noise reduction (afftdn), silence trimmed at both ends. Joined in order Q1, Q2, ...,
exit with 0.8 s gaps, loudness-normalised to -16 LUFS, written to public/audio/interview-aqeel.mp3 (96 kbps mono).
Prints each clip's start time (the chapter times for content/episodes.ts) and writes a Whisper draft transcript to
content/transcripts/interview-aqeel.vtt: read it and fix names and terms by hand.

Run from the repo root with the voice venv:  tools/voices/.venv/Scripts/python tools/interview/process.py [--no-transcript] [--cpu]
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW, WORK = ROOT / "tools/interview/raw", ROOT / "tools/interview/work"
DEST = ROOT / "public/audio/interview-aqeel.mp3"
VTT = ROOT / "content/transcripts/interview-aqeel.vtt"
GAP, SR = 0.8, 44100
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15"

def run(*a): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *map(str, a)], check=True)
def dur(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                                capture_output=True, text=True, check=True).stdout)

def base(p): return p.name.split(".")[0]  # phones often export "Q1.m4a.mp4"

def order(p):
    s = base(p).lower()
    if s == "exit": return (1, 0)
    m = re.fullmatch(r"q\s*0*(\d+)", s)
    if not m: raise SystemExit(f"unexpected file name: {p.name} (expected Q1, Q2, ... or exit)")
    return (0, int(m.group(1)))

def stamp(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}.{ms:03}"

clips = sorted((p for p in RAW.glob("*") if p.is_file()), key=order) if RAW.exists() else []
if not clips: raise SystemExit(f"no recordings in {RAW}")
WORK.mkdir(parents=True, exist_ok=True); DEST.parent.mkdir(parents=True, exist_ok=True)
gap = WORK / "gap.wav"
run("-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", GAP, gap)
parts, starts, clock = [], [], 0.0
for i, p in enumerate(clips):
    out = WORK / f"{base(p)}.wav"
    run("-i", p, "-vn", "-ac", 1, "-ar", SR, "-af", f"afftdn=nr=10:nf=-40,{TRIM},areverse,{TRIM},areverse", out)
    if i: parts.append(gap); clock += dur(gap)
    starts.append((base(p), clock)); parts.append(out); clock += dur(out)
lst = WORK / "list.txt"
lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
run("-f", "concat", "-safe", 0, "-i", lst, "-ac", 1, "-ar", SR, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-ar", SR, "-c:a", "libmp3lame", "-b:a", "96k", DEST)
print(f"{DEST}  durationSec: {round(dur(DEST))}")
for name, t in starts: print(f"   t: {int(t):4d}  {name}")
(WORK / "starts.json").write_text(json.dumps(starts), encoding="utf-8")

if "--no-transcript" not in sys.argv:
    import whisper
    model = whisper.load_model("medium.en", device="cpu" if "--cpu" in sys.argv else None)
    res = model.transcribe(str(DEST), language="en", fp16="--cpu" not in sys.argv, word_timestamps=False,
                           initial_prompt="An interview at the American University of Sharjah (AUS), in the UAE, with "
                                          "Professor Aqeel Taher. Rayyan asks about AI, ChatGPT and students.")
    cues = [f"{stamp(s['start'])} --> {stamp(s['end'])}\n{s['text'].strip()}" for s in res["segments"] if s["text"].strip()]
    (WORK / "whisper.json").write_text(json.dumps([[s["start"], s["end"], s["text"].strip()] for s in res["segments"]]), encoding="utf-8")
    VTT.write_text("WEBVTT\n\n" + "\n\n".join(cues) + "\n", encoding="utf-8")
    print(f"{VTT}  ({len(cues)} cues): check names and terms by hand")
