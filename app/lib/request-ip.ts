/* The visitor's IP for rate limiting — pure, so it is unit-tested.
   Prefers headers set by the hosting platform (Vercel sets `x-real-ip` and `x-vercel-forwarded-for` and overwrites
   anything the visitor sends), then falls back to `x-forwarded-for` (first entry). */
export function clientIpFrom(get: (name: string) => string | null): string {
  const pick = (v: string | null) => v?.split(",")[0]?.trim() || "";
  return pick(get("x-real-ip")) || pick(get("x-vercel-forwarded-for")) || pick(get("x-forwarded-for")) || "unknown";
}
