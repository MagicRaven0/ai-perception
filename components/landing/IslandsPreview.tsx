import type { Era } from "@/lib/content/schema";

type IslandStyle = {
  cx: number;
  buildingHeight: number;
  top: string;
  left: string;
  right: string;
};

// Isometric geometry (2:1). Purely decorative preview of the 3 islands; the real world is Phase 3.
const CY = 110;
const W = 112;
const H = W / 2;
const DEPTH = 24;
const BW = 26;
const BH = BW / 2;

const ISLANDS: IslandStyle[] = [
  { cx: 140, buildingHeight: 46, top: "#e8d9b0", left: "#cdbd90", right: "#b3a274" },
  { cx: 400, buildingHeight: 26, top: "#ffffff", left: "#d8d2c4", right: "#bfb8a6" },
  { cx: 660, buildingHeight: 66, top: "#d5ff95", left: "#141414", right: "#2b2b2b" },
];

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(" ");

function Island({ s }: { s: IslandStyle }) {
  const { cx } = s;
  const top = pts([
    [cx, CY - H],
    [cx + W, CY],
    [cx, CY + H],
    [cx - W, CY],
  ]);
  const leftSide = pts([
    [cx - W, CY],
    [cx, CY + H],
    [cx, CY + H + DEPTH],
    [cx - W, CY + DEPTH],
  ]);
  const rightSide = pts([
    [cx, CY + H],
    [cx + W, CY],
    [cx + W, CY + DEPTH],
    [cx, CY + H + DEPTH],
  ]);
  // Cream path ring, inset from the edge
  const r = 0.72;
  const path = pts([
    [cx, CY - H * r],
    [cx + W * r, CY],
    [cx, CY + H * r],
    [cx - W * r, CY],
  ]);
  const inner = 0.6;
  const lawn = pts([
    [cx, CY - H * inner],
    [cx + W * inner, CY],
    [cx, CY + H * inner],
    [cx - W * inner, CY],
  ]);

  const bh = s.buildingHeight;
  const by = CY - 4;
  const bTop = pts([
    [cx, by - BH - bh],
    [cx + BW, by - bh],
    [cx, by + BH - bh],
    [cx - BW, by - bh],
  ]);
  const bLeft = pts([
    [cx - BW, by - bh],
    [cx, by + BH - bh],
    [cx, by + BH],
    [cx - BW, by],
  ]);
  const bRight = pts([
    [cx, by + BH - bh],
    [cx + BW, by - bh],
    [cx + BW, by],
    [cx, by + BH],
  ]);

  const trees: [number, number][] = [
    [cx - W * 0.82, CY + 2],
    [cx + W * 0.8, CY - 2],
    [cx - 8, CY + H * 0.86],
    [cx + 10, CY - H * 0.84],
  ];

  return (
    <g>
      <polygon points={leftSide} fill="var(--color-ground-dark)" />
      <polygon points={rightSide} fill="#174c3c" />
      <polygon points={top} fill="var(--color-ground)" />
      <polygon points={path} fill="var(--color-sand)" />
      <polygon points={lawn} fill="var(--color-ground)" />
      {trees.map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x + 3} cy={y + 2} rx={6} ry={3} fill="rgb(0 0 0 / 0.15)" />
          <circle cx={x} cy={y - 6} r={6} fill="var(--color-leaf)" />
        </g>
      ))}
      <ellipse cx={cx + 8} cy={by + 6} rx={BW + 4} ry={BH} fill="rgb(0 0 0 / 0.12)" />
      <polygon points={bLeft} fill={s.left} />
      <polygon points={bRight} fill={s.right} />
      <polygon points={bTop} fill={s.top} />
    </g>
  );
}

export function IslandsPreview({ eras }: { eras: Era[] }) {
  const years = (e: Era) => `${e.years.start}–${e.years.end === "present" ? "now" : e.years.end}`;

  return (
    <figure className="w-full">
      <svg
        viewBox="0 0 800 220"
        className="h-auto w-full"
        role="img"
        aria-label="Three islands, one for each era, joined by bridges"
      >
        {/* Bridges */}
        {[0, 1].map((i) => {
          const x1 = ISLANDS[i].cx + W - 6;
          const x2 = ISLANDS[i + 1].cx - W + 6;
          return (
            <g key={i}>
              <rect x={x1} y={CY - 4} width={x2 - x1} height={8} fill="var(--color-sand)" />
              <rect x={x1} y={CY + 4} width={x2 - x1} height={4} fill="var(--color-rule)" />
            </g>
          );
        })}
        {ISLANDS.map((s, i) => (
          <Island key={i} s={s} />
        ))}
      </svg>
      <figcaption className="mt-4 grid grid-cols-3 gap-2 text-center">
        {eras.map((era) => (
          <div key={era.id}>
            <p className="font-semibold">{era.islandName}</p>
            <p className="text-sm text-muted">{years(era)}</p>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
