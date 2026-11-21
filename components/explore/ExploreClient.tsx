"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { ExploreData } from "@/lib/three/explore-data";
import {
  detectCapabilities,
  FAILED_REASON,
  fallbackReasons,
  gateVerdict,
  hasFailed3d,
  isForce3d,
  LOAD_TIMEOUT_MS,
  markFailed3d,
  rememberForce3d,
  subscribeGate,
} from "@/lib/three/capabilities";
import type { EraId } from "@/lib/content/schema";
import { findBuilding, isEraId, type Pose, type WorldLayout } from "@/lib/three/layout";
import { loadSavedPosition, savePosition } from "@/lib/three/transient";
import { Hud } from "@/components/hud/Hud";
import { SKIP_LINK_ID } from "@/components/layout/SkipLink";
import { UrlSync } from "./UrlSync";

/**
 * /explore client shell (PLAN 6.6). Checks capabilities BEFORE downloading any 3D code:
 * - no WebGL 2, low memory, reduced motion or Save-Data -> 2D fallback with "Try 3D anyway";
 * - phones -> a clear choice between "Explore in 3D" and "Read in 2D";
 * - otherwise loads the 3D chunk. If it fails, times out or loses the WebGL context, a toast says
 *   "3D stopped, switched to reading mode" and the visitor lands in /read (the audio dock and chat live in
 *   the root layout, so audio keeps playing). The failure is remembered for the tab: coming back shows the
 *   reading-mode screen with "Try 3D anyway" instead of retrying and bouncing again.
 * Watchdog (PLAN 6.6, raised to 20 s): LOAD_TIMEOUT_MS from the start of loading to the first frame (3D code, physics, the islands' own
 * chunks and the first render; see lib/three/capabilities.ts). It only counts while the browser tab is visible: a
 * background tab runs timers but no animation frames, so it can never draw its first frame there.
 * Hidden -> no timer; visible again -> a fresh timer with the full limit.
 *
 * Activity (Next 16 Cache Components): after navigating away, Next keeps this page mounted but hidden.
 * The layout-effect cleanup below runs on hide: it tears the whole 3D tree down (canvas, WebGL context,
 * physics, render loop, keyboard listeners, HUD), closes the drawer and forgets proximity state. Coming back
 * builds a fresh world at the saved position (or the ?era= / ?b= in the new URL).
 * `data-explore-state` (gate | fallback | choose | loading | ready) is for tests.
 */

/**
 * The "Explore in 3D" / "Try 3D anyway" button is removed when 3D starts loading, which would drop focus to
 * <body> mid-page (the next Tab would skip the skip link). Focus the skip link instead: it is the first
 * focusable element, it survives the switch, and it names the way back ("Go to reading mode").
 */
function focusSkipLink() {
  document.getElementById(SKIP_LINK_ID)?.focus({ preventScroll: true });
}

/** "Explore in 3D" on the phone choice screen. */
function explore3d() {
  focusSkipLink();
  rememberForce3d();
}

/** "Try 3D anyway": forget an earlier failure (and its toast) and load 3D. */
function retry3d() {
  const s = useStore.getState();
  if (s.toast) s.clearToast(s.toast.id);
  focusSkipLink();
  rememberForce3d();
}

const Experience = lazy(() => import("@/components/three/Experience"));

const noopSubscribe = () => () => {};
const subscribeTabVisibility = (fn: () => void) => {
  document.addEventListener("visibilitychange", fn);
  return () => document.removeEventListener("visibilitychange", fn);
};

/** Is /explore on screen? Set from the layout effect below; one /explore page exists at a time. */
const onScreen = { value: false, listeners: new Set<() => void>() };
function setOnScreen(value: boolean) {
  onScreen.value = value;
  onScreen.listeners.forEach((fn) => fn());
}
const subscribeOnScreen = (fn: () => void) => {
  onScreen.listeners.add(fn);
  return () => onScreen.listeners.delete(fn);
};

export function ExploreClient({ data }: { data: ExploreData }) {
  const router = useRouter();
  const caps = useSyncExternalStore(noopSubscribe, detectCapabilities, () => null);
  const forced = useSyncExternalStore(subscribeGate, isForce3d, () => false);
  const failed = useSyncExternalStore(subscribeGate, hasFailed3d, () => false);
  /** This route is on screen (false while Next keeps it hidden after a navigation). */
  const shown = useSyncExternalStore(
    subscribeOnScreen,
    () => onScreen.value,
    () => false,
  );
  /** The browser tab is in the background (no animation frames, so no first frame either). */
  const tabHidden = useSyncExternalStore(
    subscribeTabVisibility,
    () => document.hidden,
    () => false,
  );
  const [ready, setReady] = useState(false);
  /** Read by fail() without making it change identity (it is a prop of the memoised canvas root). */
  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  const verdict = caps ? (failed ? "fallback" : gateVerdict(caps)) : null;
  const want3d = verdict === "ok" || (forced && !failed);
  const run3d = shown && want3d;
  const state = !caps || !shown ? "gate" : want3d ? (ready ? "ready" : "loading") : (verdict ?? "fallback");

  useLayoutEffect(() => {
    setOnScreen(true);
    return () => {
      // Hidden by Activity (or unmounted): drop the 3D tree; remember where the car was.
      setOnScreen(false);
      savePosition();
      useStore.getState().clearWorldPresence();
      setReady(false);
    };
  }, []);

  // Where the car starts. Computed on the client only (reads the URL and sessionStorage), again on every return.
  const start = useMemo(() => (run3d ? initialPose(data.world) : null), [run3d, data.world]);

  const fail = useCallback(() => {
    // Teardown on hide also ends the context: that is not a failure.
    if (!onScreen.value) return;
    markFailed3d();
    const s = useStore.getState();
    s.showToast("3D stopped, switched to reading mode");
    s.setViewMode("2d");
    // Before the world is ready the car has not reported an island yet: use the island the URL asked for.
    const era = (readyRef.current ? null : urlEra(data.world)) ?? s.activeEra;
    const slug = data.eras.find((e) => e.id === era)?.slug;
    router.push(slug ? `/read/${slug}` : "/read");
  }, [router, data.eras, data.world]);

  // Watchdog: the first frame (code, physics, islands, first render) within LOAD_TIMEOUT_MS (20 s), counted only while the tab
  // is visible. The fire-time check also covers a tab hidden without a visibilitychange event.
  useEffect(() => {
    if (state !== "loading" || tabHidden) return;
    const t = setTimeout(() => {
      if (!document.hidden) fail();
    }, loadTimeout());
    return () => clearTimeout(t);
  }, [state, tabHidden, fail]);

  useEffect(() => {
    if (state === "ready") useStore.getState().setViewMode("3d");
  }, [state]);

  const onReady = useCallback(() => setReady(true), []);
  const reasons = caps ? (failed ? [FAILED_REASON, ...fallbackReasons(caps)] : fallbackReasons(caps)) : [];

  return (
    <div data-explore-state={state} className="fixed inset-0 overflow-hidden bg-sky-bottom">
      {run3d && start && (
        <main className="absolute inset-0">
          <h1 className="sr-only">Explore the islands</h1>
          <div className="absolute inset-0 z-canvas" aria-hidden="true">
            <ErrorBoundary onError={fail}>
              <Suspense fallback={null}>
                <Experience world={data.world} start={start} onReady={onReady} onLost={fail} />
              </Suspense>
            </ErrorBoundary>
          </div>
          {/* The HUD exists only once the world does: nothing to click or Tab to behind the loading screen. */}
          {state === "ready" ? <Hud data={data} /> : <Loading />}
          <Suspense fallback={null}>
            <UrlSync data={data} ready={state === "ready"} />
          </Suspense>
        </main>
      )}

      {state === "gate" && <Loading />}
      {state === "fallback" && caps && <Fallback data={data} reasons={reasons} onTry={retry3d} />}
      {state === "choose" && <Choose data={data} onExplore={explore3d} />}
    </div>
  );
}

/**
 * The load limit. Development only: e2e tests that run several software-WebGL browsers at once raise it with
 * `window.__exploreLoadTimeoutMs`, so a busy CPU is not mistaken for a broken device. Production always uses
 * LOAD_TIMEOUT_MS (20 s).
 */
function loadTimeout(): number {
  if (process.env.NODE_ENV === "production") return LOAD_TIMEOUT_MS;
  const override = (window as { __exploreLoadTimeoutMs?: unknown }).__exploreLoadTimeoutMs;
  return typeof override === "number" && override > 0 ? override : LOAD_TIMEOUT_MS;
}

/** Island the URL asks for: the ?b= building's island, else ?era=. */
function urlEra(world: WorldLayout): EraId | null {
  const params = new URLSearchParams(window.location.search);
  const b = params.get("b");
  const placed = b ? findBuilding(world, b) : undefined;
  if (placed) return placed.eraId;
  const era = params.get("era");
  return isEraId(era) ? era : null;
}

/** Start pose: ?b= building, else ?era= spawn, else where this tab last was, else the active era's spawn. */
function initialPose(world: WorldLayout): Pose {
  const params = new URLSearchParams(window.location.search);
  const b = params.get("b");
  const placed = b ? findBuilding(world, b) : undefined;
  if (placed) return placed.approach;
  const era = params.get("era");
  if (isEraId(era)) return world.islands[era].spawn;
  const saved = loadSavedPosition();
  if (saved) return saved;
  return world.islands[useStore.getState().activeEra].spawn;
}

/**
 * Calm, time-based loading lines. There is no real byte progress to show (so no percentage or bar): the text
 * only reassures that a slow load on busy Wi-Fi is normal. It changes twice at most, so screen readers hear
 * it a few times, not constantly. "Read in 2D instead" stays outside the live region, one click away.
 */
const LOADING_STEPS = [
  { after: 0, title: "Loading the islands…", detail: "Getting the 3D world ready." },
  { after: 6_000, title: "Still loading…", detail: "Busy Wi-Fi can make this slow. It is safe to wait." },
  { after: 14_000, title: "Nearly there…", detail: "Thanks for waiting. The same story is also ready to read in 2D." },
] as const;

function Loading() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = LOADING_STEPS.slice(1).map((s, i) => setTimeout(() => setStep(i + 1), s.after));
    return () => timers.forEach(clearTimeout);
  }, []);
  const current = LOADING_STEPS[step] ?? LOADING_STEPS[0];
  return (
    <div className="absolute inset-0 z-hud flex items-center justify-center bg-linear-to-b from-sky-top to-sky-bottom px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[20px] bg-paper px-8 py-6 text-center text-ink shadow-card">
        <span
          className="size-8 animate-spin rounded-full border-4 border-rule border-t-ink motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div role="status" className="flex flex-col gap-1">
          <p className="font-semibold">{current.title}</p>
          <p className="text-sm text-muted">{current.detail}</p>
        </div>
        <Link
          href="/read"
          className="rounded-full border border-ink px-5 py-2 text-sm font-semibold hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Read in 2D instead
        </Link>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main
      id="main"
      className="absolute inset-0 flex items-start justify-center overflow-y-auto bg-linear-to-b from-sky-top to-sky-bottom px-4 pt-16 pb-28"
    >
      <div className="w-full max-w-xl rounded-[24px] bg-paper p-6 text-ink shadow-card md:p-10">
        <h1 className="font-display text-4xl font-medium tracking-headline md:text-5xl">{title}</h1>
        {children}
      </div>
    </main>
  );
}

function IslandLinks({ data }: { data: ExploreData }) {
  return (
    <nav aria-label="Islands" className="mt-8 border-t border-rule">
      <ul>
        {data.eras.map((e) => (
          <li key={e.id} className="border-b border-rule">
            <Link href={`/read/${e.slug}`} className="flex items-baseline justify-between gap-4 py-3 hover:underline">
              <span className="font-semibold">{e.islandName}</span>
              <span className="text-muted">{e.years}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Fallback({ data, reasons, onTry }: { data: ExploreData; reasons: string[]; onTry: () => void }) {
  return (
    <Panel title="Reading mode">
      <p className="mt-4 text-lg leading-snug">
        The 3D islands are switched off on this device, so you get the same story as a long read.
      </p>
      <ul className="mt-4 list-disc pl-5 text-muted">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/read" className="rounded-full bg-ink px-6 py-3 font-semibold text-paper">
          Read in 2D
        </Link>
        <button
          type="button"
          onClick={onTry}
          className="rounded-full border border-ink px-6 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Try 3D anyway
        </button>
      </div>
      <IslandLinks data={data} />
    </Panel>
  );
}

function Choose({ data, onExplore }: { data: ExploreData; onExplore: () => void }) {
  return (
    <Panel title="How do you want to explore?">
      <p className="mt-4 text-lg leading-snug">
        Drive a little car between three islands, or read the same story as a long read. Audio and the guide work in
        both.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onExplore}
          className="rounded-full bg-ink px-6 py-3 font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Explore in 3D
        </button>
        <Link href="/read" className="rounded-full border border-ink px-6 py-3 text-center font-semibold">
          Read in 2D
        </Link>
      </div>
      <p className="mt-3 text-sm text-muted">3D is a bigger download and works best on Wi-Fi.</p>
      <IslandLinks data={data} />
    </Panel>
  );
}

/** Any error while loading or running the 3D chunk -> reading mode. */
class ErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
