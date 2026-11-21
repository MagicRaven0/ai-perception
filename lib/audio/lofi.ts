/**
 * Original, generated lo-fi music for the 3D world (no audio files, nothing to license or credit).
 * One calm groove that shifts with the island:
 * - The Past: slow, warm jazzy 7th chords on soft sines, brushed snare, a little tape wobble.
 * - The Jobs Era: a touch faster and brighter, triangle keys with a gentle plucked arpeggio, closed hats.
 * - The Future: airy filtered pads, minor 9ths, crisp light hats.
 * Chords change on the bar, so moving between islands glides from one mood into the next.
 * Web Audio only; starts on a user gesture (the HUD sound button). Browser-only module.
 */

import type { EraId } from "@/lib/content/schema";

type Style = {
  bpm: number;
  /** Four chords as MIDI note numbers, one per bar. */
  chords: number[][];
  pad: OscillatorType;
  cutoff: number;
  hats: boolean;
  brush: boolean;
  arp: boolean;
  wobble: number;
};

const STYLES: Record<EraId, Style> = {
  // F major 7 -> E minor 7 -> D minor 7 -> C major 7
  "era-1": {
    bpm: 66,
    chords: [
      [53, 57, 60, 64],
      [52, 55, 59, 62],
      [50, 53, 57, 60],
      [48, 52, 55, 59],
    ],
    pad: "sine",
    cutoff: 1100,
    hats: false,
    brush: true,
    arp: false,
    wobble: 6,
  },
  // C major 7 -> A minor 7 -> F major 7 -> G6
  "era-2": {
    bpm: 74,
    chords: [
      [48, 52, 55, 59],
      [45, 48, 52, 55],
      [41, 45, 48, 52],
      [43, 47, 50, 52],
    ],
    pad: "triangle",
    cutoff: 1800,
    hats: true,
    brush: false,
    arp: true,
    wobble: 2,
  },
  // A minor 9 -> F major 7 -> C major 7 -> G add9
  "era-3": {
    bpm: 70,
    chords: [
      [45, 48, 52, 55, 59],
      [41, 45, 48, 52],
      [48, 52, 55, 59],
      [43, 47, 50, 57],
    ],
    pad: "sawtooth",
    cutoff: 1300,
    hats: true,
    brush: false,
    arp: true,
    wobble: 1,
  },
};

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let tone: BiquadFilterNode | null = null;
let noise: AudioBuffer | null = null;
let era: EraId = "era-1";
let timer: number | null = null;
let nextBeat = 0;
let beat = 0;
let seed = 7;

const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

function setup() {
  if (ctx) return ctx;
  const AC =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = STYLES[era].cutoff;
  tone.Q.value = 0.4;
  tone.connect(master);
  master.connect(ctx.destination);
  // One second of noise, reused for hats, brushes and vinyl crackle.
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

function envGain(start: number, attack: number, hold: number, release: number, peak: number) {
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + attack);
  g.gain.setValueAtTime(peak, start + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release);
  return g;
}

function pad(notes: number[], start: number, length: number, s: Style) {
  for (const n of notes) {
    const o = ctx!.createOscillator();
    o.type = s.pad;
    o.frequency.value = hz(n);
    o.detune.value = (rand() - 0.5) * s.wobble * 2;
    const g = envGain(start, 0.6, length - 1.2, 1.4, s.pad === "sawtooth" ? 0.025 : 0.05);
    o.connect(g).connect(tone!);
    o.start(start);
    o.stop(start + length + 1.6);
  }
}

function pluck(note: number, start: number, s: Style) {
  const o = ctx!.createOscillator();
  o.type = s.pad === "sine" ? "sine" : "triangle";
  o.frequency.value = hz(note);
  const g = envGain(start, 0.01, 0.05, 0.7, 0.06);
  o.connect(g).connect(tone!);
  o.start(start);
  o.stop(start + 0.9);
}

function kick(start: number) {
  const o = ctx!.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(110, start);
  o.frequency.exponentialRampToValueAtTime(45, start + 0.18);
  const g = envGain(start, 0.005, 0.02, 0.28, 0.32);
  o.connect(g).connect(master!);
  o.start(start);
  o.stop(start + 0.35);
}

function noiseHit(start: number, freq: number, length: number, peak: number) {
  const src = ctx!.createBufferSource();
  src.buffer = noise;
  const f = ctx!.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 0.9;
  const g = envGain(start, 0.004, 0.01, length, peak);
  src.connect(f).connect(g).connect(master!);
  src.start(start, rand() * 0.5);
  src.stop(start + length + 0.05);
}

/** Schedule ahead of time (Web Audio clock), one beat at a time. */
function schedule() {
  if (!ctx) return;
  while (nextBeat < ctx.currentTime + 0.4) {
    const s = STYLES[era];
    const spb = 60 / s.bpm;
    const inBar = beat % 4;
    const bar = Math.floor(beat / 4) % 4;
    const chord = s.chords[bar];
    if (inBar === 0) {
      pad(chord, nextBeat, spb * 4, s);
      tone!.frequency.setTargetAtTime(s.cutoff, nextBeat, 1.5);
    }
    // Lazy, slightly swung groove.
    if (inBar === 0 || (inBar === 2 && rand() < 0.7)) kick(nextBeat);
    if (s.brush && (inBar === 1 || inBar === 3)) noiseHit(nextBeat, 2500, 0.22, 0.05);
    if (s.hats) {
      noiseHit(nextBeat, 8000, 0.05, 0.025);
      noiseHit(nextBeat + spb * 0.56, 8000, 0.04, 0.018);
    }
    if (s.arp && rand() < 0.55) pluck(chord[Math.floor(rand() * chord.length)] + 12, nextBeat + spb * 0.5, s);
    // Occasional vinyl crackle.
    if (rand() < 0.35) noiseHit(nextBeat + rand() * spb, 1200, 0.02, 0.012);
    nextBeat += spb;
    beat++;
  }
}

/** Start (or keep playing) the music for this island, fading in. Must follow a user gesture the first time. */
export function playLofi(next: EraId, volume = 0.5) {
  era = next;
  const c = setup();
  if (c.state === "suspended") {
    void c.resume();
    // Browsers only allow audio after a tap or click: resume on the next one if this call came without one.
    const resume = () => void c.resume();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
  }
  if (timer === null) {
    nextBeat = c.currentTime + 0.1;
    beat = 0;
    timer = window.setInterval(schedule, 100);
  }
  master!.gain.cancelScheduledValues(c.currentTime);
  master!.gain.setTargetAtTime(volume, c.currentTime, 0.8);
}

/** Fade out and stop scheduling. */
export function stopLofi() {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}
