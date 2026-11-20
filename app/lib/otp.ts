import { randomInt } from "node:crypto";
import { hashForStorage, safeEqual } from "./auth";
import { getRedis } from "./portfolio-store";

/* One-time login codes stored in Redis as an HMAC (the plain code is only ever emailed) */

export const OTP_MINUTES = 10;
const OTP_TTL = OTP_MINUTES * 60;
const MAX_TRIES = 5;
const RESEND_COOLDOWN = 60;

const KEY_HASH = "admin:otp:hash";
const KEY_TRIES = "admin:otp:tries";
const KEY_COOLDOWN = "admin:otp:cooldown";

export type IssueResult = { ok: true; code: string } | { ok: false; reason: "cooldown"; retryAfter: number };

/* Creates a fresh code (invalidating the previous one) unless one was sent in the last minute */
export async function issueOtp(): Promise<IssueResult> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured.");

  // SET NX succeeds only when no cooldown is active
  const allowed = await redis.set(KEY_COOLDOWN, "1", { nx: true, ex: RESEND_COOLDOWN });
  if (allowed !== "OK") {
    const ttl = await redis.ttl(KEY_COOLDOWN);
    return { ok: false, reason: "cooldown", retryAfter: ttl > 0 ? ttl : RESEND_COOLDOWN };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await redis.set(KEY_HASH, await hashForStorage(code), { ex: OTP_TTL });
  await redis.del(KEY_TRIES);
  return { ok: true, code };
}

export type VerifyResult = "ok" | "invalid" | "expired" | "locked";

export async function verifyOtp(code: string): Promise<VerifyResult> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured.");

  const stored = await redis.get<string>(KEY_HASH);
  if (!stored) return "expired";

  // Count the attempt before comparing, so parallel guesses can't exceed the limit
  const tries = await redis.incr(KEY_TRIES);
  if (tries === 1) await redis.expire(KEY_TRIES, OTP_TTL);
  if (tries > MAX_TRIES) {
    await redis.del(KEY_HASH, KEY_TRIES);
    return "locked";
  }

  if (await safeEqual(await hashForStorage(code), String(stored))) {
    await redis.del(KEY_HASH, KEY_TRIES); // single use
    return "ok";
  }
  return "invalid";
}
