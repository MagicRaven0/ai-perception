/**
 * SHARED. prefers-reduced-motion for frame loops, read without React state: `motion.reduced` is a plain
 * boolean that follows the media query live. Normally reduced motion lands in reading mode (PLAN 6.6), so
 * this only matters after "Try 3D anyway": then nothing moves on its own (no bobbing, spinning or swaying,
 * and the camera follows without easing). Movement the visitor causes (driving, wheel spin) stays.
 * Island agents: check `motion.reduced` in any decorative useFrame animation and hold the rest pose.
 */
export const motion = { reduced: false };

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  motion.reduced = mq.matches;
  mq.addEventListener("change", () => {
    motion.reduced = mq.matches;
  });
}
