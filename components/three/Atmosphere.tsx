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
 * The sun's shadow camera follows the car (and the camera's look-ahead), so shadows work on every island with a
 * small map. Soft, light shadows come from the light itself (PCF radius + shadow intensity): no extra passes.
 * The world is always daytime: it never reads the site theme (dark mode only changes the HUD).
 */

const SKY_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;
/* Golden-hour gradient: sky colour high up, easing into the warm horizon colour over the lower part of the screen,
   with a soft warm glow low on the left (the sun's side). */
const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 top;
  uniform vec3 bottom;
  varying vec2 vUv;
  void main() {
    float t = smoothstep(0.05, 0.95, vUv.y);
    vec3 col = mix(bottom, top, t * t * (3.0 - 2.0 * t));
    float glow = exp(-6.0 * distance(vUv, vec2(0.0, 0.18))) * 0.18;
    col = mix(col, bottom * 1.06, glow);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Direction the sun shines from (golden hour: about 39 degrees up, from the back-left of the isometric view). */
const SUN_DIR = new THREE.Vector3(-0.62, 0.56, -0.32).normalize();
/** Sun distance from its target, and the shadow box (sized to the zoomed-out desktop view, about 104 x 97 m of ground). */
const SUN_DISTANCE = 120;
const SHADOW_HALF_WIDTH = 74;
const SHADOW_HALF_HEIGHT = 62;

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
      // Centre the shadow box a little ahead of the car, where the camera looks.
      const ahead = Math.min(player.speed * 0.4, 8);
      const cx = player.x + Math.sin(player.heading) * ahead;
      const cz = player.z + Math.cos(player.heading) * ahead;
      s.target.position.set(cx, 0, cz);
      s.position.set(cx + SUN_DIR.x * SUN_DISTANCE, SUN_DIR.y * SUN_DISTANCE, cz + SUN_DIR.z * SUN_DISTANCE);
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
      {/* Gentle haze: the far edge of the view softens, the neighbouring islands melt into the sky. */}
      <fog ref={fog} attach="fog" args={[initial.fog, 185, 440]} />
      {/* Full-screen sky gradient behind everything (one draw call) */}
      <mesh renderOrder={-1000} frustumCulled={false} material={sky}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <hemisphereLight ref={hemi} args={[initial.hemiSky, initial.hemiGround, initial.hemiIntensity]} />
      <directionalLight
        ref={sun}
        color={initial.sun}
        intensity={initial.sunIntensity}
        shadow-camera-left={-SHADOW_HALF_WIDTH}
        shadow-camera-right={SHADOW_HALF_WIDTH}
        shadow-camera-top={SHADOW_HALF_HEIGHT}
        shadow-camera-bottom={-SHADOW_HALF_HEIGHT}
        shadow-camera-near={20}
        shadow-camera-far={260}
        shadow-bias={-0.0006}
        shadow-normalBias={0.06}
        shadow-radius={3}
        shadow-intensity={0.78}
      />
    </>
  );
}
