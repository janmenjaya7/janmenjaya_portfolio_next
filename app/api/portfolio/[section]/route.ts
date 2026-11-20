import { NextResponse, type NextRequest } from "next/server";
import { jsonError, readJson, requireAdmin } from "../../../lib/api-guard";
import { mutatePortfolio, parseIndex } from "../../../lib/api-handlers";
import { isSectionKey, normalizeSection, type SectionKey } from "../../../lib/portfolio-schema";
import { getPortfolio } from "../../../lib/portfolio-store";

type Ctx = { params: Promise<{ section: string }> };

async function resolveSection(ctx: Ctx): Promise<SectionKey | NextResponse> {
  const { section } = await ctx.params;
  return isSectionKey(section) ? section : jsonError(`Unknown section "${section}".`, 404);
}

/* GET /api/portfolio/:section — public */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const key = await resolveSection(ctx);
  if (key instanceof NextResponse) return key;
  const data = await getPortfolio();
  return NextResponse.json({ ok: true, data: data[key] });
}

/* PUT /api/portfolio/:section — admin, replaces the whole section */
export async function PUT(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const key = await resolveSection(ctx);
  if (key instanceof NextResponse) return key;

  const value = normalizeSection(key, await readJson(request));
  if (value === null) return jsonError(`Invalid value for "${key}".`, 400);
  return mutatePortfolio((d) => ({ ...d, [key]: value }));
}

/* POST /api/portfolio/:section — admin, appends an item to a list section */
export async function POST(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const key = await resolveSection(ctx);
  if (key instanceof NextResponse) return key;

  const item = normalizeSection(key, [await readJson(request)]);
  if (!Array.isArray(item) || item.length !== 1) {
    return jsonError(`"${key}" is not a list section or the item is invalid.`, 400);
  }
  return mutatePortfolio((d) => ({ ...d, [key]: [...(d[key] as unknown[]), item[0]] }));
}

/* PATCH /api/portfolio/:section?index=N — admin, updates one list item (or merges an object section) */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const key = await resolveSection(ctx);
  if (key instanceof NextResponse) return key;
  const body = await readJson(request);
  const index = parseIndex(request.url);

  return mutatePortfolio((d) => {
    const current = d[key] as unknown;
    if (Array.isArray(current)) {
      if (index === null || index >= current.length) return jsonError("Valid ?index= is required.", 400);
      const item = normalizeSection(key, [body]);
      if (!Array.isArray(item)) return jsonError("Invalid item.", 400);
      const list = [...current];
      list[index] = item[0];
      return { ...d, [key]: list };
    }
    if (typeof current === "object" && current !== null && typeof body === "object" && body !== null) {
      const merged = normalizeSection(key, { ...current, ...body });
      return merged === null ? jsonError("Invalid value.", 400) : { ...d, [key]: merged };
    }
    return jsonError(`Use PUT to replace "${key}".`, 400);
  });
}

/* DELETE /api/portfolio/:section?index=N — admin, removes one list item */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const key = await resolveSection(ctx);
  if (key instanceof NextResponse) return key;
  const index = parseIndex(request.url);

  return mutatePortfolio((d) => {
    const current = d[key] as unknown;
    if (!Array.isArray(current)) return jsonError(`"${key}" is not a list section.`, 400);
    if (index === null || index >= current.length) return jsonError("Valid ?index= is required.", 400);
    return { ...d, [key]: current.filter((_, i) => i !== index) };
  });
}
