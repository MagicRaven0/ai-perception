"use client";

import { useStore, type Track } from "@/lib/store";
import { isPlaceholder, placeholderLabel } from "@/lib/content/placeholder";

/**
 * One HTMLAudioElement for the whole app. It lives outside React, so audio keeps playing while
 * routes change (2D <-> 3D). React reads a 4 Hz mirror of its state from the store.
 */

let audio: HTMLAudioElement | null = null;
let lastTick = 0;

function el(): HTMLAudioElement {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "metadata";
  const s = () => useStore.getState();

  audio.addEventListener("timeupdate", () => {
    const now = performance.now();
    if (now - lastTick < 250) return; // 4 updates per second max
    lastTick = now;
    s().setTime(audio!.currentTime);
  });
  audio.addEventListener("seeked", () => s().setTime(audio!.currentTime));
  audio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(audio!.duration)) s().setDuration(audio!.duration);
  });
  audio.addEventListener("waiting", () => s().setStatus("loading"));
  audio.addEventListener("playing", () => s().setStatus("playing"));
  audio.addEventListener("pause", () => {
    if (!audio!.ended) s().setStatus("paused");
    s().setTime(audio!.currentTime);
  });
  audio.addEventListener("ended", () => s().setStatus("ended"));
  audio.addEventListener("error", () => s().setStatus("error"));
  audio.addEventListener("ratechange", () => s().setRate(audio!.playbackRate));

  setupMediaSession();
  return audio;
}

function setupMediaSession() {
  if (!("mediaSession" in navigator)) return;
  const ms = navigator.mediaSession;
  ms.setActionHandler("play", () => void play());
  ms.setActionHandler("pause", () => pause());
  ms.setActionHandler("seekbackward", (d) => seekBy(-(d.seekOffset ?? 15)));
  ms.setActionHandler("seekforward", (d) => seekBy(d.seekOffset ?? 15));
  ms.setActionHandler("seekto", (d) => d.seekTime !== undefined && seek(d.seekTime));
}

function updateMediaMetadata(track: Track) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: isPlaceholder(track.title) ? placeholderLabel(track.title) : track.title,
    artist: "The Evolution of AI Perception",
    album: track.eraLabel ?? track.kindLabel,
  });
}

/** Load a track (without playing) and optionally jump to a time. */
export function load(track: Track, startAt = 0) {
  const a = el();
  const store = useStore.getState();
  const same = store.track?.id === track.id && a.src.endsWith(track.src);
  if (!same) {
    store.setTrack(track);
    a.src = track.src;
    a.playbackRate = store.rate;
    updateMediaMetadata(track);
  }
  if (startAt > 0 || !same) seek(startAt);
}

/** Load (if needed) and play. Must be called from a user gesture the first time (browser autoplay rules). */
export async function play(track?: Track, startAt?: number) {
  const a = el();
  if (track) load(track, startAt ?? 0);
  else if (startAt !== undefined) seek(startAt);
  if (!a.src) return;
  try {
    await a.play();
  } catch {
    useStore.getState().setStatus("paused");
  }
}

export function pause() {
  audio?.pause();
}

export function toggle() {
  const a = el();
  if (a.paused) void play();
  else pause();
}

export function seek(t: number) {
  const a = el();
  const max = Number.isFinite(a.duration) ? a.duration : Infinity;
  const time = Math.max(0, Math.min(t, max));
  try {
    a.currentTime = time;
  } catch {
    // Not seekable yet; apply once metadata arrives.
    a.addEventListener("loadedmetadata", () => (a.currentTime = time), { once: true });
  }
  useStore.getState().setTime(time);
}

export function seekBy(delta: number) {
  seek(el().currentTime + delta);
}

export function setRate(rate: number) {
  el().playbackRate = rate;
}

/** Restore the last track after a reload, paused at the saved position. */
export function restore() {
  const { track, currentTime } = useStore.getState();
  if (track && !audio?.src) {
    load(track, 0);
    seek(currentTime);
    useStore.getState().setStatus("paused");
  }
}
