"use client";

import { Suspense } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { PlacedFigure } from "@/lib/three/layout";
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
          <FacelessFigure position={[-1.2, 0, 0.4]} tint={tint} />
          <BillboardFrame position={[0.9, 0, 0]} />
        </StaticMerge>
        {/* The picture slot stays outside the merge: it swaps from "photo coming" to the photo on load. */}
        <group position={[0.9, BOARD.y, 0.01]}>
          {placed.imageSrc ? (
            <Suspense fallback={<Blank w={BOARD.w} h={BOARD.h} />}>
              <Photo src={placed.imageSrc} w={BOARD.w} h={BOARD.h} />
            </Suspense>
          ) : (
            <Blank w={BOARD.w} h={BOARD.h} />
          )}
        </group>
      </group>
      <SignSensor id={placed.id} position={placed.position} radius={placed.sensorRadius} />
    </>
  );
}

/** Low-poly faceless person: no eyes, nose or mouth on purpose. */
export function FacelessFigure({ position, tint }: { position: [number, number, number]; tint?: string }) {
  const body = tint ?? SHARED.figure;
  return (
    <group position={position}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.42, 1.3, 7]} />
        <meshLambertMaterial color={body} flatShading />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <icosahedronGeometry args={[0.36, 0]} />
        <meshLambertMaterial color={body} flatShading />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.24, 7]} />
        <meshLambertMaterial color={SHARED.figureDark} />
      </mesh>
    </group>
  );
}

const BOARD = { w: 2.2, h: 2.8, y: 1.2 + 1.4 };

function BillboardFrame({ position }: { position: [number, number, number] }) {
  const { w, h } = BOARD;
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * w) / 2.6, 1.2, -0.05]} castShadow>
          <boxGeometry args={[0.1, 2.4, 0.1]} />
          <meshLambertMaterial color={SHARED.billboardFrame} />
        </mesh>
      ))}
      <mesh position={[0, BOARD.y, -0.04]} castShadow>
        <boxGeometry args={[w + 0.24, h + 0.24, 0.08]} />
        <meshLambertMaterial color={SHARED.billboardFrame} />
      </mesh>
    </group>
  );
}

/** "Photo coming" frame: a blank panel with a simple person silhouette (no face). */
function Blank({ w, h }: { w: number; h: number }) {
  return (
    <group>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={SHARED.billboardBlank} />
      </mesh>
      <mesh position={[0, 0.35, 0.01]}>
        <circleGeometry args={[0.38, 12]} />
        <meshBasicMaterial color={SHARED.figure} />
      </mesh>
      <mesh position={[0, -0.75, 0.01]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshBasicMaterial color={SHARED.figure} />
      </mesh>
    </group>
  );
}

function Photo({ src, w, h }: { src: string; w: number; h: number }) {
  const texture = useTexture(src, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((x) => (x.colorSpace = THREE.SRGBColorSpace));
  });
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
