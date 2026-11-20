import { NextResponse, type NextRequest } from "next/server";
import { jsonError, readJson, requireAdmin } from "../../../../lib/api-guard";
import { storeError } from "../../../../lib/api-handlers";
import { deleteMessage, setMessageRead } from "../../../../lib/messages";

type Ctx = { params: Promise<{ id: string }> };

/* PATCH /api/admin/messages/:id — admin, { read: boolean } */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await readJson(request)) as { read?: unknown } | undefined;
  if (typeof body?.read !== "boolean") return jsonError('Body must be { "read": true | false }.', 400);
  try {
    const msg = await setMessageRead(id, body.read);
    return msg ? NextResponse.json({ ok: true, data: msg }) : jsonError("Message not found.", 404);
  } catch (err) {
    return storeError(err);
  }
}

/* DELETE /api/admin/messages/:id — admin */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    return (await deleteMessage(id)) ? NextResponse.json({ ok: true }) : jsonError("Message not found.", 404);
  } catch (err) {
    return storeError(err);
  }
}
