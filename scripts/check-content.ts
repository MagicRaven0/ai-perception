/**
 * Validates everything in content/ and lists every remaining "TODO:" placeholder.
 *
 *   npm run check-content            -> lists placeholders, fails only on schema errors
 *   CONTENT_STRICT=1 npm run build   -> also fails if any placeholder remains (turn on for final launch)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { z } from "zod";
import { Era, Insight, PLACEHOLDER_PREFIX, Site } from "../lib/content/schema";
import { site } from "../content/site";
import { eras } from "../content/eras";
import { insights } from "../content/insights";

const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const strict = process.env.CONTENT_STRICT === "1";

const errors: string[] = [];

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
check("eras", z.array(Era).length(3), eras);
check("insights", z.array(Insight), insights);

// 2. Cross-references and uniqueness
const eraIds = new Set(eras.map((e) => e.id));
const seen = new Set<string>();
for (const i of insights) {
  if (seen.has(i.id)) errors.push(`insights: duplicate id "${i.id}"`);
  seen.add(i.id);
  if (!eraIds.has(i.eraId)) errors.push(`insights.${i.id}: unknown eraId "${i.eraId}"`);
}

// 3. Placeholders: scan every file in content/ for the literal prefix
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const placeholders: string[] = [];
for (const file of walk(CONTENT_DIR)) {
  if (!/\.(ts|json|md|vtt)$/.test(file)) continue;
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

if (errors.length) {
  console.error(`${errors.length} content error(s):\n${errors.map((e) => "  " + e).join("\n")}\n`);
  process.exit(1);
}

if (strict && placeholders.length) {
  console.error("CONTENT_STRICT=1: placeholders are not allowed in this build.\n");
  process.exit(1);
}

console.log("Content check passed.");
