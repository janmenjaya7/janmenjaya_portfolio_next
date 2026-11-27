import { NextResponse, type NextRequest } from "next/server";
import { summarize } from "../../../lib/analytics";
import { clearVisits, loadVisits } from "../../../lib/analytics-store";
import { jsonError, requireAdmin } from "../../../lib/api-guard";
import { isStoreConfigured } from "../../../lib/portfolio-store";

export const dynamic = "force-dynamic";
const RANGES = new Set([1, 7, 30, 90]);

/* GET /api/admin/visitors?days=7 — dashboard numbers + recent visits (admin only) */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isStoreConfigured()) return jsonError("Visitor stats need Redis — configure Upstash to collect them.", 503);

  const asked = Number(request.nextUrl.searchParams.get("days"));
  const days = RANGES.has(asked) ? asked : 7;
  try {
    const summary = summarize(await loadVisits(), Date.now(), days);
    return NextResponse.json({ ok: true, data: summary });
  } catch (err) {
    console.error("[admin/visitors]", err);
    return jsonError("Couldn't load visitor stats right now. Try again.", 500);
  }
}

/* DELETE /api/admin/visitors — erase all visitor data (admin only) */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isStoreConfigured()) return jsonError("Visitor stats need Redis — configure Upstash to collect them.", 503);
  try {
    const removed = await clearVisits();
    return NextResponse.json({ ok: true, data: { removed } });
  } catch (err) {
    console.error("[admin/visitors] clear failed:", err);
    return jsonError("Couldn't clear visitor data. Try again.", 500);
  }
}
