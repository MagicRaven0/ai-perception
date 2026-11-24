import { generateText } from "ai";
import { Redis } from "@upstash/redis";
import { itemText } from "@/lib/ai/corpus";
import { CHAT_MODEL, chatModel, REASONING, estimateCost, stripThinking } from "@/lib/ai/models";
import { SUMMARY_MODES, type SummaryMode } from "@/lib/ai/personas";
import { summaryInstructions } from "@/lib/ai/prompts";
import { storedSummary, textHash } from "@/lib/ai/summaries";
import { addSpend, checkLimits, getHealth, isHardFailure, tripBreaker } from "@/lib/ai/limits";
import { clientIp, json, visitorId } from "@/lib/ai/request";

export const maxDuration = 30;

/**
 * Live fallback summarizer (PLAN.md 8.4). Reviewed summaries ship pre-generated; this only runs for items
 * without one, and caches its result. The client sends an item id, never text, so it cannot be used as a
 * general-purpose AI endpoint.
 */
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const memory = new Map<string, string>();

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { itemId?: string; mode?: string };
  const mode = body.mode as SummaryMode;
  if (!SUMMARY_MODES.includes(mode) || typeof body.itemId !== "string") return json({ error: "bad-request" }, 400);

  const item = itemText(body.itemId);
  if (!item) return json({ error: "not-found" }, 404);

  const stored = storedSummary(body.itemId, mode, item.text);
  if (stored) return json({ text: stored.text, checked: stored.checked, live: false });

  const key = `sum:${body.itemId}:${mode}:${textHash(item.text)}`;
  const cached = redis ? await redis.get<string>(key) : memory.get(key);
  if (cached) return json({ text: cached, checked: false, live: true });

  const health = await getHealth();
  if (health.classMode) return json({ error: "class-mode" }, 503);
  const limit = await checkLimits(await visitorId(), await clientIp());
  if (!limit.ok) return json({ error: "rate-limited" }, 429);

  try {
    const { text, totalUsage } = await generateText({
      model: chatModel(),
      reasoning: REASONING,
      instructions: summaryInstructions(mode),
      prompt: `TEXT (from the section "${item.title}"):\n${item.text}`,
      temperature: 0.2,
      maxOutputTokens: 250,
    });
    await addSpend(estimateCost(CHAT_MODEL, totalUsage.inputTokens, totalUsage.outputTokens));
    const clean = stripThinking(text);
    if (redis) await redis.set(key, clean, { ex: 30 * 86_400 });
    else memory.set(key, clean);
    return json({ text: clean, checked: false, live: true });
  } catch (error) {
    if (isHardFailure(error)) await tripBreaker();
    return json({ error: "unavailable" }, 502);
  }
}
