import { generateText } from "ai";

type Options = Parameters<typeof generateText>[0];

const PACE_MS = Number(process.env.AI_PACE_MS || 0);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let last = 0;

/**
 * generateText for the batch scripts. AI_PACE_MS spaces the calls out (the Gateway's free tier allows 5 requests a
 * minute: use 13000), and a rate-limit answer waits a minute and tries again instead of losing the whole run.
 */
export async function pacedGenerate(options: Options) {
  for (let attempt = 1; ; attempt++) {
    await wait(Math.max(0, last + PACE_MS - Date.now()));
    last = Date.now();
    try {
      return await generateText({ ...options, maxRetries: 0 });
    } catch (e) {
      if (attempt >= 5 || !/rate limit/i.test(String((e as Error).message))) throw e;
      console.warn("  rate limited, waiting 65 s");
      await wait(65_000);
    }
  }
}
