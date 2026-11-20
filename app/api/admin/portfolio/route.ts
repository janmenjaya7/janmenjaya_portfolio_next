import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "../../../lib/api-guard";
import { readPortfolio } from "../../../lib/portfolio-store";

export const dynamic = "force-dynamic";

/* GET /api/admin/portfolio — admin, uncached read straight from Redis (used by "Refresh") */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { data, source } = await readPortfolio();
  return NextResponse.json(
    { ok: true, data: { data, source } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
