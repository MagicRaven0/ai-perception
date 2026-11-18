/**
 * Capability gate for /explore (PLAN.md 6.6). Runs before any 3D code is downloaded.
 * No React, no three.js. Missing browser APIs (deviceMemory, connection in Safari/Firefox) count as a pass.
 */

export type Capabilities = {
  webgl2: boolean;
  /** navigator.deviceMemory < 4 (GB). */
  lowMemory: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** Coarse pointer and a narrow screen: offer a choice instead of loading 3D straight away. */
  phone: boolean;
};

export type GateVerdict = "ok" | "fallback" | "choose";

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    // Free the probe context straight away (browsers cap the number of live contexts).
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

let cached: Capabilities | null = null;

/** Detects once per page load and caches the result (stable object for useSyncExternalStore). */
export function detectCapabilities(): Capabilities {
  if (cached) return cached;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const mq = (q: string) => typeof window.matchMedia === "function" && window.matchMedia(q).matches;
  cached = {
    webgl2: hasWebGL2(),
    lowMemory: typeof nav.deviceMemory === "number" && nav.deviceMemory < 4,
    reducedMotion: mq("(prefers-reduced-motion: reduce)"),
    saveData: nav.connection?.saveData === true,
    phone: mq("(pointer: coarse)") && mq("(max-width: 767px)"),
  };
  return cached;
}

/** "fallback" when 3D would be a bad experience, "choose" on phones, otherwise "ok". */
export function gateVerdict(c: Capabilities): GateVerdict {
  if (!c.webgl2 || c.lowMemory || c.reducedMotion || c.saveData) return "fallback";
  if (c.phone) return "choose";
  return "ok";
}

/** Plain-language reasons for the fallback screen. */
export function fallbackReasons(c: Capabilities): string[] {
  const reasons: string[] = [];
  if (!c.webgl2) reasons.push("This browser cannot draw 3D graphics (WebGL 2 is not available).");
  if (c.lowMemory) reasons.push("This device has little memory, so the 3D world may be slow.");
  if (c.reducedMotion) reasons.push("Your system asks for reduced motion.");
  if (c.saveData) reasons.push("Data Saver is on, and the 3D world is a large download.");
  return reasons;
}

/**
 * PLAN 6.6: 3D that has not drawn its first frame 10 s after loading started (visible-tab time) falls back to
 * reading mode. One budget for everything before that frame: the 3D chunk, physics (WASM), the three island
 * chunks and the first render. The same in development, so probes on the dev server see the real limit
 * (open /explore once after a restart so Turbopack has compiled the 3D code before timing anything).
 */
export const LOAD_TIMEOUT_MS = 10_000;

const FORCE_KEY = "explore-force-3d";
const FAILED_KEY = "explore-3d-failed";

/* Tab-scoped gate flags (sessionStorage), with a tiny subscription so the /explore shell re-renders when
   they change (useSyncExternalStore). Both survive a reload in the same tab, never across tabs. */
const listeners = new Set<() => void>();

export function subscribeGate(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function write(key: string, on: boolean) {
  try {
    if (on) sessionStorage.setItem(key, "1");
    else sessionStorage.removeItem(key);
  } catch {
    // Storage blocked: the flag simply is not remembered.
  }
  listeners.forEach((fn) => fn());
}

function read(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** "Try 3D anyway" / "Explore in 3D" choice, remembered for this tab. Also clears an earlier failure. */
export function rememberForce3d() {
  write(FAILED_KEY, false);
  write(FORCE_KEY, true);
}

export function isForce3d(): boolean {
  return read(FORCE_KEY);
}

export function clearForce3d() {
  write(FORCE_KEY, false);
}

/**
 * 3D failed in this tab (load error, 10 s watchdog, lost WebGL context). From then on /explore shows the
 * reading-mode screen with "Try 3D anyway" instead of retrying (and bouncing) on every visit.
 */
export function markFailed3d() {
  write(FORCE_KEY, false);
  write(FAILED_KEY, true);
}

export function hasFailed3d(): boolean {
  return read(FAILED_KEY);
}

/** Reason line for the reading-mode screen after a failure. */
export const FAILED_REASON = "The 3D world stopped working on this device earlier in this visit.";
