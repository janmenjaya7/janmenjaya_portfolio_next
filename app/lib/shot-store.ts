import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getRedis, StoreNotConfiguredError } from "./portfolio-store";
import { isShotMeta, isShotSlug, type ShotIndex, type ShotMeta, type ShotType } from "./shot-validation";

/*
  Project screenshots uploaded in /admin. Stored in Redis (base64) because serverless hosts can't
  write files at runtime. Metadata lives in one hash (field per project), so uploading one project's
  screenshot never overwrites another's entry.
*/
const META_KEY = "project-shot:meta";
const CACHE_TAG = "project-shots";
const dataKey = (slug: string) => `project-shot:data:${slug}`;

/** Uncached: every uploaded screenshot's metadata, keyed by project slug (admin). Malformed entries are skipped. */
export async function getShotIndex(): Promise<ShotIndex> {
  const redis = getRedis();
  if (!redis) return {};
  const all = (await redis.hgetall<Record<string, unknown>>(META_KEY)) ?? {};
  const out: ShotIndex = {};
  for (const [slug, raw] of Object.entries(all)) {
    const meta = typeof raw === "string" ? safeParse(raw) : raw;
    if (isShotSlug(slug) && isShotMeta(meta)) out[slug] = meta;
  }
  return out;
}

/* Cached read for the public site (same pattern as the portfolio content): it keeps the homepage
   static, is cleared on every upload/delete, and never throws — on a storage hiccup the site just
   shows the built-in screenshots. The short revalidate is the safety net after a server restart. */
export const getSiteShotIndex = unstable_cache(
  async (): Promise<ShotIndex> => {
    try {
      return await getShotIndex();
    } catch (err) {
      console.error("[project-shot] index failed:", err);
      return {};
    }
  },
  ["project-shot-index"],
  { tags: [CACHE_TAG], revalidate: 60 },
);

function refreshSite() {
  revalidateTag(CACHE_TAG, { expire: 0 });
  revalidatePath("/");
}

export async function getShot(slug: string): Promise<{ meta: ShotMeta; bytes: Uint8Array } | null> {
  const redis = getRedis();
  if (!redis || !isShotSlug(slug)) return null;
  const [raw, data] = await Promise.all([redis.hget<unknown>(META_KEY, slug), redis.get<string>(dataKey(slug))]);
  const meta = typeof raw === "string" ? safeParse(raw) : raw;
  if (!isShotMeta(meta) || typeof data !== "string" || !data) return null;
  return { meta, bytes: Uint8Array.from(Buffer.from(data, "base64")) };
}

export async function saveShot(slug: string, type: ShotType, bytes: Uint8Array): Promise<ShotMeta> {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  const meta: ShotMeta = { type, size: bytes.byteLength, updatedAt: Date.now() };
  // data first, then meta: a half-finished upload never points at missing bytes
  await redis.set(dataKey(slug), Buffer.from(bytes).toString("base64"));
  await redis.hset(META_KEY, { [slug]: meta });
  refreshSite();
  return meta;
}

export async function deleteShot(slug: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  // meta first: the site stops linking to it before the bytes go
  await redis.hdel(META_KEY, slug);
  await redis.del(dataKey(slug));
  refreshSite();
}

function safeParse(v: string): unknown {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}
