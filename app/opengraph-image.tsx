import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { eras, site } from "@/lib/content";
import { eraYears } from "@/lib/content/labels";

/** Share card for the class link (PLAN 3). Fustat only (one of the site's three fonts), theme colours. */
export const alt = "The Evolution of AI Perception: three islands, three eras of how people saw AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fustat = await readFile(join(process.cwd(), "assets/fonts/Fustat-Medium.ttf"));

// Island names and years come from content; colours are the era palette (same hexes as the theme tokens).
const ERAS = eras.map((e) => ({
  name: e.islandName,
  years: eraYears(e),
  fill: e.palette.base,
  accent: e.palette.accent,
}));

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(180deg, #9ee3ea 0%, #e2e2ee 55%, #fbfaf6 100%)",
        color: "#121211",
        fontFamily: "Fustat",
      }}
    >
      <div style={{ display: "flex", fontSize: 30 }}>
        {site.course} · {site.university}
      </div>
      <div style={{ display: "flex", fontSize: 96, lineHeight: 1, letterSpacing: "-0.03em", maxWidth: 980 }}>
        {site.title}
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        {ERAS.map((e) => (
          <div
            key={e.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 28px",
              whiteSpace: "nowrap",
              borderRadius: 999,
              background: "#ffffff",
              fontSize: 25,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: e.fill,
                border: `6px solid ${e.accent}`,
              }}
            />
            {e.name}
            <span style={{ color: "#66655f", whiteSpace: "nowrap" }}>{e.years}</span>
          </div>
        ))}
      </div>
    </div>,
    { ...size, fonts: [{ name: "Fustat", data: fustat, style: "normal", weight: 500 }] },
  );
}
