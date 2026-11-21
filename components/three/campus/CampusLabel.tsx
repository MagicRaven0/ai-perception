"use client";

import { useRef } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { site } from "@/content/site";

/**
 * The university name as a DOM world label (PLAN 7.1 layer 10, "floating signs, drei Html, used sparingly")
 * floating over the entrance sign, below the `lg` breakpoint only. On a phone the 3D sign's lettering is a few
 * pixels tall; this label is real text at a readable size and costs no draw call. Wider screens read the 3D sign
 * itself, so the label is hidden there.
 *
 * Near a screen edge the label slides inward so it is never cut off (the campus is often half on screen at the
 * Future's spawn); when the sign is well off screen the label stays with it, off screen.
 */

const projected = new THREE.Vector3();
/** Gap kept between the label and the screen edge, px. */
const EDGE = 8;

export function CampusLabel({ position }: { position: [number, number, number] }) {
  const label = useRef<HTMLSpanElement>(null);
  const width = useRef(0);

  const place = (el: THREE.Object3D, camera: THREE.Camera, size: { width: number; height: number }) => {
    projected.setFromMatrixPosition(el.matrixWorld).project(camera);
    const x = ((projected.x + 1) / 2) * size.width;
    const y = ((1 - projected.y) / 2) * size.height;
    // Measured once it has laid out (0 while hidden at lg and up, where clamping does not matter).
    if (!width.current) width.current = label.current?.offsetWidth ?? 0;
    const half = width.current / 2 + EDGE;
    // Only slide the label when its anchor is on screen or just past an edge.
    if (x < -half || x > size.width + half || half * 2 >= size.width) return [x, y];
    return [Math.min(Math.max(x, half), size.width - half), y];
  };

  return (
    <Html
      position={position}
      center
      pointerEvents="none"
      calculatePosition={place}
      // drei writes the z-index inline: pinned to the --z-world-labels token (10, app/globals.css), under the HUD.
      zIndexRange={[10, 10]}
    >
      <span
        ref={label}
        aria-hidden="true"
        className="block rounded-full bg-paper px-3 py-1.5 font-display text-sm font-semibold whitespace-nowrap text-ink shadow-pill select-none lg:hidden"
      >
        {site.university}
      </span>
    </Html>
  );
}
