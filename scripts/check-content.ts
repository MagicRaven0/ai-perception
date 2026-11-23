/**
 * Validates everything in content/ and lists every remaining "TODO:" placeholder.
 *
 *   npm run check-content            -> lists placeholders, fails only on real errors
 *   CONTENT_STRICT=1 npm run build   -> also fails if any placeholder remains (turn on for final launch)
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { z } from "zod";
import {
  About,
  Building,
  Comparison,
  Credit,
  Dataset,
  Episode,
  Era,
  Image,
  Insight,
  PLACEHOLDER_PREFIX,
  Site,
  Source,
} from "../lib/content/schema";
import { parseVtt } from "../lib/audio/vtt";
import { site } from "../content/site";
import { about } from "../content/about";
import { eras } from "../content/eras";
import { buildings } from "../content/buildings";
import { insights } from "../content/insights";
import { comparisons } from "../content/comparisons";
import { datasets } from "../content/datasets";
import { episodes } from "../content/episodes";
import { sources } from "../content/sources";
import { credits, images } from "../content/credits";
import { ambience } from "../content/ambience";
import { ERA_ORDER, islandCapacity } from "../lib/three/layout";

const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const strict = process.env.CONTENT_STRICT === "1";

const errors: string[] = [];
const warnings: string[] = [];

function check<T>(label: string, schema: z.ZodType<T>, value: unknown) {
  const result = schema.safeParse(value);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${label}${issue.path.length ? "." + issue.path.join(".") : ""}: ${issue.message}`);
    }
  }
}

// 1. Schemas
check("site", Site, site);
check("about", About, about);
check("eras", z.array(Era).length(3), eras);
check("buildings", z.array(Building), buildings);
check("insights", z.array(Insight), insights);
check("comparisons", z.array(Comparison), comparisons);
check("datasets", z.array(Dataset), datasets);
check("episodes", z.array(Episode), episodes);
check("sources", z.array(Source), sources);
check("credits", z.array(Credit), credits);
check("images", z.array(Image), images);

// 2. Unique ids per collection
function unique(label: string, items: { id: string }[]) {
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) errors.push(`${label}: duplicate id "${id}"`);
    seen.add(id);
  }
  return seen;
}
const eraIds = unique("eras", eras);
const buildingIds = unique("buildings", buildings);
unique("insights", insights);
unique("comparisons", comparisons);
unique("datasets", datasets);
const datasetIds = new Set(datasets.map((d) => d.id));
const episodeIds = unique("episodes", episodes);
const sourceIds = unique("sources", sources);
const creditIds = unique("credits", credits);
const imageIds = unique("images", images);

// 3. Cross-references
const ref = (label: string, kind: string, id: string | undefined, set: Set<string>) => {
  if (id !== undefined && !set.has(id)) errors.push(`${label}: unknown ${kind} "${id}"`);
};

for (const e of eras) for (const f of e.anchorFigures) ref(`eras.${e.id}`, "imageId", f.imageId, imageIds);

const orders = new Map<string, number>();
for (const b of buildings) {
  const label = `buildings.${b.id}`;
  ref(label, "eraId", b.eraId, eraIds);
  b.sourceIds.forEach((s) => ref(label, "sourceId", s, sourceIds));
  ref(label, "episodeId", b.media?.episodeId, episodeIds);
  ref(label, "imageId", b.media?.imageId, imageIds);
  ref(label, "datasetId", b.media?.datasetId, datasetIds);
  if (b.media?.videoSrc) {
    if (!existsSync(join(ROOT, "public", b.media.videoSrc))) {
      errors.push(`${label}: video public${b.media.videoSrc} not found`);
    }
    if (!creditIds.has(`video-${b.id}`)) errors.push(`${label}: its video needs a credit "video-${b.id}"`);
  }
  const key = `${b.eraId}#${b.order}`;
  if (orders.has(key)) errors.push(`${label}: order ${b.order} is already used on ${b.eraId}`);
  orders.set(key, 1);
}

for (const i of insights) {
  ref(`insights.${i.id}`, "eraId", i.eraId, eraIds);
  ref(`insights.${i.id}`, "buildingId", i.buildingId, buildingIds);
  i.sourceIds.forEach((s) => ref(`insights.${i.id}`, "sourceId", s, sourceIds));
}

for (const c of comparisons) {
  ref(`comparisons.${c.id}`, "sourceId", c.left.sourceId, sourceIds);
  ref(`comparisons.${c.id}`, "sourceId", c.right.sourceId, sourceIds);
}

for (const d of datasets) ref(`datasets.${d.id}`, "sourceId", d.sourceId, sourceIds);

for (const e of episodes) {
  const label = `episodes.${e.id}`;
  if (e.src?.startsWith("/") && !existsSync(join(ROOT, "public", e.src))) {
    errors.push(`${label}: audio file public${e.src} not found`);
  }
  if (e.transcript) {
    const file = join(CONTENT_DIR, "transcripts", e.transcript);
    if (!existsSync(file)) errors.push(`${label}: transcript content/transcripts/${e.transcript} not found`);
    else if (parseVtt(readFileSync(file, "utf8")).length === 0) {
      errors.push(`${label}: transcript ${e.transcript} has no readable cues`);
    }
  }
  if (e.src && !e.transcript) warnings.push(`${label}: has audio but no transcript yet`);
  if (e.kind === "interview" && e.speakers.some((s) => !s.consentConfirmed)) {
    warnings.push(`${label}: waiting for written consent before the audio can be published`);
  }
}

for (const img of images) {
  ref(`images.${img.id}`, "creditId", img.creditId, creditIds);
  if (!existsSync(join(ROOT, "public", img.src))) errors.push(`images.${img.id}: file public${img.src} not found`);
}

// World ambience (3D): optional files; once a file exists it needs a credit.
for (const [era, layers] of Object.entries(ambience)) {
  for (const layer of Object.values(layers)) {
    if (!existsSync(join(ROOT, "public", layer.src))) continue;
    if (!creditIds.has(layer.creditId)) {
      errors.push(`ambience.${era}: public${layer.src} needs a credit "${layer.creditId}" in content/credits.ts`);
    }
  }
}

// 3D islands: buildings are auto-placed; past an island's capacity the plots start to overlap.
for (const era of ERA_ORDER) {
  const count = buildings.filter((b) => b.eraId === era).length;
  const capacity = islandCapacity(era);
  if (count > capacity) {
    warnings.push(`${era}: ${count} buildings, but the island fits ${capacity} without overlapping plots`);
  }
}

// 4. Placeholders: scan every file in content/ for the literal prefix
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const placeholders: string[] = [];
for (const file of walk(CONTENT_DIR)) {
  if (!/\.(ts|json|vtt)$/.test(file)) continue;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, n) => {
      // Skip code comments: they explain the placeholder rule, they are not placeholders
      if (/^\s*(\/\/|\/?\*)/.test(line)) return;
      const where = `${relative(ROOT, file).replaceAll("\\", "/")}:${n + 1}`;
      // A placeholder runs from the prefix to the closing quote (several may share one line)
      for (const m of line.matchAll(new RegExp(`${PLACEHOLDER_PREFIX}([^"\`]*)`, "g"))) {
        placeholders.push(`  ${where}  ${m[1].trim()}`);
      }
    });
}

// Report
if (placeholders.length) {
  console.log(`\n${placeholders.length} placeholder(s) still to fill:\n${placeholders.join("\n")}\n`);
} else {
  console.log("\nNo placeholders left.\n");
}

const pending = datasets.filter((d) => d.status === "placeholder").length;
if (pending) warnings.push(`${pending} dataset(s) still marked placeholder`);
if (sources.length === 0) warnings.push("no sources yet (content/sources.ts)");
if (warnings.length) console.log(`Notes:\n${warnings.map((w) => "  " + w).join("\n")}\n`);

if (errors.length) {
  console.error(`${errors.length} content error(s):\n${errors.map((e) => "  " + e).join("\n")}\n`);
  process.exit(1);
}

if (strict && (placeholders.length || pending)) {
  console.error("CONTENT_STRICT=1: placeholders are not allowed in this build.\n");
  process.exit(1);
}

console.log("Content check passed.");
