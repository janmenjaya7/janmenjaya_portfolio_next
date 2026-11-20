import { NextResponse, type NextRequest } from "next/server";
import { jsonError, readJson, requireAdmin } from "../../lib/api-guard";
import { mutatePortfolio, storeError } from "../../lib/api-handlers";
import { normalizePortfolio } from "../../lib/portfolio-schema";
import { getPortfolio, resetPortfolio } from "../../lib/portfolio-store";

/* GET /api/portfolio — public, returns the full portfolio document */
export async function GET() {
  const data = await getPortfolio();
  return NextResponse.json({ ok: true, data });
}

/* PUT /api/portfolio — admin, replaces the full document */
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError("Body must be a JSON object with the portfolio data.", 400);
  }
  return mutatePortfolio(() => normalizePortfolio(body));
}

/* DELETE /api/portfolio — admin, clears stored data so the site uses the defaults */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const data = await resetPortfolio();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return storeError(err);
  }
}
