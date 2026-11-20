import { Redis } from "@upstash/redis";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { DATA, type PortfolioData } from "../data";
import { normalizePortfolio } from "./portfolio-schema";

const PORTFOLIO_KEY = "portfolio:data";
const CACHE_TAG = "portfolio";

export type StoreSource = "redis" | "default" | "error";

let client: Redis | null | undefined;

/* Returns null when Upstash credentials are not configured */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function isStoreConfigured(): boolean {
  return getRedis() !== null;
}

/* Uncached read — used by the admin so it always shows the latest saved state */
export async function readPortfolio(): Promise<{ data: PortfolioData; source: StoreSource }> {
  const redis = getRedis();
  if (!redis) return { data: DATA, source: "default" };
  try {
    const stored = await redis.get<unknown>(PORTFOLIO_KEY);
    if (stored === null || stored === undefined) return { data: DATA, source: "default" };
    return { data: normalizePortfolio(stored), source: "redis" };
  } catch (err) {
    console.error("[portfolio-store] read failed:", err);
    return { data: DATA, source: "error" };
  }
}

/* Cached read for the public site; invalidated on every admin write.
   The short revalidate is a safety net: tag invalidations are kept in memory by a
   self-hosted Next server, so after a restart a stale entry could otherwise linger. */
export const getPortfolio = unstable_cache(
  async () => (await readPortfolio()).data,
  ["portfolio-data"],
  { tags: [CACHE_TAG], revalidate: 60 },
);

function refreshSite() {
  revalidateTag(CACHE_TAG, { expire: 0 });
  revalidatePath("/");
}

export async function writePortfolio(data: PortfolioData): Promise<PortfolioData> {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  const clean = normalizePortfolio(data);
  await redis.set(PORTFOLIO_KEY, clean);
  refreshSite();
  return clean;
}

/* Removes stored content so the site falls back to the defaults in data.ts */
export async function resetPortfolio(): Promise<PortfolioData> {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  await redis.del(PORTFOLIO_KEY);
  refreshSite();
  return DATA;
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super("Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
  }
}
