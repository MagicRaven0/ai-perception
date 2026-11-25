"""Quality check: transcribe each generated line with Whisper and compare it with the script.

Flags lines where the model dropped, repeated or invented words (it cannot judge how a name sounds: listen to those).
Run from the repo root with the voice venv:
  tools/voices/.venv/Scripts/python tools/voices/check.py            # tools/voices/out/
  tools/voices/.venv/Scripts/python tools/voices/check.py --test     # tools/voices/out/test/
"""
import difflib, json, pathlib, re, sys
import soundfile as sf
import whisper

HERE = pathlib.Path(__file__).resolve().parent
folder = HERE / "out" / "test" if "--test" in sys.argv else HERE / "out"
lines = {l["id"]: l for l in json.loads((HERE / "lines.json").read_text(encoding="utf-8"))}
NUMBERS = {"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7",
           "eight": "8", "nine": "9", "ten": "10"}

def words(t):
    t = t.lower().replace("-", " ").replace("%", " percent").replace(",", "")
    return [NUMBERS.get(w, w) for w in re.findall(r"[a-z0-9']+", t)]

model = whisper.load_model("small.en")
flagged = 0
for wav in sorted(folder.glob("*.wav")):
    line = lines.get(wav.stem)
    if not line: continue
    heard = model.transcribe(str(wav), language="en")["text"]
    ratio = difflib.SequenceMatcher(None, words(line["text"]), words(heard), autojunk=False).ratio()
    info = sf.info(str(wav))
    pace = len(line["text"].split()) / (info.frames / info.samplerate)
    if ratio < 0.85 or not 1.2 < pace < 4.2:
        flagged += 1
        print(f"CHECK {wav.stem} ({line['voice']}) match {ratio:.2f}, {pace:.1f} words/s\n  script: {line['text']}\n  heard:  {heard.strip()}")
print(f"{flagged} line(s) to check in {folder}")
