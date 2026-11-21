/**
 * QR codes for class launch (PLAN 12.1): one for the whole site (?ref=class, phones land on the choice screen)
 * and one per era (to split the room into groups). Writes SVGs to docs/qr/.
 *
 * Run: npm run qr   (optional: SITE_URL=https://your-domain npm run qr)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import { eras } from "../content/eras";

const SITE = (process.env.SITE_URL || "https://ai-perception.vercel.app").replace(/\/$/, "");
const OUT = join(__dirname, "..", "docs", "qr");

const targets = [
  { file: "site.svg", url: `${SITE}/?ref=class` },
  ...eras.map((e) => ({ file: `${e.slug}.svg`, url: `${SITE}/read/${e.slug}?ref=class` })),
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const t of targets) {
    const svg = await QRCode.toString(t.url, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#121211", light: "#ffffff" },
    });
    writeFileSync(join(OUT, t.file), svg);
    console.log(`${t.file}  ->  ${t.url}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
