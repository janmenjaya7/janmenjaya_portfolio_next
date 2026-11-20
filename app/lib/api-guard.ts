import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/* Same-origin check for state-changing requests (defence in depth on top of SameSite=strict) */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl) still need a valid session cookie
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/* Returns an error response when the caller is not the logged-in admin, otherwise null */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  if (!isSameOrigin(request)) return jsonError("Cross-origin request blocked.", 403);
  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  return ok ? null : jsonError("Unauthorized. Please log in.", 401);
}

/* Parses a JSON body, returning undefined for empty/invalid JSON */
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
