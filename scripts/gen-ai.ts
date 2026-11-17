/**
 * Pre-generates AI output for the group to review (PLAN.md 8.4):
 *   - 3 summaries (TL;DR, key statistics, ELI12) for every summarizable item with real text
 *   - an answer to every suggested question, per persona
 * Writes content/generated/summaries.json and answers.json with "checked": false.
 * After reading each one, set "checked": true (edit the text first if needed).
 * Only missing or stale entries are generated, so re-running is cheap.
 *
 * Run: npm run gen-ai   (needs AI credentials in .env.local: see .env.example)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateText } from "ai";
import { corpusForPrompt, itemText, summarizableItemIds } from "../lib/ai/corpus";
import { chatInstructions, summaryInstructions } from "../lib/ai/prompts";
import { CHAT_MODEL, chatModel, estimateCost, hasAiCredentials } from "../lib/ai/models";
import { PERSONA_IDS, SUMMARY_MODES } from "../lib/ai/personas";
import { textHash, type AnswerFile, type SummaryFile } from "../lib/ai/summaries";
import { suggestedQuestions } from "../content/suggested-questions";

const DIR = join(__dirname, "..", "content", "generated");
const read = <T>(f: string): T => JSON.parse(readFileSync(join(DIR, f), "utf8")) as T;
const write = (f: string, data: unknown) => writeFileSync(join(DIR, f), JSON.stringify(data, null, 2) + "\n");

async function main() {
  if (!hasAiCredentials()) {
    console.error(
      "No AI credentials. Run `vercel env pull`, or set AI_PROVIDER=deepseek and DEEPSEEK_API_KEY in .env.local.",
    );
    process.exit(1);
  }

  let cost = 0;
  const now = new Date().toISOString();

  // Summaries
  const summaries = read<SummaryFile>("summaries.json");
  const ids = summarizableItemIds();
  for (const id of ids) {
    const item = itemText(id)!;
    const hash = textHash(item.text);
    for (const mode of SUMMARY_MODES) {
      if (summaries[id]?.[mode]?.hash === hash) continue;
      const { text, totalUsage } = await generateText({
        model: chatModel(),
        instructions: summaryInstructions(mode),
        prompt: `TEXT (from the section "${item.title}"):\n${item.text}`,
        temperature: 0.2,
        maxOutputTokens: 250,
      });
      cost += estimateCost(CHAT_MODEL, totalUsage.inputTokens, totalUsage.outputTokens);
      (summaries[id] ??= {})[mode] = { text: text.trim(), hash, model: CHAT_MODEL, generatedAt: now, checked: false };
      console.log(`summary  ${id} / ${mode}`);
    }
  }
  // Drop summaries for items that no longer exist
  for (const id of Object.keys(summaries)) if (!ids.includes(id)) delete summaries[id];
  write("summaries.json", summaries);

  // Answers to suggested questions (tied to the whole corpus: any content change makes them stale)
  const answers = read<AnswerFile>("answers.json");
  const corpusHash = textHash(corpusForPrompt());
  for (const persona of PERSONA_IDS) {
    const kept: NonNullable<AnswerFile[typeof persona]> = {};
    for (const q of suggestedQuestions[persona]) {
      const old = answers[persona]?.[q];
      if (old?.hash === corpusHash) {
        kept[q] = old;
        continue;
      }
      const { text, totalUsage } = await generateText({
        model: chatModel(),
        instructions: chatInstructions(persona),
        prompt: q,
        temperature: 0.2,
        maxOutputTokens: 350,
      });
      cost += estimateCost(CHAT_MODEL, totalUsage.inputTokens, totalUsage.outputTokens);
      kept[q] = { answer: text.trim(), hash: corpusHash, model: CHAT_MODEL, generatedAt: now, checked: false };
      console.log(`answer   ${persona}: ${q}`);
    }
    answers[persona] = kept;
  }
  write("answers.json", answers);

  console.log(`\nDone. Estimated cost: $${cost.toFixed(4)}. Review content/generated/*.json and set "checked": true.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
