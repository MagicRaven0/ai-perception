/**
 * Runs every question in docs/CHATBOT_TESTS.md (70 as of round 5) against the chatbot, the same way /api/chat does
 * (same instructions, corpus, temperature and token limit), and saves the raw results as JSON.
 * Each answer gets automatic checks (which chunks and sources it cites, whether it said [NONE]); the ✓ / ✗ / ?
 * verdict is a person's (or a reviewing Claude's) judgement against the expected answer, written into
 * docs/CHATBOT_TEST_RESULTS.md afterwards.
 *
 * Run: npm run test:chatbot -- [out.json] [persona | tests]   (needs AI credentials, like npm run gen-ai)
 * `tests` picks single questions, e.g. guide:4,guide:5,analyst-2026:25
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pacedGenerate } from "./ai-call";
import { getCorpus } from "../lib/ai/corpus";
import { chatInstructions, NOT_FOUND } from "../lib/ai/prompts";
import { CHAT_MODEL, chatModel, REASONING, hasAiCredentials, stripThinking } from "../lib/ai/models";
import { PERSONA_IDS, type PersonaId } from "../lib/ai/personas";

type Test = { persona: PersonaId; n: number; question: string; expected: string; sources: string; answerable: boolean };

function parseTests(md: string): Test[] {
  const tests: Test[] = [];
  const isPersona = (x: string): x is PersonaId => (PERSONA_IDS as readonly string[]).includes(x);
  let persona: PersonaId | null = null;
  for (const line of md.split(/\r?\n/)) {
    if (/^##\s/.test(line)) {
      // "## Research Guide (`guide`)" sets the persona for the rows below; any other heading clears it.
      const h = line.match(/\(`([a-z0-9-]+)`/)?.[1];
      persona = h && isPersona(h) ? h : null;
      continue;
    }
    // Two row shapes: "| n | question | expected | sources |" under a persona heading, and
    // "| persona | n | question | expected | sources |" in mixed tables (the round 5 additions).
    const mixed = line.match(/^\|\s*([a-z0-9-]+)\s*\|\s*(\d+)\s*\|(.+)\|(.+)\|(.+)\|\s*$/);
    const plain = line.match(/^\|\s*(\d+)\s*\|(.+)\|(.+)\|(.+)\|\s*$/);
    const who = mixed && isPersona(mixed[1]) ? mixed[1] : plain ? persona : null;
    const cells = mixed && isPersona(mixed[1]) ? mixed.slice(2) : plain?.slice(1);
    if (!who || !cells) continue;
    const [n, question, expected, sources] = cells.map((c) => c.trim());
    tests.push({
      persona: who,
      n: Number(n),
      question,
      expected,
      sources,
      // "none" rows are the questions our research cannot answer.
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
  const picked = only?.split(",");
  const out = outArg ?? join(process.cwd(), "chatbot-test-results.json");
  const tests = parseTests(readFileSync(join(process.cwd(), "docs", "CHATBOT_TESTS.md"), "utf8")).filter(
    (t) => !picked || picked.includes(t.persona) || picked.includes(`${t.persona}:${t.n}`),
  );
  const corpus = new Map(getCorpus().map((c) => [c.id, c]));
  const results = [];
  for (const t of tests) {
    const t0 = Date.now();
    const { text } = await pacedGenerate({
      model: chatModel(),
      reasoning: REASONING,
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
