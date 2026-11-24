"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Canvas pixels per metre of panel. */
const PX_PER_M = 110;

export type PanelFonts = { display: string; text: string };

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, fonts: PanelFonts) => void;
type Panel = { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; fonts: PanelFonts };

function paintPanel(panel: Panel, draw: Draw, gl: THREE.WebGLRenderer) {
  const ctx = panel.canvas.getContext("2d");
  if (!ctx) return;
  draw(ctx, panel.canvas.width, panel.canvas.height, panel.fonts);
  panel.texture.needsUpdate = true;
  gl.initTexture(panel.texture);
}

/**
 * SHARED KIT. A flat text panel (one draw call): `draw` paints a canvas with the site's own fonts, once, and again
 * when the fonts have loaded. The texture uploads while the world loads, not on the frame it first comes into view.
 */
export function TextPanel({
  position,
  width,
  height,
  draw,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  draw: Draw;
}) {
  const gl = useThree((s) => s.gl);
  const paint = useRef(draw);
  useEffect(() => {
    paint.current = draw;
  });
  const panel = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * PX_PER_M);
    canvas.height = Math.round(height * PX_PER_M);
    const css = getComputedStyle(document.documentElement);
    const font = (name: string) => css.getPropertyValue(name).trim() || "sans-serif";
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return { canvas, texture, fonts: { display: font("--font-fustat"), text: font("--font-inter-tight") } };
  }, [gl, width, height]);

  useEffect(() => {
    if (!panel) return;
    const render = () => paintPanel(panel, paint.current, gl);
    render();
    let live = true;
    Promise.all([
      document.fonts?.load(`700 64px ${panel.fonts.display}`),
      document.fonts?.load(`700 32px ${panel.fonts.text}`),
      document.fonts?.load(`500 32px ${panel.fonts.text}`),
    ])
      .then(() => live && render())
      .catch(() => {});
    return () => {
      live = false;
      panel.texture.dispose();
    };
  }, [gl, panel]);

  if (!panel) return null;
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={panel.texture} toneMapped={false} />
    </mesh>
  );
}
