import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireAdmin } from "../../../lib/api-guard";
import { storeError } from "../../../lib/api-handlers";
import { deleteResume, getResumeInfo, saveResume } from "../../../lib/resume-store";
import { MAX_RESUME_BYTES, validateResume } from "../../../lib/resume-validation";

export const dynamic = "force-dynamic";

/* GET /api/admin/resume — admin: which resume is live (uploaded or default) */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, data: await getResumeInfo() });
  } catch (err) {
    return storeError(err);
  }
}

/* PUT /api/admin/resume — admin: multipart form with a "file" field (PDF, ≤ 600 KB) */
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  // reject obviously oversized bodies before reading them
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_RESUME_BYTES + 64 * 1024) return jsonError("That file is too large. Please keep your resume under 600 KB.", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Please upload the resume as a file.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Please choose a PDF file.", 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateResume({ name: file.name, type: file.type, size: bytes.byteLength, head: bytes.subarray(0, 5) });
  if (!check.ok) return jsonError(check.error, 400);

  try {
    const meta = await saveResume(file.name, bytes);
    return NextResponse.json({ ok: true, data: { source: "uploaded", meta } });
  } catch (err) {
    return storeError(err);
  }
}

/* DELETE /api/admin/resume — admin: remove the upload, go back to the default resume */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    await deleteResume();
    return NextResponse.json({ ok: true, data: { source: "default", meta: null } });
  } catch (err) {
    return storeError(err);
  }
}
