/**
 * Runs the 60 questions in docs/CHATBOT_TESTS.md against the chatbot, the same way /api/chat does
 * (same instructions, corpus, temperature and token limit), and saves the raw results as JSON.
 * Each answer gets automatic checks (which chunks and sources it cites, whether it said [NONE]); the ✓ / ✗ / ?
 * verdict is a person's (or a reviewing Claude's) judgement against the expected answer, written into
 * docs/CHATBOT_TEST_RESULTS.md afterwards.
 *
 * Run: npm run test:chatbot -- [out.json] [persona]   (needs AI credentials, like npm run gen-ai)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateText } from "ai";
import { getCorpus } from "../lib/ai/corpus";
import { chatInstructions, NOT_FOUND } from "../lib/ai/prompts";
import { CHAT_MODEL, chatModel, hasAiCredentials, stripThinking } from "../lib/ai/models";
import { PERSONA_IDS, type PersonaId } from "../lib/ai/personas";

type Test = { persona: PersonaId; n: number; question: string; expected: string; sources: string; answerable: boolean };

function parseTests(md: string): Test[] {
  const tests: Test[] = [];
  let persona: PersonaId | null = null;
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^##\s.*\(`([a-z0-9-]+)`/);
    if (h) {
      persona = (PERSONA_IDS as readonly string[]).includes(h[1]) ? (h[1] as PersonaId) : null;
      continue;
    }
    const row = line.match(/^\|\s*(\d+)\s*\|(.+)\|(.+)\|(.+)\|\s*$/);
    if (!row || !persona) continue;
    const sources = row[4].trim();
    tests.push({
      persona,
      n: Number(row[1]),
      question: row[2].trim(),
      expected: row[3].trim(),
      sources,
      // "none" rows are the five questions our research cannot answer.
      answerable: sources !== "none",
    });
  }
  return tests;
}

async function main() {
  if (!hasAiCredentials()) {
    console.error("No AI credentials (see .env.example).");
    process.exit(1);
  }
  const [outArg, only] = process.argv.slice(2);
  const out = outArg ?? join(process.cwd(), "chatbot-test-results.json");
  const tests = parseTests(readFileSync(join(process.cwd(), "docs", "CHATBOT_TESTS.md"), "utf8")).filter(
    (t) => !only || t.persona === only,
  );
  const corpus = new Map(getCorpus().map((c) => [c.id, c]));
  const results = [];
  for (const t of tests) {
    const t0 = Date.now();
    const { text } = await generateText({
      model: chatModel(),
      instructions: chatInstructions(t.persona),
      messages: [{ role: "user", content: t.question }],
      temperature: 0.2,
      maxOutputTokens: 350,
    });
    const answer = stripThinking(text);
    const cited = [...new Set([...answer.matchAll(/\[(C\d{3})\]/g)].map((m) => m[1]))];
    const invalid = cited.filter((id) => !corpus.has(id));
    const sourceIds = [...new Set(cited.flatMap((id) => corpus.get(id)?.sourceIds ?? []))];
    const result = {
      ...t,
      answer,
      said_none: answer.includes(NOT_FOUND),
      cited,
      invalid_cites: invalid,
      cited_titles: cited.map((id) => corpus.get(id)?.title ?? "?"),
      cited_sources: sourceIds,
      ms: Date.now() - t0,
    };
    results.push(result);
    console.log(`${t.persona} #${t.n} (${result.ms} ms) none=${result.said_none} cites=${cited.join(",") || "-"}`);
    writeFileSync(out, JSON.stringify({ model: CHAT_MODEL, ranAt: new Date().toISOString(), results }, null, 2));
  }
  console.log(`\nSaved ${results.length} results to ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
