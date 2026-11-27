/* Project screenshot rules, shared by the admin UI, the API and the site. Import-free so they run under `node --test`. */

/** Upstash's free tier caps a request at 1 MB; base64 adds ~33%, so 600 KB of image stays safely under it. */
export const MAX_SHOT_BYTES = 600 * 1024;

export type ShotType = "image/jpeg" | "image/png" | "image/webp";
export type ShotMeta = { type: ShotType; size: number; updatedAt: number };
export type ShotIndex = Record<string, ShotMeta>;
export type ShotCheck = { ok: true; type: ShotType } | { ok: false; error: string };

const TYPES: readonly ShotType[] = ["image/jpeg", "image/png", "image/webp"];

/** Reads the real format from the first bytes, so a renamed PDF or SVG can't pass as a screenshot. */
export function detectImageType(head: Uint8Array | null | undefined): ShotType | null {
  if (!head || head.length < 12) return null;
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 && head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export function validateShot(input: { name?: unknown; size?: unknown; head?: Uint8Array | null }): ShotCheck {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const size = typeof input.size === "number" ? input.size : Number.NaN;
  if (!name) return { ok: false, error: "Please choose an image." };
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: "That file is empty." };
  if (size > MAX_SHOT_BYTES) {
    return { ok: false, error: `That image is ${kb(size)}. Please keep screenshots under ${kb(MAX_SHOT_BYTES)} (export as JPG or WebP).` };
  }
  const type = detectImageType(input.head);
  if (!type) return { ok: false, error: "Only JPG, PNG or WebP images are allowed." };
  return { ok: true, type };
}

/** Stable key for a project, from its title: "IFAS Admin CRM Dashboard" → "ifas-admin-crm-dashboard". */
export function shotSlug(title: unknown): string | null {
  if (typeof title !== "string") return null;
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug || null;
}

export const isShotSlug = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(v);

export function isShotMeta(v: unknown): v is ShotMeta {
  const m = v as ShotMeta;
  return !!m && TYPES.includes(m.type) && typeof m.size === "number" && m.size > 0 && typeof m.updatedAt === "number";
}

/** Public URL for an uploaded screenshot; the version busts caches when it's replaced. */
export function shotUrl(slug: string, meta: ShotMeta): string {
  return `/api/project-shot/${slug}?v=${meta.updatedAt}`;
}

function kb(n: number): string {
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
