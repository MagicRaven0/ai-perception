"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { site } from "@/content/site";
import { SHARED } from "@/lib/three/palette";
import { AUS_LOGO } from "./config";
import { CAMPUS } from "./palette";
import { Box } from "./parts";

/**
 * Entrance name: the university name from content/site.ts lying flat on the paving at the entrance, so nothing
 * stands between the camera and the inside of the campus. A thin dark plate with a thin accent strip, the name
 * drawn in the site's display font (Fustat, read from the page's CSS variable, so no font file is fetched or
 * bundled) onto a canvas texture, and the optional logo slot (config.ts: renders nothing until a permitted,
 * credited file is set). It has no collider: the car drives over it.
 * Local frame: origin at the plate's centre on the ground, the top of the lettering points to -Z.
 *
 * The plate and strip are plain Lambert meshes (merged by the parent); the text and logo planes have textures,
 * so they stay separate (1 draw call each, no shadows).
 */

const PLATE = { w: 13, h: 0.12, d: 2.8 } as const;
const FACE = { w: 12.6, h: 2.5 } as const;
const LOGO = 2.2;
/** Canvas pixels per metre of sign face. */
const PX_PER_M = 190;

export function NameSign({ accent }: { accent: string }) {
  const logo = AUS_LOGO;
  // With a logo, the text moves right and gets narrower.
  const textW = logo ? FACE.w - LOGO - 0.5 : FACE.w;
  const textX = logo ? (LOGO + 0.5) / 2 : 0;

  return (
    <group>
      <Box size={[PLATE.w, PLATE.h, PLATE.d]} position={[0, PLATE.h / 2, 0]} color={CAMPUS.signPlate} />
      <Box size={[PLATE.w, 0.06, 0.12]} position={[0, PLATE.h, PLATE.d / 2]} color={accent} shade="glow" />
      <group position={[0, PLATE.h + 0.015, 0]} rotation-x={-Math.PI / 2}>
        <NameText width={textW} height={FACE.h} position={[textX, 0, 0]} accent={accent} />
        {logo && (
          <Suspense fallback={null}>
            <LogoPlane src={logo.src} position={[-FACE.w / 2 + LOGO / 2, 0, 0.002]} />
          </Suspense>
        )}
      </group>
    </group>
  );
}

/* ----------------------------------------------------------------- text */

/** Splits the name into at most two lines of similar width. */
function lines(ctx: CanvasRenderingContext2D, text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 3) return [text];
  let best: string[] = [text];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
}

function draw(canvas: HTMLCanvasElement, text: string, family: string, accent: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.fillStyle = CAMPUS.signPlate;
  ctx.fillRect(0, 0, W, H);

  // Largest size whose lines fit 90% of the width and 78% of the height.
  let size = Math.round(H * 0.4);
  let rows: string[] = [text];
  for (; size > 12; size -= 4) {
    ctx.font = `700 ${size}px ${family}`;
    rows = lines(ctx, text);
    const widest = Math.max(...rows.map((r) => ctx.measureText(r).width));
    if (widest <= W * 0.9 && rows.length * size * 1.12 <= H * 0.78) break;
  }
  ctx.font = `700 ${size}px ${family}`;
  ctx.fillStyle = CAMPUS.signText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineH = size * 1.12;
  const top = H * 0.46 - ((rows.length - 1) * lineH) / 2;
  rows.forEach((r, i) => ctx.fillText(r, W / 2, top + i * lineH));

  // Short accent rule under the name.
  ctx.fillStyle = accent;
  const ruleW = W * 0.16;
  ctx.fillRect((W - ruleW) / 2, top + (rows.length - 1) * lineH + size * 0.72, ruleW, Math.max(4, H * 0.025));
}

function NameText({
  width,
  height,
  position,
  accent,
}: {
  width: number;
  height: number;
  position: [number, number, number];
  accent: string;
}) {
  const gl = useThree((s) => s.gl);
  // Drawn once per size/colour (client only: the world never renders on the server).
  const sign = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * PX_PER_M);
    canvas.height = Math.round(height * PX_PER_M);
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-fustat").trim() || "sans-serif";
    draw(canvas, site.university, family, accent);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return { canvas, tex, family };
  }, [gl, width, height, accent]);
  const texture = sign?.tex ?? null;

  useEffect(() => {
    if (!sign) return;
    // Upload now, while the world loads: a first upload on the frame the sign came into view froze that frame
    // for about 4 s under software WebGL (driving over the bridge onto The Future).
    gl.initTexture(sign.tex);
    // The display font may still be loading: redraw once it is ready (harmless if it already was).
    let live = true;
    document.fonts
      ?.load(`700 64px ${sign.family}`)
      .then(() => {
        if (!live) return;
        draw(sign.canvas, site.university, sign.family, accent);
        sign.tex.needsUpdate = true;
        gl.initTexture(sign.tex);
      })
      .catch(() => {});
    return () => {
      live = false;
      // Frees the GPU copy; three uploads it again if the same texture is used after a remount.
      sign.tex.dispose();
    };
  }, [gl, sign, accent]);

  if (!texture) return null;
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

/* ----------------------------------------------------------------- logo */

function LogoPlane({ src, position }: { src: string; position: [number, number, number] }) {
  const texture = useTexture(src, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  return (
    <group position={position}>
      {/* Light backing so a dark or transparent logo reads on the dark plate */}
      <mesh position-z={-0.004}>
        <planeGeometry args={[LOGO + 0.15, LOGO + 0.15]} />
        <meshBasicMaterial color={SHARED.snow} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[LOGO, LOGO]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}
