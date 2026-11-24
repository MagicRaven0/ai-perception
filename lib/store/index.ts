"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EraId } from "@/lib/content/schema";
import type { QualityPref, Tier } from "@/lib/three/quality";

/**
 * Global client state (PLAN.md section 5). Components select the single value they need.
 * Rules: the R3F <Canvas> root subscribes to nothing; player position never goes through here
 * (see lib/three/transient.ts). Sensors write here only on enter/leave, a few times a minute.
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

export type Toast = { id: number; message: string };

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
  // 3D world (Phase 3)
  /** Building whose proximity sensor the car is inside (drives the "Press E" prompt). */
  nearbyBuildingId: string | null;
  /** Insight signpost or figure the car is next to (`${eraId}-figure-${i}` for figures). */
  nearbySignId: string | null;
  /** Car is next to the guide character on The Future. */
  nearGuide: boolean;
  /** Building whose drawer is open (mirrored to ?b= in the URL). */
  openBuildingId: string | null;
  /** Buildings opened at least once (progress counter). Persisted. */
  visitedBuildingIds: string[];
  /** Visitor's quality choice. Persisted. */
  quality: QualityPref;
  /** Tier chosen by the performance monitor when quality is "auto". */
  autoTier: Tier;
  /** GPU / renderer description shown in Options. */
  renderer: string | null;
  /** World ambience (lo-fi music + ambient loops). Off until the visitor turns it on. Persisted. */
  ambienceOn: boolean;
  /** A building's video is playing with sound (the island music is ducked meanwhile). Not persisted. */
  videoSound: boolean;
  /** True while the car is a plane (set on take-off / landing; the HUD shows Land). Not persisted. */
  flying: boolean;
  /** Time of day in the 3D world (HUD button). Persisted. */
  timeOfDay: "day" | "sunset" | "night";
  /** Camera: high isometric overview (default) or the driver's seat. Not persisted. */
  cameraMode: "iso" | "driver";
  /** The overview camera is turned, tilted, zoomed or panned away from the default (HUD shows Recenter). */
  freeLook: boolean;
  // toasts (survive route changes, e.g. 3D -> reading mode)
  toast: Toast | null;
};

type Actions = {
  setViewMode: (mode: State["viewMode"]) => void;
  setActiveEra: (era: EraId) => void;
  setTrack: (track: Track | null) => void;
  setStatus: (status: AudioStatus) => void;
  setTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setRate: (rate: number) => void;
  enterBuilding: (id: string) => void;
  /** Clears the nearby building only if it is still this one (overlapping sensors). */
  leaveBuilding: (id: string) => void;
  enterSign: (id: string) => void;
  leaveSign: (id: string) => void;
  setNearGuide: (near: boolean) => void;
  openBuilding: (id: string) => void;
  closeBuilding: () => void;
  /** Leaving /explore (or tearing the world down): close the drawer and forget what the car was next to. */
  clearWorldPresence: () => void;
  resetProgress: () => void;
  setQuality: (quality: QualityPref) => void;
  setAutoTier: (tier: Tier) => void;
  setRenderer: (renderer: string | null) => void;
  setAmbienceOn: (on: boolean) => void;
  setVideoSound: (on: boolean) => void;
  toggleCameraMode: () => void;
  setFreeLook: (freeLook: boolean) => void;
  cycleTimeOfDay: () => void;
  setFlying: (flying: boolean) => void;
  showToast: (message: string) => void;
  clearToast: (id: number) => void;
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
      nearbyBuildingId: null,
      nearbySignId: null,
      nearGuide: false,
      openBuildingId: null,
      visitedBuildingIds: [],
      quality: "auto",
      autoTier: "high",
      renderer: null,
      ambienceOn: false,
      videoSound: false,
      cameraMode: "iso",
      freeLook: false,
      timeOfDay: "day",
      flying: false,
      toast: null,

      setViewMode: (viewMode) => set({ viewMode }),
      setActiveEra: (activeEra) => set((s) => (s.activeEra === activeEra ? s : { activeEra })),
      setTrack: (track) => set({ track, currentTime: 0, duration: track?.durationSec ?? 0 }),
      setStatus: (status) => set({ status }),
      setTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      setRate: (rate) => set({ rate }),

      enterBuilding: (id) => set((s) => (s.nearbyBuildingId === id ? s : { nearbyBuildingId: id })),
      leaveBuilding: (id) => set((s) => (s.nearbyBuildingId === id ? { nearbyBuildingId: null } : s)),
      enterSign: (id) => set((s) => (s.nearbySignId === id ? s : { nearbySignId: id })),
      leaveSign: (id) => set((s) => (s.nearbySignId === id ? { nearbySignId: null } : s)),
      setNearGuide: (nearGuide) => set((s) => (s.nearGuide === nearGuide ? s : { nearGuide })),
      openBuilding: (id) =>
        set((s) => ({
          openBuildingId: id,
          visitedBuildingIds: s.visitedBuildingIds.includes(id) ? s.visitedBuildingIds : [...s.visitedBuildingIds, id],
        })),
      closeBuilding: () => set((s) => (s.openBuildingId === null ? s : { openBuildingId: null })),
      clearWorldPresence: () =>
        set((s) =>
          s.openBuildingId === null && s.nearbyBuildingId === null && s.nearbySignId === null && !s.nearGuide
            ? s
            : { openBuildingId: null, nearbyBuildingId: null, nearbySignId: null, nearGuide: false },
        ),
      resetProgress: () => set({ visitedBuildingIds: [] }),
      setQuality: (quality) => set({ quality }),
      setAutoTier: (autoTier) => set((s) => (s.autoTier === autoTier ? s : { autoTier })),
      setRenderer: (renderer) => set({ renderer }),
      setAmbienceOn: (ambienceOn) => set({ ambienceOn }),
      setVideoSound: (videoSound) => set({ videoSound }),
      setFlying: (flying) => set((s) => (s.flying === flying ? s : { flying })),
      cycleTimeOfDay: () =>
        set((s) => ({ timeOfDay: s.timeOfDay === "day" ? "sunset" : s.timeOfDay === "sunset" ? "night" : "day" })),
      toggleCameraMode: () => set((s) => ({ cameraMode: s.cameraMode === "iso" ? "driver" : "iso" })),
      setFreeLook: (freeLook) => set((s) => (s.freeLook === freeLook ? s : { freeLook })),
      showToast: (message) => set({ toast: { id: Date.now(), message } }),
      clearToast: (id) => set((s) => (s.toast?.id === id ? { toast: null } : s)),
    }),
    {
      name: "ai-perception",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only these survive a reload: where you were listening, how you like to view the site, 3D progress.
      partialize: (s) => ({
        viewMode: s.viewMode,
        track: s.track,
        currentTime: s.currentTime,
        rate: s.rate,
        visitedBuildingIds: s.visitedBuildingIds,
        quality: s.quality,
        ambienceOn: s.ambienceOn,
        timeOfDay: s.timeOfDay,
      }),
      // Rehydration can run after a deep link already opened a building: keep both lists of visited ids.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        const visited = Array.isArray(p.visitedBuildingIds) ? p.visitedBuildingIds : [];
        return {
          ...current,
          ...p,
          visitedBuildingIds: Array.from(new Set([...visited, ...current.visitedBuildingIds])),
        };
      },
      skipHydration: true,
    },
  ),
);

// Development only: inspect the store from DevTools and the e2e tests (window.__store.getState()).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __store?: typeof useStore }).__store = useStore;
}
