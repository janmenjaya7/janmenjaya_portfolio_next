/* Stateless admin session: `<payload>.<hmac>` signed with ADMIN_SESSION_SECRET.
   Uses Web Crypto only, so it runs in proxy.ts, route handlers and server components. */

export const SESSION_COOKIE = "jb_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

const encoder = new TextEncoder();

function getSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

/* Email-code login needs: the admin address, a Resend key and the signing secret */
export function isAuthConfigured(): boolean {
  return Boolean(getAdminEmail() && process.env.RESEND_API_KEY && getSecret());
}

export function getAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email ? email : null;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): string {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

/* Constant-time comparison: compares HMACs so string length/content doesn't leak via timing */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const key = "compare:" + (getSecret() ?? "fallback-compare-key");
  const [ha, hb] = await Promise.all([hmac(key, a), hmac(key, b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

/* Keyed hash for values kept in Redis (login codes), so a Redis leak doesn't reveal them */
export async function hashForStorage(value: string): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is missing or shorter than 32 characters.");
  return toBase64Url(await hmac("otp:" + secret, value));
}

export async function createSessionToken(subject: string): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is missing or shorter than 32 characters.");
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ u: subject, exp: Date.now() + SESSION_MAX_AGE * 1000 })),
  );
  return `${payload}.${toBase64Url(await hmac(secret, payload))}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = toBase64Url(await hmac(secret, payload));
  if (!(await safeEqual(sig, expected))) return false;
  try {
    const { exp } = JSON.parse(fromBase64Url(payload)) as { exp?: unknown };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
