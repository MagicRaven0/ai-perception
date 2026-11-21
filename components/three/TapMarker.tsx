"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "@/lib/three/motion";
import { SHARED } from "@/lib/three/palette";
import { autoDrive } from "@/lib/three/transient";

/** Where tap-to-drive is heading: a soft ring on the ground that pulses gently (still with reduced motion). */
export function TapMarker() {
  const ring = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.RingGeometry(0.9, 1.3, 28).rotateX(-Math.PI / 2), []);

  useFrame(({ clock }) => {
    const m = ring.current;
    if (!m) return;
    m.visible = autoDrive.active;
    if (!autoDrive.active) return;
    m.position.set(autoDrive.x, 0.25, autoDrive.z);
    m.scale.setScalar(motion.reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 4) * 0.12);
  });

  return (
    <mesh ref={ring} geometry={geometry} visible={false} renderOrder={2}>
      <meshBasicMaterial color={SHARED.orange} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}
