import { NextResponse, type NextRequest } from "next/server";
import { getShot } from "../../../lib/shot-store";
import { isShotSlug } from "../../../lib/shot-validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/* GET /api/project-shot/:slug — public: a project screenshot uploaded in /admin */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!isShotSlug(slug)) return new NextResponse("Not found", { status: 404 });
  try {
    const shot = await getShot(slug);
    if (!shot) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(Buffer.from(shot.bytes), {
      status: 200,
      headers: {
        "Content-Type": shot.meta.type,
        "Content-Length": String(shot.bytes.byteLength),
        // URLs carry ?v=<updatedAt>, so a replaced screenshot gets a new URL; old ones can cache hard
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    console.error("[project-shot] read failed:", err);
    return new NextResponse("Screenshot unavailable", { status: 503 });
  }
}
