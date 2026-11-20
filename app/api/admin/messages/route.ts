import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "../../../lib/api-guard";
import { storeError } from "../../../lib/api-handlers";
import { listMessages } from "../../../lib/messages";

export const dynamic = "force-dynamic";

/* GET /api/admin/messages — admin, newest first */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, data: await listMessages() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return storeError(err);
  }
}
