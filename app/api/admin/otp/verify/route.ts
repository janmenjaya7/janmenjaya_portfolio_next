import { NextResponse, type NextRequest } from "next/server";
import {
  createSessionToken,
  getAdminEmail,
  isAuthConfigured,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../../../../lib/auth";
import { jsonError, readJson } from "../../../../lib/api-guard";
import { verifyOtp } from "../../../../lib/otp";
import { isStoreConfigured } from "../../../../lib/portfolio-store";
import { isRateLimited } from "../../../../lib/rate-limit";

const MESSAGES = {
  invalid: "That code is incorrect. Check the email and try again.",
  expired: "This code has expired or was already used. Request a new one.",
  locked: "Too many wrong attempts. Request a new code.",
} as const;

/* POST /api/admin/otp/verify — { code } → sets the session cookie when the code matches */
export async function POST(request: NextRequest) {
  const adminEmail = getAdminEmail();
  if (!isAuthConfigured() || !adminEmail || !isStoreConfigured()) {
    return jsonError("Email login is not configured on the server.", 503);
  }

  if (await isRateLimited("otp-verify", request, 20, 15 * 60)) {
    return jsonError("Too many attempts. Try again in 15 minutes.", 429);
  }

  const body = (await readJson(request)) as { code?: unknown } | undefined;
  const code = typeof body?.code === "string" ? body.code.replace(/\s/g, "") : "";
  if (!/^\d{6}$/.test(code)) return jsonError("Enter the 6-digit code from your email.", 400);

  try {
    const result = await verifyOtp(code);
    if (result !== "ok") return jsonError(MESSAGES[result], result === "locked" ? 429 : 401);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, await createSessionToken(adminEmail), sessionCookieOptions);
    return res;
  } catch (err) {
    console.error("[otp-verify]", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
