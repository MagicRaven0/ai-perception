import type { Pose } from "./layout";

/**
 * Transient channel (PLAN.md 5.2). Values that change every frame live in these plain mutable objects,
 * never in React state or the Zustand store:
 * - the vehicle writes `player` every frame;
 * - the minimap and the camera read it in their own loops;
 * - keyboard / touch arrow pad write `input`; tap-to-drive writes `autoDrive`; the vehicle reads both every frame;
 * - anyone may `requestTeleport()`; the vehicle applies it on its next physics frame and bumps `teleports`
 *   so the camera can snap instead of easing across the map.
 *
 * No React, no three.js: safe to import from the HUD before the 3D chunk loads.
 */

export const player = {
  x: 0,
  y: 0,
  z: 0,
  /** Rotation about Y; local +Z faces (sin h, cos h). */
  heading: 0,
  /** Ground speed in m/s. */
  speed: 0,
  /** True once the vehicle has rendered its first physics frame. */
  ready: false,
  /** Increments after every applied teleport (camera snaps when it changes). */
  teleports: 0,
  /** True while the car has taken off from a runway and is a plane. */
  flying: false,
};

/** Flight requests from the HUD / keys (the vehicle applies them on its next frame). */
export const flight = { landRequested: false };

export function requestLanding() {
  flight.landRequested = true;
}

export const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
  boost: false,
  /** Analog steering/throttle, -1..1 (x right, y up); unused since the touch joystick became an arrow pad. */
  joyX: 0,
  joyY: 0,
};

/**
 * Overview camera orbit (360° view). `target` is where the visitor wants to look from (radians added to the
 * default azimuth); the camera eases `yaw` toward it. Drag on the world, or Q / Z, change it.
 */
export const orbit = { yaw: 0, target: 0, dragging: false };

/** Rotate the overview by a step (Q / Z keys). */
export function rotateView(step: number) {
  orbit.target += step;
}

/**
 * Tap-to-drive: tap (or click) a spot on the island and the car drives there by itself.
 * Set by CameraRig, followed by the vehicle, cancelled by any manual driving, a teleport, arrival or getting stuck.
 */
export const autoDrive = { active: false, x: 0, z: 0 };

export function setAutoDrive(x: number, z: number) {
  autoDrive.x = x;
  autoDrive.z = z;
  autoDrive.active = true;
}

export function cancelAutoDrive() {
  autoDrive.active = false;
}

/** Lift every touch button (when the touch controls unmount). */
export function releaseInputs() {
  input.forward = input.backward = input.left = input.right = input.boost = false;
}

/** Touch arrow pad / Boost: press or release one input (manual steering cancels tap-to-drive). */
export function setInput(key: "forward" | "backward" | "left" | "right" | "boost", down: boolean) {
  if (down && key !== "boost") autoDrive.active = false;
  input[key] = down;
}

let pendingTeleport: Pose | null = null;

/** Ask the vehicle to move to a pose (fast travel, deep links, respawn). Applied on the next frame. */
export function requestTeleport(pose: Pose) {
  autoDrive.active = false;
  pendingTeleport = { ...pose };
}

/** Vehicle only: take the pending teleport, if any. */
export function takeTeleport(): Pose | null {
  const p = pendingTeleport;
  pendingTeleport = null;
  return p;
}

/** Set the pose the vehicle mounts at (before the 3D chunk loads). */
export function setInitialPose(pose: Pose) {
  player.x = pose.x;
  player.y = pose.y;
  player.z = pose.z;
  player.heading = pose.heading;
  player.speed = 0;
  player.ready = false;
}

/* ------------------------------------------------------- saved position */

const SAVE_KEY = "explore-position";

/** Remember where the car is (sessionStorage, so a reload in the same tab resumes there). */
export function savePosition() {
  if (!player.ready) return;
  try {
    sessionStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ x: player.x, y: Math.max(player.y, 1.2), z: player.z, heading: player.heading }),
    );
  } catch {
    // Storage blocked: nothing to resume, which is fine.
  }
}

export function loadSavedPosition(): Pose | null {
  try {
    const raw = sessionStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pose;
    return [p.x, p.y, p.z, p.heading].every((n) => typeof n === "number" && Number.isFinite(n)) ? p : null;
  } catch {
    return null;
  }
}

export function clearSavedPosition() {
  try {
    sessionStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------ keyboard */

/** True when a key press belongs to a text field or an open dialog, not to driving. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(target.closest("[role='dialog'], [role='tablist'], [role='radiogroup']"));
}

const KEYMAP: Record<string, keyof typeof input> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "brake",
  ShiftLeft: "boost",
  ShiftRight: "boost",
};

function resetInput() {
  input.forward = input.backward = input.left = input.right = input.brake = input.boost = false;
  input.joyX = input.joyY = 0;
}

/** WASD / arrows / Space / Shift -> `input`. Returns a cleanup function. */
export function attachKeyboard(): () => void {
  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    const key = KEYMAP[e.code];
    if (!key) return;
    if (down && (e.metaKey || e.ctrlKey || e.altKey)) return;
    if (down && isTypingTarget(e.target)) return;
    // Space on a focused button or link activates it; leave that alone.
    if (key === "brake" && e.target instanceof HTMLElement && e.target.closest("button, a")) return;
    // Arrows and Space would scroll the page or press a focused button.
    if (down) e.preventDefault();
    // Manual driving takes over from tap-to-drive.
    if (down && key !== "boost") autoDrive.active = false;
    (input as Record<string, boolean | number>)[key] = down;
  };
  const down = onKey(true);
  const up = onKey(false);
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", resetInput);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", resetInput);
    resetInput();
  };
}

/* --------------------------------------------------------------- debug */

// Development only: lets DevTools and the e2e tests inspect the car (window.__explore.player).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __explore?: unknown }).__explore = {
    player,
    input,
    requestTeleport,
    orbit,
    autoDrive,
    flight,
  };
}
