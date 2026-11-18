"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { player } from "@/lib/three/transient";
import { ERA_PALETTE } from "@/lib/three/palette";
import { selectTier, TIERS } from "@/lib/three/quality";

/**
 * SHARED. Sky gradient, fog and golden-hour light, crossfading to the active island's palette.
 * Selects `activeEra` and the tier (two primitives); colours ease in its own frame loop.
 * The sun's shadow camera follows the car, so shadows work on every island with a small map.
 */

const SKY_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;
const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 top;
  uniform vec3 bottom;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(mix(bottom, top, smoothstep(0.0, 1.0, vUv.y)), 1.0);
    #include <colorspace_fragment>
  }
`;

/** Direction the sun shines from (low, warm, from the back-left of the isometric view). */
const SUN_DIR = new THREE.Vector3(-0.55, 0.62, -0.35).normalize();

function coloursFor(era: keyof typeof ERA_PALETTE) {
  const p = ERA_PALETTE[era];
  return {
    top: new THREE.Color(p.skyTop),
    bottom: new THREE.Color(p.skyBottom),
    fog: new THREE.Color(p.fog),
    sun: new THREE.Color(p.sun),
    sunIntensity: p.sunIntensity,
    hemiSky: new THREE.Color(p.hemiSky),
    hemiGround: new THREE.Color(p.hemiGround),
    hemiIntensity: p.hemiIntensity,
  };
}

export function Atmosphere() {
  const era = useStore((s) => s.activeEra);
  const tier = useStore(selectTier);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);

  const target = useMemo(() => coloursFor(era), [era]);
  // Start on the right colours (no fade on first load).
  const [initialEra] = useState(era);
  const initial = useMemo(() => coloursFor(initialEra), [initialEra]);
  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          top: { value: initial.top.clone() },
          bottom: { value: initial.bottom.clone() },
        },
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        depthWrite: false,
        depthTest: false,
      }),
    [initial],
  );
  const fog = useRef<THREE.Fog>(null);

  useEffect(() => () => sky.dispose(), [sky]);

  // Shadow map follows the tier.
  const settings = TIERS[tier];
  useEffect(() => {
    const light = sun.current;
    if (!light) return;
    light.castShadow = settings.shadows;
    if (settings.shadows && light.shadow.mapSize.x !== settings.shadowMapSize) {
      light.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize);
      light.shadow.map?.dispose();
      light.shadow.map = null;
    }
  }, [settings]);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 1.2);
    const u = sky.uniforms as { top: { value: THREE.Color }; bottom: { value: THREE.Color } };
    u.top.value.lerp(target.top, k);
    u.bottom.value.lerp(target.bottom, k);
    fog.current?.color.lerp(target.fog, k);
    const s = sun.current;
    if (s) {
      s.color.lerp(target.sun, k);
      s.intensity += (target.sunIntensity - s.intensity) * k;
      s.target.position.set(player.x, 0, player.z);
      s.position.set(player.x + SUN_DIR.x * 80, SUN_DIR.y * 80, player.z + SUN_DIR.z * 80);
      s.target.updateMatrixWorld();
    }
    const h = hemi.current;
    if (h) {
      h.color.lerp(target.hemiSky, k);
      h.groundColor.lerp(target.hemiGround, k);
      h.intensity += (target.hemiIntensity - h.intensity) * k;
    }
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={[initial.fog, 200, 420]} />
      {/* Full-screen sky gradient behind everything (one draw call) */}
      <mesh renderOrder={-1000} frustumCulled={false} material={sky}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <hemisphereLight ref={hemi} args={[initial.hemiSky, initial.hemiGround, initial.hemiIntensity]} />
      <directionalLight
        ref={sun}
        color={initial.sun}
        intensity={initial.sunIntensity}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0008}
        shadow-normalBias={0.04}
      />
    </>
  );
}
