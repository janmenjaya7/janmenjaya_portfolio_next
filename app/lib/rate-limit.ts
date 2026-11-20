import type { NextRequest } from "next/server";
import { getRedis } from "./portfolio-store";

export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/* Fixed-window counter per IP. Returns true when the caller is over the limit.
   Fails open if Redis errors, so a storage hiccup can't lock the owner out. */
export async function isRateLimited(
  bucket: string,
  request: NextRequest,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const key = `ratelimit:${bucket}:${clientIp(request)}`;
  try {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, windowSeconds);
    return n > limit;
  } catch (err) {
    console.error(`[rate-limit:${bucket}]`, err);
    return false;
  }
}
