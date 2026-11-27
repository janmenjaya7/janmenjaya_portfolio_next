import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_RESUME_PATH, getUploadedResume } from "../../lib/resume-store";

export const dynamic = "force-dynamic";

/* GET /api/resume — public download. Serves the uploaded resume, or falls back to the default file. */
export async function GET(request: NextRequest) {
  try {
    const uploaded = await getUploadedResume();
    if (uploaded) {
      return new NextResponse(Buffer.from(uploaded.bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(uploaded.bytes.byteLength),
          "Content-Disposition": `attachment; filename="${uploaded.meta.name}"`,
          "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  } catch (err) {
    // storage hiccup: still give visitors the default resume instead of an error
    console.error("[resume] read failed:", err);
  }
  return NextResponse.redirect(new URL(DEFAULT_RESUME_PATH, request.url), 307);
}
