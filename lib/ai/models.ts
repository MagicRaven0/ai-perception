import "server-only";
import { deepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * Two ways to reach a model, switched by one env var (AI_PROVIDER):
 *   - "gateway" (default): Vercel AI Gateway with a "provider/model" string (AI_MODEL). Auth: OIDC on Vercel,
 *     or AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN locally. Needs a card on file in Vercel to unlock free credits.
 *   - "deepseek": the group's own DeepSeek key (DEEPSEEK_API_KEY), model DEEPSEEK_MODEL.
 *   - "local": a model on this computer through Ollama (LOCAL_AI_URL, LOCAL_AI_MODEL). Free; for development and
 *     for `npm run gen-ai`. Not for the deployed site (Vercel cannot reach your laptop).
 * Prices (USD per token) are only used for the class budget estimate; checked 17 Nov 2026.
 */
const PROVIDER = (["deepseek", "local"] as const).find((p) => p === process.env.AI_PROVIDER) ?? "gateway";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const LOCAL_MODEL = process.env.LOCAL_AI_MODEL || "qwen3:8b";

/** Id used for pricing and logs. */
export const CHAT_MODEL =
  PROVIDER === "deepseek"
    ? `deepseek/${DEEPSEEK_MODEL}`
    : PROVIDER === "local"
      ? `local/${LOCAL_MODEL}`
      : process.env.AI_MODEL || "anthropic/claude-haiku-5.5";

export function chatModel(): LanguageModel {
  if (PROVIDER === "deepseek") return deepSeek(DEEPSEEK_MODEL);
  if (PROVIDER === "local") {
    const ollama = createOpenAICompatible({
      name: "ollama",
      baseURL: process.env.LOCAL_AI_URL || "http://localhost:11434/v1",
      includeUsage: true,
    });
    return ollama(LOCAL_MODEL);
  }
  return CHAT_MODEL;
}

export const hasAiCredentials = () =>
  PROVIDER === "local"
    ? true
    : PROVIDER === "deepseek"
      ? !!process.env.DEEPSEEK_API_KEY
      : !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);

/** Qwen 3's switch to answer directly without a thinking phase (faster on a laptop GPU). */
export const INSTRUCTIONS_SUFFIX = PROVIDER === "local" ? "\n\n/no_think" : "";

/** Thinking models (e.g. Qwen 3 locally) may emit <think>...</think>; never show or store that. */
export const stripThinking = (text: string) => text.replace(/<think>[\s\S]*?(<\/think>|$)/g, "").trim();

const PRICES: Record<string, { input: number; output: number }> = {
  "anthropic/claude-haiku-5.5": { input: 0.0000001, output: 0.0000005 },
  "deepseek/deepseek-v4-flash": { input: 0.00000013, output: 0.00000026 },
  "google/gemini-2.5-flash-lite": { input: 0.0000001, output: 0.0000004 },
};

export function estimateCost(model: string, inputTokens = 0, outputTokens = 0): number {
  if (model.startsWith("local/")) return 0;
  const p = PRICES[model] ?? { input: 0.000001, output: 0.000005 }; // unknown model: assume pricier, stay safe
  return inputTokens * p.input + outputTokens * p.output;
}

/** Budget for one 30-day Gateway credit period, in USD. Class mode starts at 80% of it. */
export const BUDGET_USD = Number(process.env.AI_BUDGET_USD || 4);
