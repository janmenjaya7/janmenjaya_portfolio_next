/* Visitor analytics storage (Upstash Redis).
   One JSON document per visit (`an:v:<sid>`, expires after 90 days) + a newest-first list of visit ids (capped). */
import { createHmac } from "node:crypto";
import { mergeVisit, parseVisit, type TrackBatch, type Visit, type VisitContext } from "./analytics";
import { getRedis, StoreNotConfiguredError } from "./portfolio-store";

const VISIT_TTL = 90 * 24 * 60 * 60;
const INDEX = "an:idx";
const MAX_INDEX = 3000;
const visitKey = (sid: string) => `an:v:${sid}`;

function requireRedis() {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  return redis;
}

/**
 * One-day anonymous visitor hash: the same browser on the same day → same value, so unique visitors can be counted
 * without storing the IP or anything on the visitor's device. It changes every day and can't be reversed.
 */
export function dailyVisitorHash(ip: string, ua: string, now: number): string {
  const secret = process.env.ADMIN_SESSION_SECRET || "jb-analytics";
  const day = new Date(now).toISOString().slice(0, 10);
  return createHmac("sha256", `visitor:${secret}`).update(`${day}|${ip}|${ua}`).digest("hex").slice(0, 16);
}

export async function recordBatch(batch: TrackBatch, ctx: VisitContext): Promise<void> {
  const redis = requireRedis();
  const key = visitKey(batch.sid);
  const existing = parseVisit(await redis.get<unknown>(key));
  const next = mergeVisit(existing, batch, ctx);
  await redis.set(key, JSON.stringify(next), { ex: VISIT_TTL });
  if (!existing) {
    await redis.lpush(INDEX, batch.sid);
    await redis.ltrim(INDEX, 0, MAX_INDEX - 1);
  }
}

/** The most recent visits (newest first); expired or malformed entries are skipped. */
export async function loadVisits(limit = 2000): Promise<Visit[]> {
  const redis = requireRedis();
  const ids = (await redis.lrange<string>(INDEX, 0, Math.max(0, limit - 1))).filter((id) => typeof id === "string" && id);
  if (!ids.length) return [];
  const values = await redis.mget<unknown[]>(...ids.map(visitKey));
  return values.map(parseVisit).filter((v): v is Visit => v !== null);
}

/** Delete all visitor data (admin "Clear data"). */
export async function clearVisits(): Promise<number> {
  const redis = requireRedis();
  const ids = (await redis.lrange<string>(INDEX, 0, MAX_INDEX)).filter(Boolean);
  if (ids.length) await redis.del(...ids.map(visitKey));
  await redis.del(INDEX);
  return ids.length;
}
