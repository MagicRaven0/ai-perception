"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";

/**
 * THE PAST: the island's one shared material (vertex-coloured, flat-shaded Lambert) and its tier flag.
 * IslandPast creates both once and provides them; the building models (rendered inside <Building>, which is
 * inside the island tree) read them from context. Created per mount and disposed on unmount, so nothing
 * survives a trip to /read.
 */

type PastContext = { material: THREE.MeshLambertMaterial; low: boolean };

const Ctx = createContext<PastContext | null>(null);

export function makePastMaterial() {
  return new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
}

export function PastProvider({ low, children }: { low: boolean; children: ReactNode }) {
  const material = useMemo(() => makePastMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);
  const value = useMemo(() => ({ material, low }), [material, low]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The shared island material (falls back to an own material outside the provider). */
export function usePastMaterial(): THREE.MeshLambertMaterial {
  const ctx = useContext(Ctx);
  const fallback = useMemo(() => (ctx ? null : makePastMaterial()), [ctx]);
  useEffect(() => () => fallback?.dispose(), [fallback]);
  return ctx?.material ?? fallback!;
}

/** True on the Low tier (models bake their reels and drop small details). */
export function usePastLow(): boolean {
  return useContext(Ctx)?.low ?? false;
}
