"""Turn each voice sample into a short reference clip for the cloning model.

Input (never committed): tools/voices/work/<name>.wav  (24 kHz mono, silence trimmed; made with ffmpeg from
samples/<name>.m4a|mp4) and samples/<name>.txt (exactly what the person said).
Output: work/<name>-ref.wav and work/<name>-ref.txt  (the first whole sentences, about 12-20 s), because the
model clones best from a clean clip whose transcript matches word for word.

Run from the repo root with the voice venv:  tools/voices/.venv/Scripts/python tools/voices/prepare_samples.py
"""
import difflib, pathlib, re, sys
import soundfile as sf
import whisper

HERE = pathlib.Path(__file__).resolve().parent
WORK, SAMPLES = HERE / "work", HERE / "samples"
MIN_S, MAX_S = 12.0, 20.0

def norm(w): return re.sub(r"[^a-z0-9']", "", w.lower())

model = whisper.load_model("small.en")
for wav in sorted(WORK.glob("*.wav")):
    name = wav.stem
    if name.endswith("-ref") or not (SAMPLES / f"{name}.txt").exists(): continue
    known = (SAMPLES / f"{name}.txt").read_text(encoding="utf-8").replace("\n", " ").strip()
    res = model.transcribe(str(wav), word_timestamps=True, language="en", fp16=False)
    heard = [w for s in res["segments"] for w in s["words"]]
    # Sentences of the known transcript, with the index of the last word of each.
    sentences, words = re.findall(r"[^.!?]+[.!?]", known), []
    ends = []
    for s in sentences:
        words += s.split(); ends.append(len(words))
    kw, hw = [norm(w) for w in words], [norm(w["word"]) for w in heard]
    sm = difflib.SequenceMatcher(None, kw, hw, autojunk=False)
    to_heard = {}
    for a, b, n in sm.get_matching_blocks():
        for i in range(n): to_heard[a + i] = b + i
    cut = None
    for k, e in enumerate(ends):
        # nearest matched word at or before the sentence's last word
        j = next((to_heard[i] for i in range(e - 1, max(e - 6, -1), -1) if i in to_heard), None)
        if j is None: continue
        t = heard[j]["end"]
        if t >= MIN_S and (cut is None or t <= MAX_S):
            cut = (k, t)
            if t > MAX_S: break
        if t > MAX_S: break
    if cut is None: cut = (len(sentences) - 1, heard[-1]["end"])
    k, t = cut
    data, sr = sf.read(str(wav))
    end = min(len(data), int((t + 0.15) * sr))
    sf.write(str(WORK / f"{name}-ref.wav"), data[:end], sr)
    (WORK / f"{name}-ref.txt").write_text(" ".join(sentences[: k + 1]).strip(), encoding="utf-8")
    print(f"{name}: {end / sr:.1f} s, {k + 1} sentences")
