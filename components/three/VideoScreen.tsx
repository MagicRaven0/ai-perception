"use client";

import { useEffect, useRef } from "react";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { motion } from "@/lib/three/motion";
import { SHARED } from "@/lib/three/palette";

const W = 6.4;
const H = 3.6;

/**
 * The building's own video on a screen above its roof, facing the camera. Exists only while the car is next to the
 * building and its drawer is closed, so nothing downloads from further away; always muted out here (the drawer
 * plays it with sound). Not shown under reduced motion: the drawer has the video with controls.
 */
export function VideoScreen({ id, src, y }: { id: string; src: string; y: number }) {
  const show = useStore((s) => s.nearbyBuildingId === id && s.openBuildingId === null);
  return show && !motion.reduced ? <Screen src={src} y={y} /> : null;
}

function Screen({ src, y }: { src: string; y: number }) {
  const material = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.src = src;
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    const onPlaying = () => {
      const m = material.current;
      if (!m || m.map) return;
      m.map = texture;
      m.color.set("white");
      m.needsUpdate = true;
    };
    video.addEventListener("playing", onPlaying);
    video.play().catch(() => {}); // blocked: the screen stays dark
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.pause();
      video.removeAttribute("src");
      video.load(); // stops the download
      texture.dispose();
    };
  }, [src]);

  return (
    <Billboard position-y={y}>
      <mesh position-z={-0.05}>
        <planeGeometry args={[W + 0.4, H + 0.4]} />
        <meshBasicMaterial color={SHARED.billboardFrame} />
      </mesh>
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial ref={material} color="black" toneMapped={false} />
      </mesh>
    </Billboard>
  );
}
