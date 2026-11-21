"use client";

/**
 * AUS MINI CAMPUS (The Future, centre plot). Owner: the campus agent (components/three/campus/).
 *
 * CONTRACT (unchanged): named export `AusCampus` with props { position, radius, palette }.
 * Input: position (centre of the plot, y = 0), radius (keep everything inside it: the ring road starts
 * about 6 m outside), palette (era-3 palette; only `accent` is used, for the lime glow).
 * Budget (a share of The Future's budget): <= 20k triangles and <= 14 draw calls on High (shadow pass
 * included), <= 8k triangles and <= 6 draw calls on Low.
 *
 * WHAT IT SHOWS: a simplified, symmetrical American University of Sharjah. Modelling reference only (public
 * descriptions and the AUS campus maps; no photo, logo or texture was downloaded or copied):
 * - the Main Building at the head of the axis: long arcaded block, central portal, big central dome on a
 *   drum, domed corner pavilions;
 * - the long rectangular mall in front of it, lined on both sides by square, domed academic buildings with
 *   the same arched face on every side, each in its own lawn;
 * - a reflecting pool with fountains down the middle, date palms, bougainvillea, lamps and benches;
 * - the university name (content/site.ts) on a sloped sign at the entrance, repeated as a DOM world label on
 *   small screens where the sign's lettering is too small to read (CampusLabel.tsx); an optional logo slot (config.ts);
 * - a marked pad with a blank plaque near the Main Building, reserved for the local expert.
 * The axis faces the camera (lib/three/camera), turned by AXIS_SKEW, so the entrance and name sign are nearest
 * the viewer and the tall dome stands on the far side where it never hides the ring road.
 *
 * DRAW CALLS: everything static is one <StaticMerge>, built from three "shades" only (parts.tsx): solid
 * (2 calls on High: colour + shadow), flat (1), glow (1). The name text is 1 more (canvas texture), the
 * animated fountain jets 1 (instanced). About 6 calls on High, 4 on Low.
 *
 * COLLIDERS: fixed cuboids for the Main Building footprint, the four academic halls (the inner lawn is open to
 * the car, so every solid building needs one), the name sign and the pool. Palms, lamps and benches have none.
 *
 * DEV: in development `window.__ausCampus` is the campus root group (hide it to measure its own cost:
 * compare window.__explore.gl.info.render with `__ausCampus.visible` true and false).
 */

import { useEffect, useMemo, useRef } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import type * as THREE from "three";
import { useStore } from "@/lib/store";
import { CAMERA_AZIMUTH } from "@/lib/three/camera";
import type { Vec3 } from "@/lib/three/layout";
import type { EraPalette } from "@/lib/three/palette";
import { selectTier } from "@/lib/three/quality";
import { StaticMerge } from "../kit/StaticMerge";
import { AcademicHall, HALL_HALF } from "./AcademicHall";
import { CampusLabel } from "./CampusLabel";
import { AXIS_SKEW, DESIGN_RADIUS } from "./config";
import { FountainJets } from "./FountainJets";
import { GROUNDS, Grounds } from "./Grounds";
import { MAIN_HALF, MainBuilding } from "./MainBuilding";
import { NameSign, SIGN_HALF } from "./NameSign";
import { CAMPUS } from "./palette";

const HALLS: { x: number; z: number; tone: string }[] = [-1, 1].flatMap((s) =>
  GROUNDS.hallZ.map((z, i) => ({ x: s * GROUNDS.hallX, z, tone: i === 0 ? CAMPUS.stoneMid : CAMPUS.stoneShade })),
);

export function AusCampus({ position, radius, palette }: { position: Vec3; radius: number; palette: EraPalette }) {
  const hi = useStore(selectTier) === "high";
  // Designed for the current plot; a smaller plot scales the whole campus down so it still fits.
  const k = Math.min(1, radius / DESIGN_RADIUS);
  const accent = palette.accent;
  const root = useRef<THREE.Group>(null);

  const jets = useMemo(() => GROUNDS.fountainZ.map((z) => [0, 0.5, z] as [number, number, number]), []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __ausCampus?: THREE.Group | null };
    w.__ausCampus = root.current;
    return () => {
      w.__ausCampus = null;
    };
  }, []);

  return (
    <group position={position} rotation-y={CAMERA_AZIMUTH + AXIS_SKEW}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[MAIN_HALF.x * k, (MAIN_HALF.height / 2) * k, MAIN_HALF.z * k]}
          position={[0, (MAIN_HALF.height / 2) * k, GROUNDS.mainZ * k]}
        />
        {HALLS.map((h) => (
          <CuboidCollider
            key={`${h.x}${h.z}`}
            args={[HALL_HALF.x * k, HALL_HALF.height * k, HALL_HALF.z * k]}
            position={[h.x * k, HALL_HALF.height * k, h.z * k]}
          />
        ))}
        <CuboidCollider
          args={[SIGN_HALF.x * k, SIGN_HALF.height * k, SIGN_HALF.z * k]}
          position={[0, SIGN_HALF.height * k, GROUNDS.sign.z * k]}
        />
        <CuboidCollider
          args={[(GROUNDS.pool.width / 2) * k, 0.45 * k, (GROUNDS.pool.length / 2) * k]}
          position={[0, 0.45 * k, GROUNDS.pool.z * k]}
        />
      </RigidBody>

      <group ref={root} scale={k}>
        <StaticMerge>
          <Grounds radius={radius / k} hi={hi} accent={accent} />
          <group position-z={GROUNDS.mainZ}>
            <MainBuilding hi={hi} accent={accent} />
          </group>
          {HALLS.map((h) => (
            <group key={`${h.x}${h.z}`} position={[h.x, 0, h.z]}>
              <AcademicHall hi={hi} tone={h.tone} />
            </group>
          ))}
          <group position-z={GROUNDS.sign.z}>
            <NameSign accent={accent} />
          </group>
        </StaticMerge>
        <FountainJets positions={jets} />
        {/* The name as readable DOM text on small screens, over the entrance sign (no draw call). */}
        <CampusLabel position={[0, SIGN_HALF.height * 2 + 1.5, GROUNDS.sign.z]} />
      </group>
    </group>
  );
}
