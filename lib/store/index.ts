"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EraId } from "@/lib/content/schema";

/**
 * Global client state (PLAN.md section 5). Components select the single value they need.
 * Rules: the future R3F <Canvas> root subscribes to nothing; player position never goes through here.
 * Audio time lives in the audio engine and is mirrored here at most 4 times per second.
 */

export type Track = {
  id: string;
  title: string;
  src: string;
  kindLabel: string;
  eraLabel?: string;
  durationSec: number | null;
};

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

type State = {
  // ui
  viewMode: "2d" | "3d";
  // era
  activeEra: EraId;
  // audio (mirror of the engine)
  track: Track | null;
  status: AudioStatus;
  currentTime: number;
  duration: number;
  rate: number;
};

type Actions = {
  setViewMode: (mode: State["viewMode"]) => void;
  setActiveEra: (era: EraId) => void;
  setTrack: (track: Track | null) => void;
  setStatus: (status: AudioStatus) => void;
  setTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setRate: (rate: number) => void;
};

export const useStore = create<State & Actions>()(
  persist(
    (set) => ({
      viewMode: "2d",
      activeEra: "era-1",
      track: null,
      status: "idle",
      currentTime: 0,
      duration: 0,
      rate: 1,

      setViewMode: (viewMode) => set({ viewMode }),
      setActiveEra: (activeEra) => set((s) => (s.activeEra === activeEra ? s : { activeEra })),
      setTrack: (track) => set({ track, currentTime: 0, duration: track?.durationSec ?? 0 }),
      setStatus: (status) => set({ status }),
      setTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      setRate: (rate) => set({ rate }),
    }),
    {
      name: "ai-perception",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only these survive a reload: where you were listening, and how you like to view the site.
      partialize: (s) => ({ viewMode: s.viewMode, track: s.track, currentTime: s.currentTime, rate: s.rate }),
      skipHydration: true,
    },
  ),
);
