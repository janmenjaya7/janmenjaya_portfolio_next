import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireAdmin } from "../../../lib/api-guard";
import { storeError } from "../../../lib/api-handlers";
import { deleteShot, getShotIndex, saveShot } from "../../../lib/shot-store";
import { MAX_SHOT_BYTES, isShotSlug, validateShot } from "../../../lib/shot-validation";

export const dynamic = "force-dynamic";

/* GET /api/admin/project-shots — admin: metadata of every uploaded screenshot, keyed by project slug */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, data: await getShotIndex() });
  } catch (err) {
    return storeError(err);
  }
}

/* PUT /api/admin/project-shots — admin: multipart form with "slug" and "file" (JPG/PNG/WebP, ≤ 600 KB) */
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  // reject obviously oversized bodies before reading them
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_SHOT_BYTES + 64 * 1024) return jsonError("That image is too large. Please keep screenshots under 600 KB.", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Please upload the screenshot as a file.", 400);
  }
  const slug = form.get("slug");
  if (!isShotSlug(slug)) return jsonError("Unknown project.", 400);
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Please choose an image.", 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateShot({ name: file.name, size: bytes.byteLength, head: bytes.subarray(0, 12) });
  if (!check.ok) return jsonError(check.error, 400);

  try {
    await saveShot(slug, check.type, bytes);
    return NextResponse.json({ ok: true, data: await getShotIndex() });
  } catch (err) {
    return storeError(err);
  }
}

/* DELETE /api/admin/project-shots?slug=… — admin: remove an uploaded screenshot */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const slug = new URL(request.url).searchParams.get("slug");
  if (!isShotSlug(slug)) return jsonError("Unknown project.", 400);
  try {
    await deleteShot(slug);
    return NextResponse.json({ ok: true, data: await getShotIndex() });
  } catch (err) {
    return storeError(err);
  }
}
