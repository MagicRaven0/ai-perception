export type Cue = {
  /** Start time in seconds. */
  start: number;
  end: number;
  /** Speaker from a WebVTT voice tag (<v Name>), if any. */
  speaker?: string;
  text: string;
};

function toSeconds(stamp: string): number {
  // hh:mm:ss.mmm or mm:ss.mmm
  const parts = stamp.trim().split(":").map(Number);
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** Minimal WebVTT parser: cue timings, optional <v Speaker> voice tag, plain text. */
export function parseVtt(source: string): Cue[] {
  const blocks = source.replace(/\r/g, "").split(/\n{2,}/);
  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const timingIndex = lines.findIndex((l) => l.includes("-->"));
    if (timingIndex === -1) continue;

    const [startRaw, rest] = lines[timingIndex].split("-->");
    const endRaw = rest.trim().split(/\s+/)[0];
    let text = lines.slice(timingIndex + 1).join(" ");

    let speaker: string | undefined;
    const voice = text.match(/^<v(?:\.[^\s>]+)?\s+([^>]+)>/);
    if (voice) {
      speaker = voice[1].trim();
      text = text.slice(voice[0].length);
    }
    text = text.replace(/<[^>]+>/g, "").trim();
    if (!text) continue;

    cues.push({ start: toSeconds(startRaw), end: toSeconds(endRaw), speaker, text });
  }

  return cues;
}

/** Index of the cue playing at `time`, or -1. Cues are sorted by start. */
export function activeCueIndex(cues: Cue[], time: number): number {
  let lo = 0;
  let hi = cues.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
