"""Turn docs/PODCAST_SCRIPTS.md and docs/VIDEO_PLANS.md into one list of lines to synthesise.
Run from the repo root:  python tools/voices/build_lines.py
Writes tools/voices/lines.json: [{id, episode, section, label, voice, text}]. Edit voices.json to choose who reads what."""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
VOICES = json.loads((ROOT / "tools/voices/voices.json").read_text(encoding="utf-8"))

def clean(t):
    t = re.sub(r"\*\(.*?\)\*", "", t)            # stage directions
    t = re.sub(r"[*_]", "", t)                    # markdown emphasis
    return re.sub(r"\s+", " ", t).strip()

lines = []
script = (ROOT / "docs/PODCAST_SCRIPTS.md").read_text(encoding="utf-8")
for ep_block in re.split(r"\n## Episode ", script)[1:]:
    ep = "episode-" + ep_block.split(":", 1)[0].strip()
    section = ""
    for raw in ep_block.splitlines():
        if raw.startswith("### "): section = raw[4:].strip(); continue
        m = re.match(r"\*\*([A-Z]+):\*\*\s*(.+)", raw.strip())
        if m:
            label, text = m.group(1), clean(m.group(2))
            voice = VOICES["episodes"][ep][label]
            for lab, who in VOICES["episodes"][ep].items():   # "I'm [A]" -> "I'm Rayyan"
                text = text.replace(f"[{lab}]", VOICES["names"].get(who, who))
            lines.append({"id": f"{ep}-{len(lines):03d}", "episode": ep, "section": section, "label": label, "voice": voice, "text": text})

plans = (ROOT / "docs/VIDEO_PLANS.md").read_text(encoding="utf-8")
for block in re.split(r"\n## \d\. ", plans)[1:]:
    vid = block.split("`")[1]
    if vid not in VOICES["videos"]: continue
    for row in block.splitlines():
        cells = [c.strip() for c in row.split("|")]
        if len(cells) > 4 and cells[3].startswith('"'):
            text = clean(cells[3].strip('"'))
            lines.append({"id": f"{vid}-{len(lines):03d}", "episode": vid, "section": cells[1], "label": "NARRATOR", "voice": VOICES["videos"][vid], "text": text})

out = ROOT / "tools/voices/lines.json"
out.write_text(json.dumps(lines, indent=1, ensure_ascii=False), encoding="utf-8")
print(len(lines), "lines ->", out)
