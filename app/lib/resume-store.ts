import { getRedis, StoreNotConfiguredError } from "./portfolio-store";
import { safeResumeName } from "./resume-validation";

/*
  Resume storage. An uploaded resume lives in Redis (base64) because serverless hosts can't write files at runtime.
  When nothing is uploaded, the site serves the default file shipped in /public/resume.pdf.
*/
const META_KEY = "resume:meta";
const DATA_KEY = "resume:data";

export const DEFAULT_RESUME_PATH = "/resume.pdf";

export type ResumeMeta = { name: string; size: number; updatedAt: number };
export type ResumeInfo = { source: "uploaded"; meta: ResumeMeta } | { source: "default"; meta: null };

function isMeta(v: unknown): v is ResumeMeta {
  const m = v as ResumeMeta;
  return !!m && typeof m.name === "string" && typeof m.size === "number" && typeof m.updatedAt === "number";
}

export async function getResumeInfo(): Promise<ResumeInfo> {
  const redis = getRedis();
  if (!redis) return { source: "default", meta: null };
  const meta = await redis.get<unknown>(META_KEY);
  return isMeta(meta) ? { source: "uploaded", meta } : { source: "default", meta: null };
}

export async function getUploadedResume(): Promise<{ meta: ResumeMeta; bytes: Uint8Array } | null> {
  const redis = getRedis();
  if (!redis) return null;
  const [meta, data] = await Promise.all([redis.get<unknown>(META_KEY), redis.get<string>(DATA_KEY)]);
  if (!isMeta(meta) || typeof data !== "string" || !data) return null;
  return { meta, bytes: Uint8Array.from(Buffer.from(data, "base64")) };
}

export async function saveResume(name: string, bytes: Uint8Array): Promise<ResumeMeta> {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  const meta: ResumeMeta = { name: safeResumeName(name), size: bytes.byteLength, updatedAt: Date.now() };
  // data first, then meta: a half-finished upload never points at missing bytes
  await redis.set(DATA_KEY, Buffer.from(bytes).toString("base64"));
  await redis.set(META_KEY, meta);
  return meta;
}

export async function deleteResume(): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  await redis.del(META_KEY, DATA_KEY);
}
