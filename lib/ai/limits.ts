import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { BUDGET_USD } from "./models";

/**
 * Class-aware abuse protection (PLAN.md 8.5). On campus Wi-Fi the whole class shares one IP, so the main
 * limit is per anonymous visitor; the per-IP limit is loose and only stops scripts. A global spend estimate
 * switches the site into "class mode" (cached answers only) before the free AI credit runs out.
 *
 * Uses Upstash Redis when its env vars exist (Vercel Marketplace sets KV_REST_API_URL / KV_REST_API_TOKEN).
 * Without Redis it falls back to in-memory counters, which are per server instance: fine for local dev.
 */

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export const hasRedis = redis !== null;

type Limit = { requests: number; window: `${number} ${"s" | "m" | "h" | "d"}`; ms: number };
const LIMITS = {
  visitorMinute: { requests: 8, window: "1 m", ms: 60_000 },
  visitorDay: { requests: 40, window: "1 d", ms: 86_400_000 },
  ip: { requests: 200, window: "1 h", ms: 3_600_000 },
  globalDay: { requests: Number(process.env.AI_DAILY_CAP || 3000), window: "1 d", ms: 86_400_000 },
} satisfies Record<string, Limit>;

type LimitName = keyof typeof LIMITS;

const upstash = redis
  ? (Object.fromEntries(
      Object.entries(LIMITS).map(([name, l]) => [
        name,
        new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(l.requests, l.window), prefix: `rl:${name}` }),
      ]),
    ) as Record<LimitName, Ratelimit>)
  : null;

const memory = new Map<string, number[]>();

async function hit(name: LimitName, key: string): Promise<boolean> {
  if (upstash) return (await upstash[name].limit(key)).success;
  const { requests, ms } = LIMITS[name];
  const now = Date.now();
  const k = `${name}:${key}`;
  const recent = (memory.get(k) ?? []).filter((t) => now - t < ms);
  if (recent.length >= requests) {
    memory.set(k, recent);
    return false;
  }
  recent.push(now);
  memory.set(k, recent);
  return true;
}

export type LimitResult = { ok: true } | { ok: false; reason: "visitor" | "ip" | "global" };

export async function checkLimits(visitorId: string, ip: string): Promise<LimitResult> {
  if (!(await hit("ip", ip))) return { ok: false, reason: "ip" };
  if (!(await hit("visitorMinute", visitorId)) || !(await hit("visitorDay", visitorId)))
    return { ok: false, reason: "visitor" };
  if (!(await hit("globalDay", "all"))) return { ok: false, reason: "global" };
  return { ok: true };
}

/* ----------------------------------------------------------- spend & class mode */

// The Gateway credit renews every 30 days; bucket spend by 30-day period since the epoch.
const period = () => Math.floor(Date.now() / (30 * 86_400_000));
let memorySpend = { period: period(), usd: 0 };

export async function addSpend(usd: number) {
  if (!(usd > 0)) return;
  if (redis) {
    const key = `spend:${period()}`;
    await redis.incrbyfloat(key, usd);
    await redis.expire(key, 31 * 86_400);
    return;
  }
  if (memorySpend.period !== period()) memorySpend = { period: period(), usd: 0 };
  memorySpend.usd += usd;
}

export async function getSpend(): Promise<number> {
  if (redis) return Number((await redis.get<number>(`spend:${period()}`)) ?? 0);
  return memorySpend.period === period() ? memorySpend.usd : 0;
}

export type Health = { classMode: boolean; reason?: "budget" | "disabled"; spendUsd: number; budgetUsd: number };

export async function getHealth(): Promise<Health> {
  const spendUsd = await getSpend();
  if (process.env.AI_DISABLED === "1") return { classMode: true, reason: "disabled", spendUsd, budgetUsd: BUDGET_USD };
  const classMode = spendUsd >= BUDGET_USD * 0.8;
  return { classMode, reason: classMode ? "budget" : undefined, spendUsd, budgetUsd: BUDGET_USD };
}
