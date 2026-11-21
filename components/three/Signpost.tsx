"use client";

import type { PlacedInsight } from "@/lib/three/layout";
import { INSIGHT_COLOUR, SHARED } from "@/lib/three/palette";
import { SignSensor } from "./BuildingSensor";
import { StaticMerge } from "./kit/StaticMerge";

/**
 * SHARED. Benefit / risk / danger insight signpost (content/insights.ts). A post with a coloured board and
 * a simple symbol (+ for benefit, ! for risk, a triangle for danger), so the tag never depends on colour alone.
 * Driving close shows the text in the HUD (no button press needed). No collider: it is a small sign the car
 * can brush past. Static (merged into one draw call), and casts no shadow (no shadow-pass call for a small prop).
 */
export function Signpost({ placed }: { placed: PlacedInsight }) {
  const colour = INSIGHT_COLOUR[placed.kind];

  return (
    <>
      <group position={placed.position} rotation-y={placed.rotationY}>
        <StaticMerge>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 2.2, 6]} />
            <meshLambertMaterial color={SHARED.cream} />
          </mesh>
          <group position={[0, 2.1, 0]}>
            <mesh>
              <boxGeometry args={[1.5, 1, 0.14]} />
              <meshLambertMaterial color={colour} />
            </mesh>
            <Symbol kind={placed.kind} />
          </group>
        </StaticMerge>
      </group>
      <SignSensor id={placed.id} position={placed.position} radius={placed.sensorRadius} />
    </>
  );
}

function Symbol({ kind }: { kind: PlacedInsight["kind"] }) {
  const ink = SHARED.ink;
  if (kind === "benefit") {
    return (
      <group position-z={0.08}>
        <mesh>
          <boxGeometry args={[0.6, 0.14, 0.04]} />
          <meshLambertMaterial color={ink} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.14, 0.6, 0.04]} />
          <meshLambertMaterial color={ink} />
        </mesh>
      </group>
    );
  }
  if (kind === "risk") {
    return (
      <group position-z={0.08}>
        <mesh position-y={0.08}>
          <boxGeometry args={[0.14, 0.42, 0.04]} />
          <meshLambertMaterial color={ink} />
        </mesh>
        <mesh position-y={-0.26}>
          <boxGeometry args={[0.14, 0.14, 0.04]} />
          <meshLambertMaterial color={ink} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position-z={0.08} rotation-z={Math.PI / 2}>
      <circleGeometry args={[0.38, 3]} />
      <meshLambertMaterial color={ink} />
    </mesh>
  );
}
