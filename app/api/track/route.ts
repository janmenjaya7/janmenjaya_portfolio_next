import { NextResponse, type NextRequest } from "next/server";
import { geo, isBot, sanitizeBatch } from "../../lib/analytics";
import { dailyVisitorHash, recordBatch } from "../../lib/analytics-store";
import { SESSION_COOKIE, verifySessionToken } from "../../lib/auth";
import { isStoreConfigured } from "../../lib/portfolio-store";
import { clientIp, isRateLimited } from "../../lib/rate-limit";

const MAX_BODY = 16 * 1024;
const done = () => new NextResponse(null, { status: 204 });

/* POST /api/track — public, cookie-free page analytics from VisitTracker.
   Always answers 204 (even when the visit is ignored) so the page never shows an error and bots learn nothing. */
export async function POST(request: NextRequest) {
  if (!isStoreConfigured()) return done();

  // only this site's pages may report visits
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? "";
  if (origin) {
    try {
      if (new URL(origin).host !== host) return new NextResponse(null, { status: 403 });
    } catch {
      return new NextResponse(null, { status: 403 });
    }
  }

  // local development and test runs never write into the real analytics
  const hostname = host.split(":")[0];
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(hostname) && process.env.ANALYTICS_ALLOW_LOCAL !== "1") return done();

  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return done();
  // your own visits while logged in to /admin aren't counted
  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return done();
  if (await isRateLimited("track", request, 90, 10 * 60)) return done();

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return new NextResponse(null, { status: 413 });
    raw = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const batch = sanitizeBatch(raw);
  if (!batch) return new NextResponse(null, { status: 400 });

  try {
    const now = Date.now();
    await recordBatch(batch, {
      now,
      vid: dailyVisitorHash(clientIp(request), ua, now),
      ua,
      country: geo(request.headers.get("x-vercel-ip-country")),
      region: geo(request.headers.get("x-vercel-ip-country-region")),
      city: geo(request.headers.get("x-vercel-ip-city")),
      ownHost: hostname,
    });
  } catch (err) {
    console.error("[track]", err);
  }
  return done();
}
