"use client";

import { Suspense } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { FigureLookInput, PlacedFigure } from "@/lib/three/layout";
import { SHARED } from "@/lib/three/palette";
import { SignSensor } from "./BuildingSensor";
import { StaticMerge } from "./kit/StaticMerge";

/**
 * SHARED. A real person from an era's anchorFigures (CLAUDE.md: faceless low-poly figures + licensed photo
 * billboards only, never a 3D face likeness). A plain faceless figure stands beside a framed billboard.
 * The billboard shows the credited photo from content/credits.ts once it exists, otherwise a blank
 * "photo coming" frame. Driving close shows the name and role in the HUD.
 */
export function Figure({ placed, tint }: { placed: PlacedFigure; tint?: string }) {
  return (
    <>
      <group position={placed.position} rotation-y={placed.rotationY}>
        <StaticMerge>
          <FacelessFigure position={[-1.2, 0, 0.4]} tint={tint} look={placed.look} />
          <BillboardFrame position={[0.9, 0, 0]} />
          {/* No photo yet: the blank "photo coming" panels are plain Lambert, so they bake into this merge too
              (the whole figure is one draw call; small props cast no shadow, so there is no shadow-pass call). */}
          {!placed.imageSrc && (
            <group position={[0.9, BOARD.y, 0.01]}>
              <Blank w={BOARD.w} h={BOARD.h} />
            </group>
          )}
        </StaticMerge>
        {/* A photo stays outside the merge (textured, unlit): it swaps from "photo coming" to the photo on load. */}
        {placed.imageSrc && (
          <group position={[0.9, BOARD.y, 0.01]}>
            <Suspense fallback={<Blank w={BOARD.w} h={BOARD.h} />}>
              <Photo src={placed.imageSrc} w={BOARD.w} h={BOARD.h} />
            </Suspense>
          </group>
        )}
      </group>
      <SignSensor id={placed.id} position={placed.position} radius={placed.sensorRadius} />
    </>
  );
}

/**
 * Low-poly faceless person: no eyes, nose or mouth on purpose. An optional `look` from content dresses it
 * (top / bottom colours and one prop); the head always stays the neutral figure colour, so nobody is a likeness.
 */
export function FacelessFigure({
  position,
  tint,
  look,
}: {
  position: [number, number, number];
  tint?: string;
  look?: FigureLookInput;
}) {
  const head = tint ?? SHARED.figure;
  const top = look?.top ?? head;
  const bottom = look?.bottom ?? SHARED.figureDark;
  return (
    <group position={position}>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 1.3, 7]} />
        <meshLambertMaterial color={top} flatShading />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <icosahedronGeometry args={[0.36, 0]} />
        <meshLambertMaterial color={head} flatShading />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.24, 7]} />
        <meshLambertMaterial color={bottom} />
      </mesh>
      {look?.hair && look.hair.style !== "none" && <Hair style={look.hair.style} color={look.hair.color} />}
      {look && look.prop !== "none" && <Prop kind={look.prop} />}
    </group>
  );
}

/** Tufts of the "wild" hair: [angle from the back of the head (rad), height, size]. Nothing at the front. */
const TUFTS: [number, number, number][] = [
  [0, 1.86, 0.2],
  [0.75, 1.82, 0.19],
  [-0.75, 1.82, 0.19],
  [1.5, 1.78, 0.17],
  [-1.5, 1.78, 0.17],
  [2.2, 1.74, 0.14],
  [-2.2, 1.74, 0.14],
  [0.35, 1.99, 0.17],
  [-0.4, 1.97, 0.16],
  [0, 1.7, 0.18],
];

/**
 * A simple hair shape on the faceless head (never a likeness; the face stays blank).
 * short: a faceted cap tilted back, so the forehead stays bare. wild: puffy tufts round the sides and back of the head.
 */
function Hair({ style, color }: { style: "short" | "wild"; color: string }) {
  if (style === "short") {
    return (
      <mesh position={[0, 1.83, -0.04]} rotation-x={-0.4}>
        <sphereGeometry args={[0.395, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>
    );
  }
  return (
    <group position={[0, 0, 0]}>
      {TUFTS.map(([a, y, size], i) => (
        // Angle 0 is straight behind the head (-Z); the front (+Z) is left bare.
        <mesh key={i} position={[Math.sin(a) * 0.3, y, -Math.cos(a) * 0.3]} scale={[1, 0.9, 1]}>
          <icosahedronGeometry args={[size, 0]} />
          <meshLambertMaterial color={color} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** One small hand-held prop in front of the figure, in neutral dark/cream so it reads at isometric distance. */
function Prop({ kind }: { kind: string }) {
  const dark = SHARED.figureDark;
  const light = SHARED.cream;
  switch (kind) {
    case "microphone":
      return (
        <group position={[0.38, 1.25, 0.25]}>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.4, 5]} />
            <meshLambertMaterial color={dark} />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.1, 0]} />
            <meshLambertMaterial color={dark} flatShading />
          </mesh>
        </group>
      );
    case "headphones":
      return (
        <mesh position={[0, 1.95, 0]} rotation-z={Math.PI / 2}>
          <torusGeometry args={[0.36, 0.05, 4, 10, Math.PI]} />
          <meshLambertMaterial color={dark} />
        </mesh>
      );
    case "laptop":
      return (
        <group position={[0, 1.05, 0.42]}>
          <mesh>
            <boxGeometry args={[0.55, 0.04, 0.38]} />
            <meshLambertMaterial color={dark} />
          </mesh>
          <mesh position={[0, 0.17, -0.17]} rotation-x={-0.35}>
            <boxGeometry args={[0.55, 0.36, 0.03]} />
            <meshLambertMaterial color={dark} />
          </mesh>
        </group>
      );
    case "book":
    case "clipboard":
      return (
        <mesh position={[0.2, 1.05, 0.4]} rotation-x={-0.5}>
          <boxGeometry args={[0.36, 0.46, 0.06]} />
          <meshLambertMaterial color={kind === "book" ? dark : light} />
        </mesh>
      );
    case "chalk":
      return (
        <mesh position={[0.42, 1.35, 0.2]}>
          <boxGeometry args={[0.05, 0.05, 0.16]} />
          <meshLambertMaterial color={light} />
        </mesh>
      );
    case "phone":
      return (
        <mesh position={[0.3, 1.3, 0.3]}>
          <boxGeometry args={[0.12, 0.22, 0.03]} />
          <meshLambertMaterial color={dark} />
        </mesh>
      );
    default:
      return null;
  }
}

const BOARD = { w: 2.2, h: 2.8, y: 1.2 + 1.4 };

function BillboardFrame({ position }: { position: [number, number, number] }) {
  const { w, h } = BOARD;
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * w) / 2.6, 1.2, -0.05]}>
          <boxGeometry args={[0.1, 2.4, 0.1]} />
          <meshLambertMaterial color={SHARED.billboardFrame} />
        </mesh>
      ))}
      <mesh position={[0, BOARD.y, -0.04]}>
        <boxGeometry args={[w + 0.24, h + 0.24, 0.08]} />
        <meshLambertMaterial color={SHARED.billboardFrame} />
      </mesh>
    </group>
  );
}

/**
 * "Photo coming" frame: a blank panel with a simple person silhouette (no face). Plain Lambert, no shadows,
 * so inside a <StaticMerge> it joins the figure's merge instead of costing three draw calls of its own.
 */
function Blank({ w, h }: { w: number; h: number }) {
  return (
    <group>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshLambertMaterial color={SHARED.billboardBlank} />
      </mesh>
      <mesh position={[0, 0.35, 0.01]}>
        <circleGeometry args={[0.38, 12]} />
        <meshLambertMaterial color={SHARED.figure} />
      </mesh>
      <mesh position={[0, -0.75, 0.01]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshLambertMaterial color={SHARED.figure} />
      </mesh>
    </group>
  );
}

function Photo({ src, w, h }: { src: string; w: number; h: number }) {
  const texture = useTexture(src, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((x) => (x.colorSpace = THREE.SRGBColorSpace));
  });
  // Fitted inside the frame, never stretched or cropped (docs/PHOTOS.md: no further cropping).
  const { width, height } = texture.image as { width: number; height: number };
  const k = Math.min(w / width, h / height);
  return (
    <mesh>
      <planeGeometry args={[width * k, height * k]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
