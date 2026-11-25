"""Generate one WAV per script line in each person's cloned voice (local, Qwen3-TTS 1.7B Base, Apache 2.0).

Reads tools/voices/lines.json, writes tools/voices/out/<line id>.wav (24 kHz mono).
- Skips lines whose WAV already exists (delete a bad one and run again to redo it).
- Skips lines whose voice has no reference clip yet (work/<voice>-ref.wav + .txt, from prepare_samples.py).
- 'guest-1956' is a designed voice (the model's VoiceDesign checkpoint invents it from a text description), then
  cloned from that invented clip so every line sounds the same. It is never a clone of a real person.
- `PRONOUNCE` respells names the model says wrong. It changes only what the model reads, never the text on the site.

Run from the repo root with the voice venv:
  tools/voices/.venv/Scripts/python tools/voices/generate.py --test 3        # 3 lines per voice -> out/test/
  tools/voices/.venv/Scripts/python tools/voices/generate.py                 # everything that is ready
  tools/voices/.venv/Scripts/python tools/voices/generate.py --episode episode-1 --voice rayyan
"""
import argparse, hashlib, json, pathlib, re, time
import numpy as np
import soundfile as sf
import torch

HERE = pathlib.Path(__file__).resolve().parent
WORK, OUT = HERE / "work", HERE / "out"
BASE = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
DESIGN = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"

# Respelled for the model only. Edit and re-run (delete the affected WAVs) if one still sounds wrong.
PRONOUNCE = {
    "Bengio": "Ben-joe",
    "Krueger": "Kroo-ger",
    "Rosenblatt": "Rose-en-blat",
    "Kasparov": "Kass-pah-rov",
    "Kare": "Care",
    "Huang": "Hwong",
    "Mims": "Mims",
    "Palisade": "Pal-ih-sade",
    "Grok": "Grock",
    "Shaffer Shane": "Shaffer Shain",
    "Hobbhahn": "Hobb-hahn",
    "Dartmouth": "Dart-muth",
}

GUEST_DESCRIPTION = (
    "A mature male voice, American English, warm and measured, speaking slowly like an academic of the 1950s "
    "giving a formal talk. Calm, a little formal, clear diction."
)
GUEST_REF_TEXT = (
    "We propose that a two month, ten man study of artificial intelligence be carried out during the summer "
    "of nineteen fifty six at Dartmouth College."
)

def respell(text: str) -> str:
    for word, said in PRONOUNCE.items():
        text = re.sub(rf"\b{re.escape(word)}\b", said, text)
    return text

def seed_for(line_id: str) -> int:
    return int(hashlib.sha1(line_id.encode()).hexdigest()[:8], 16)

def load(name: str):
    from qwen_tts import Qwen3TTSModel
    return Qwen3TTSModel.from_pretrained(name, device_map="cuda:0" if torch.cuda.is_available() else "cpu",
                                         dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
                                         attn_implementation="sdpa")

def ensure_guest_ref():
    ref = WORK / "guest-1956-ref.wav"
    if ref.exists(): return
    print("designing the 1956 guest's voice ...")
    model = load(DESIGN)
    wavs, sr = model.generate_voice_design(text=GUEST_REF_TEXT, language="English", instruct=GUEST_DESCRIPTION)
    sf.write(str(ref), wavs[0], sr)
    (WORK / "guest-1956-ref.txt").write_text(GUEST_REF_TEXT, encoding="utf-8")
    del model
    if torch.cuda.is_available(): torch.cuda.empty_cache()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", type=int, default=0, help="N lines per voice into out/test/ (the first N of each voice)")
    ap.add_argument("--voice", action="append", help="only these voices")
    ap.add_argument("--episode", action="append", help="only these episodes / videos")
    args = ap.parse_args()

    lines = json.loads((HERE / "lines.json").read_text(encoding="utf-8"))
    dest = OUT / "test" if args.test else OUT
    dest.mkdir(parents=True, exist_ok=True)

    todo, seen = [], {}
    for l in lines:
        if args.voice and l["voice"] not in args.voice: continue
        if args.episode and l["episode"] not in args.episode: continue
        if args.test:
            seen[l["voice"]] = seen.get(l["voice"], 0) + 1
            if seen[l["voice"]] > args.test: continue
        if (dest / f"{l['id']}.wav").exists(): continue
        todo.append(l)
    voices = sorted({l["voice"] for l in todo})
    ready = [v for v in voices if v == "guest-1956" or (WORK / f"{v}-ref.wav").exists()]
    for v in voices:
        if v not in ready: print(f"skipping {sum(l['voice'] == v for l in todo)} lines of '{v}': no reference clip yet")
    todo = [l for l in todo if l["voice"] in ready]
    if not todo:
        print("nothing to do"); return
    if "guest-1956" in ready: ensure_guest_ref()

    print(f"device: {'cuda ' + torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU (slow)'}; {len(todo)} lines")
    model = load(BASE)
    prompts = {}
    for v in ready:
        prompts[v] = model.create_voice_clone_prompt(
            ref_audio=str(WORK / f"{v}-ref.wav"),
            ref_text=(WORK / f"{v}-ref.txt").read_text(encoding="utf-8").strip(),
            x_vector_only_mode=False,
        )
    t0 = time.time()
    for n, l in enumerate(todo, 1):
        torch.manual_seed(seed_for(l["id"]))
        wavs, sr = model.generate_voice_clone(text=respell(l["text"]), language="English", voice_clone_prompt=prompts[l["voice"]])
        audio = np.asarray(wavs[0], dtype=np.float32)
        sf.write(str(dest / f"{l['id']}.wav"), audio, sr)
        print(f"[{n}/{len(todo)}] {l['id']} ({l['voice']}) {len(audio) / sr:.1f} s  elapsed {time.time() - t0:.0f} s", flush=True)

if __name__ == "__main__":
    main()
