"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "@/lib/three/motion";
import { SHARED } from "@/lib/three/palette";
import { hover } from "@/lib/three/transient";

/**
 * Click-to-move: a soft glow on the ground under the building or figure the pointer is over (a click walks to
 * it). Reads the transient `hover` channel in its own frame loop; nothing here touches React state.
 */
export function HoverHighlight() {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    m.visible = hover.active;
    if (!hover.active) return;
    m.position.set(hover.x, 0.12, hover.z);
    m.rotation.y = hover.rot;
    const pulse = motion.reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 5) * 0.015;
    m.scale.set((hover.w + 2) * pulse, 1, (hover.d + 2) * pulse);
  });

  return (
    <mesh ref={ref} geometry={geometry} visible={false} renderOrder={1}>
      <meshBasicMaterial color={SHARED.orange} transparent opacity={0.38} depthWrite={false} />
    </mesh>
  );
}
