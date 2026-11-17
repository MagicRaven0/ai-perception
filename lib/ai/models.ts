import "server-only";
import { deepSeek } from "@ai-sdk/deepseek";
import type { LanguageModel } from "ai";

/**
 * Two ways to reach a model, switched by one env var (AI_PROVIDER):
 *   - "gateway" (default): Vercel AI Gateway with a "provider/model" string (AI_MODEL). Auth: OIDC on Vercel,
 *     or AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN locally. Needs a card on file in Vercel to unlock free credits.
 *   - "deepseek": the group's own DeepSeek key (DEEPSEEK_API_KEY), model DEEPSEEK_MODEL.
 * Prices (USD per token) are only used for the class budget estimate; checked 17 Nov 2026.
 */
const PROVIDER = process.env.AI_PROVIDER === "deepseek" ? "deepseek" : "gateway";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

/** Id used for pricing and logs. */
export const CHAT_MODEL =
  PROVIDER === "deepseek" ? `deepseek/${DEEPSEEK_MODEL}` : process.env.AI_MODEL || "anthropic/claude-haiku-5.5";

export function chatModel(): LanguageModel {
  return PROVIDER === "deepseek" ? deepSeek(DEEPSEEK_MODEL) : CHAT_MODEL;
}

export const hasAiCredentials = () =>
  PROVIDER === "deepseek"
    ? !!process.env.DEEPSEEK_API_KEY
    : !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);

const PRICES: Record<string, { input: number; output: number }> = {
  "anthropic/claude-haiku-5.5": { input: 0.0000001, output: 0.0000005 },
  "deepseek/deepseek-v4-flash": { input: 0.00000013, output: 0.00000026 },
  "google/gemini-2.5-flash-lite": { input: 0.0000001, output: 0.0000004 },
};

export function estimateCost(model: string, inputTokens = 0, outputTokens = 0): number {
  const p = PRICES[model] ?? { input: 0.000001, output: 0.000005 }; // unknown model: assume pricier, stay safe
  return inputTokens * p.input + outputTokens * p.output;
}

/** Budget for one 30-day Gateway credit period, in USD. Class mode starts at 80% of it. */
export const BUDGET_USD = Number(process.env.AI_BUDGET_USD || 4);
