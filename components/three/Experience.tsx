"use client";

import { memo, Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useStore } from "@/lib/store";
import type { Pose, WorldLayout } from "@/lib/three/layout";
import { dprFor, initialAutoTier, RES_STEPS, selectTier, startResStep, TIERS, type Tier } from "@/lib/three/quality";
import World from "./World";

/**
 * SHARED. The <Canvas> root. It subscribes to NOTHING (PLAN.md 5.2): quality, frame loop and context-loss
 * handling are small child controllers that each select one value. Props are stable (memo), so the canvas
 * never re-renders while driving.
 */

type Props = {
  world: WorldLayout;
  /** Where the car starts (deep link, era spawn or saved position). */
  start: Pose;
  /** First frame rendered (physics loaded, all three islands in, scene drawn): clears the load watchdog (LOAD_TIMEOUT_MS, 20 s). */
  onReady: () => void;
  /** WebGL context lost: the page switches to reading mode. */
  onLost: () => void;
};

function Experience({ world, start, onReady, onLost }: Props) {
  // Settings fixed at context creation come from the starting tier (read once, not subscribed).
  const [startTier] = useState(startingTier);
  return (
    <Canvas
      shadows="percentage"
      flat
      dpr={dprFor(startTier, startResStep())}
      gl={{ antialias: TIERS[startTier].antialias, powerPreference: "high-performance", alpha: false }}
      frameloop="always"
      onCreated={({ gl }) => {
        const ctx = gl.getContext();
        const info = ctx.getExtension("WEBGL_debug_renderer_info");
        const renderer = info ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "WebGL 2";
        useStore.getState().setRenderer(renderer);
        // Development only: renderer.info (draw calls, triangles) for checking the PLAN 6.4 budget.
        if (process.env.NODE_ENV !== "production") {
          const w = window as unknown as { __explore?: Record<string, unknown> };
          if (w.__explore) w.__explore.gl = gl;
        }
      }}
      style={{ touchAction: "none" }}
    >
      <QualityController startTier={startTier} />
      <FrameloopController />
      <ContextLossWatcher onLost={onLost} />
      <Suspense fallback={null}>
        <World world={world} start={start} onFirstFrame={onReady} />
      </Suspense>
    </Canvas>
  );
}

export default memo(Experience);

/** Starting tier: the visitor's choice, or on Auto a guess from the device (phones / small memory start low). */
function startingTier(): Tier {
  const s = useStore.getState();
  return s.quality === "auto" ? initialAutoTier() : s.quality;
}

/** Applies the tier (DPR, shadows) and lets drei's PerformanceMonitor move the auto tier. */
function QualityController({ startTier }: { startTier: Tier }) {
  const tier = useStore(selectTier);

  // Auto starts from the device guess; the performance monitor moves it from there.
  useEffect(() => {
    const s = useStore.getState();
    if (s.quality === "auto") s.setAutoTier(startTier);
  }, [startTier]);
  const setDpr = useThree((s) => s.setDpr);
  const get = useThree((s) => s.get);

  // How far below Low's full resolution the picture is drawn (RES_STEPS).
  const resStep = useRef(startResStep());

  useEffect(() => {
    setDpr(dprFor(tier, resStep.current));
    const { gl, scene } = get();
    const shadows = TIERS[tier].shadows;
    if (gl.shadowMap.enabled !== shadows) {
      gl.shadowMap.enabled = shadows;
      gl.shadowMap.needsUpdate = true;
      // Materials compile differently with and without shadows.
      scene.traverse((o) => {
        const m = (o as { material?: { needsUpdate: boolean } | { needsUpdate: boolean }[] }).material;
        if (Array.isArray(m)) m.forEach((x) => (x.needsUpdate = true));
        else if (m) m.needsUpdate = true;
      });
    }
  }, [tier, setDpr, get]);

  // Real drops from High to Low so far. drei's own `flipflops` limit is NOT used: it counts every "still fast"
  // reading as a flip too, so a machine at a steady 165 fps hit the limit after 10 s and was sent to Low for good.
  const drops = useRef(0);
  const onDecline = () => {
    const s = useStore.getState();
    if (selectTier(s) === "low") {
      // Still slow on Low: fewer pixels, which costs nothing to switch.
      if (s.quality !== "auto" || resStep.current >= RES_STEPS.length - 1) return;
      setDpr(dprFor("low", ++resStep.current));
      return;
    }
    if (s.quality !== "auto") return;
    drops.current++;
    s.setAutoTier("low");
  };
  const onIncline = () => {
    const s = useStore.getState();
    // Each switch rebuilds every merged model and shader: one second chance, then stay on Low.
    if (s.quality !== "auto" || s.autoTier === "high" || drops.current >= MAX_DROPS || startResStep() > 0) return;
    s.setAutoTier("high");
  };

  return (
    <PerformanceMonitor
      bounds={(refresh) => (refresh > 90 ? [50, 80] : [38, 55])}
      onDecline={onDecline}
      onIncline={onIncline}
    />
  );
}

/** After this many drops to Low, Auto stays on Low for the visit. */
const MAX_DROPS = 2;

/**
 * Stops rendering while the browser tab is hidden. (Leaving /explore for another route unmounts the whole
 * canvas instead: see components/explore/ExploreClient.tsx.)
 */
function FrameloopController() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setFrameloop]);
  return null;
}

/**
 * WebGL context lost -> reading mode. The listener is removed on unmount BEFORE R3F disposes the renderer
 * (which force-loses the context), so React Strict Mode's double mount never triggers a false fallback.
 */
function ContextLossWatcher({ onLost }: { onLost: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    let active = true;
    const onLoss = (e: Event) => {
      e.preventDefault();
      // Give an unmount in the same tick the chance to cancel (it sets active = false).
      setTimeout(() => active && onLost(), 0);
    };
    canvas.addEventListener("webglcontextlost", onLoss);
    return () => {
      active = false;
      canvas.removeEventListener("webglcontextlost", onLoss);
    };
  }, [gl, onLost]);
  return null;
}
