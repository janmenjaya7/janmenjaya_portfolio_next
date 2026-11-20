import { NextResponse, type NextRequest } from "next/server";
import { getAdminEmail, isAuthConfigured, safeEqual } from "../../../../lib/auth";
import { jsonError, readJson } from "../../../../lib/api-guard";
import { MailError, sendLoginCode } from "../../../../lib/mailer";
import { issueOtp, OTP_MINUTES } from "../../../../lib/otp";
import { isStoreConfigured } from "../../../../lib/portfolio-store";
import { isRateLimited } from "../../../../lib/rate-limit";

/* Same reply whether or not the email matches, so the admin address can't be discovered */
const GENERIC_OK = { ok: true, message: "If that email belongs to the admin, a login code has been sent." };

/* POST /api/admin/otp/request — { email } → emails a 6-digit code to ADMIN_EMAIL */
export async function POST(request: NextRequest) {
  const adminEmail = getAdminEmail();
  if (!isAuthConfigured() || !adminEmail || !isStoreConfigured()) {
    return jsonError("Email login is not configured on the server.", 503);
  }

  if (await isRateLimited("otp-request", request, 5, 15 * 60)) {
    return jsonError("Too many requests. Try again in 15 minutes.", 429);
  }

  const body = (await readJson(request)) as { email?: unknown } | undefined;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Enter a valid email address.", 400);
  }

  if (!(await safeEqual(email, adminEmail))) return NextResponse.json(GENERIC_OK);

  try {
    const issued = await issueOtp();
    // During the cooldown the previous code is still valid; replying generically avoids
    // revealing that this email is the admin's (the UI shows its own 60s countdown)
    if (!issued.ok) return NextResponse.json(GENERIC_OK);
    await sendLoginCode(adminEmail, issued.code, OTP_MINUTES);
    return NextResponse.json(GENERIC_OK);
  } catch (err) {
    console.error("[otp-request]", err);
    return err instanceof MailError
      ? jsonError("Couldn't send the email right now. Please try again shortly.", 502)
      : jsonError("Something went wrong. Please try again.", 500);
  }
}
