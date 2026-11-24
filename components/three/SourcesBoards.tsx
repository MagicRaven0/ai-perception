"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { SOURCE_BOARD, sourceBoardCount, type PlacedBuilding, type SourceRow } from "@/lib/three/layout";
import { SHARED } from "@/lib/three/palette";
import { StaticMerge } from "./kit/StaticMerge";
import { TextPanel } from "./kit/TextPanel";

/**
 * SHARED. The island's sources, listed on boards in its centre area (the generated References building). Authors,
 * year and title on the boards; the drawer ("Open") has the full APA entries and links. Local +Z is the front.
 */
export function SourcesBoards({ placed, rows, accent }: { placed: PlacedBuilding; rows: SourceRow[]; accent: string }) {
  const { width: W, height: H, gap } = SOURCE_BOARD;
  const n = sourceBoardCount(rows.length);
  // Share the rows out evenly, so the last board is never nearly empty.
  const per = Math.ceil(rows.length / n);
  return (
    <group position={placed.position} rotation-y={placed.rotationY}>
      {Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * (W + gap);
        const list = rows.slice(i * per, (i + 1) * per);
        return (
          <group key={i} position={[x, 0, 0]}>
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={[W / 2, H / 2, 0.3]} position={[0, H / 2, 0]} />
            </RigidBody>
            <StaticMerge>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * (W / 2 - 0.9), 0.4, 0]}>
                  <boxGeometry args={[0.3, 0.8, 0.3]} />
                  <meshLambertMaterial color={SHARED.billboardFrame} />
                </mesh>
              ))}
              <mesh position={[0, 0.7 + H / 2, 0]} castShadow>
                <boxGeometry args={[W + 0.3, H + 0.3, 0.3]} />
                <meshLambertMaterial color={SHARED.billboardFrame} />
              </mesh>
              <mesh position={[0, 0.7 + H + 0.3, 0]}>
                <boxGeometry args={[W + 0.3, 0.3, 0.32]} />
                <meshLambertMaterial color={accent} />
              </mesh>
            </StaticMerge>
            <TextPanel
              position={[0, 0.7 + H / 2, 0.16]}
              width={W}
              height={H}
              draw={(ctx, w, h, fonts) =>
                drawBoard(ctx, w, h, fonts, n > 1 ? `Sources ${i + 1}/${n}` : "Sources", list, per)
              }
            />
          </group>
        );
      })}
    </group>
  );
}

type Fonts = { display: string; text: string };

function drawBoard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fonts: Fonts,
  heading: string,
  rows: SourceRow[],
  per: number,
) {
  ctx.fillStyle = SHARED.snow;
  ctx.fillRect(0, 0, w, h);
  const pad = w * 0.045;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = SHARED.ink;
  ctx.font = `700 ${h * 0.11}px ${fonts.display}`;
  ctx.fillText(heading, pad, h * 0.12);
  const top = h * 0.16;
  const rowH = (h - top - pad * 0.4) / per;
  // Up to four text lines in a row (author and year, then the title on up to three).
  const size = Math.min(rowH * 0.205, h * 0.05);
  rows.forEach((r, i) => {
    let y = top + i * rowH;
    ctx.fillStyle = SHARED.billboardBlank;
    ctx.fillRect(pad, y, w - pad * 2, Math.max(2, h * 0.003));
    y += size * 1.25;
    ctx.fillStyle = SHARED.ink;
    ctx.font = `700 ${size}px ${fonts.text}`;
    ctx.fillText(r.who, pad, y);
    ctx.font = `500 ${size}px ${fonts.text}`;
    ctx.fillStyle = SHARED.figureDark;
    for (const line of wrap(ctx, r.title, w - pad * 2, 3)) {
      y += size * 1.12;
      ctx.fillText(line, pad, y);
    }
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, lines: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const word of text.split(" ").filter(Boolean)) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && ctx.measureText(next).width > max) {
      out.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) out.push(cur);
  if (out.length <= lines) return out;
  return [...out.slice(0, lines - 1), `${out[lines - 1]}…`];
}
