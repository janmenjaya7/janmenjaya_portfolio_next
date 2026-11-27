/* Resume upload rules, shared by the admin UI and the API. Import-free so they run under `node --test`. */

/** Upstash's free tier caps a request at 1 MB; base64 adds ~33%, so 600 KB of PDF stays safely under it. */
export const MAX_RESUME_BYTES = 600 * 1024;

export type ResumeCheck = { ok: true } | { ok: false; error: string };

/** Every real PDF starts with "%PDF-". Checking the bytes stops renamed images or documents. */
export function looksLikePdf(head: Uint8Array | null | undefined): boolean {
  if (!head || head.length < 5) return false;
  return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46 && head[4] === 0x2d;
}

export function validateResume(input: { name?: unknown; type?: unknown; size?: unknown; head?: Uint8Array | null }): ResumeCheck {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const size = typeof input.size === "number" ? input.size : Number.NaN;
  if (!name) return { ok: false, error: "Please choose a PDF file." };
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: "That file is empty." };
  if (size > MAX_RESUME_BYTES) return { ok: false, error: `That file is ${formatBytes(size)}. Please keep your resume under ${formatBytes(MAX_RESUME_BYTES)}.` };
  const typeOk = input.type === "application/pdf" || input.type === "" || input.type === undefined;
  if (!typeOk || !/\.pdf$/i.test(name)) return { ok: false, error: "Only PDF files are allowed." };
  if (input.head !== undefined && !looksLikePdf(input.head)) return { ok: false, error: "That file isn't a valid PDF." };
  return { ok: true };
}

/** Safe download name: letters, numbers, dot, dash, underscore; always ends in .pdf. */
export function safeResumeName(name: unknown): string {
  const raw = typeof name === "string" ? name.trim() : "";
  const base = raw.replace(/\.pdf$/i, "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^[._-]+|[._-]+$/g, "").slice(0, 80);
  return `${base || "Resume"}.pdf`;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
