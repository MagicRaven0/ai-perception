import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import { chatInstructions } from "@/lib/ai/prompts";
import { CHAT_MODEL, chatModel, estimateCost } from "@/lib/ai/models";
import { PERSONA_IDS, type PersonaId } from "@/lib/ai/personas";
import { addSpend, checkLimits, getHealth } from "@/lib/ai/limits";
import { cleanInput, clientIp, json, visitorId } from "@/lib/ai/request";

export const maxDuration = 30;

/**
 * Grounded chat (PLAN.md 8). The client sends its messages and persona; the server keeps only the last 6
 * messages, cleans the newest user text, checks limits and budget, then streams an answer that may only use
 * the corpus and must cite chunk ids.
 */
export async function POST(req: Request) {
  let body: { messages?: UIMessage[]; persona?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad-request" }, 400);
  }

  const persona: PersonaId = PERSONA_IDS.includes(body.persona as PersonaId) ? (body.persona as PersonaId) : "guide";
  const history = Array.isArray(body.messages) ? body.messages.slice(-6) : [];
  const last = history.at(-1);
  if (!last || last.role !== "user") return json({ error: "bad-request" }, 400);

  // Clean the newest user message; reject empty input. Earlier turns are only ever text we produced or accepted.
  const text = cleanInput(last.parts?.map((p) => (p.type === "text" ? p.text : "")).join(" "));
  if (!text) return json({ error: "empty" }, 400);
  history[history.length - 1] = { ...last, parts: [{ type: "text", text }] };
  const safeHistory = history.map((m) => ({
    ...m,
    parts: (m.parts ?? []).filter((p) => p.type === "text").map((p) => ({ ...p, text: cleanInput((p as { text: string }).text, 2000) })),
  })) as UIMessage[];

  const health = await getHealth();
  if (health.classMode) return json({ error: "class-mode", reason: health.reason }, 503);

  const limit = await checkLimits(await visitorId(), await clientIp());
  if (!limit.ok) return json({ error: "rate-limited", reason: limit.reason }, 429);

  const result = streamText({
    model: chatModel(),
    instructions: chatInstructions(persona),
    messages: await convertToModelMessages(safeHistory),
    temperature: 0.2,
    maxOutputTokens: 350,
    onEnd: async ({ totalUsage }) => {
      await addSpend(estimateCost(CHAT_MODEL, totalUsage.inputTokens, totalUsage.outputTokens));
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
