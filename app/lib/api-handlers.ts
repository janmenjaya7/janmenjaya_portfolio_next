import { NextResponse } from "next/server";
import type { PortfolioData } from "../data";
import { jsonError } from "./api-guard";
import { readPortfolio, StoreNotConfiguredError, writePortfolio } from "./portfolio-store";

/* Read-modify-write helper shared by the mutation endpoints */
export async function mutatePortfolio(
  change: (current: PortfolioData) => PortfolioData | NextResponse,
): Promise<NextResponse> {
  try {
    const { data, source } = await readPortfolio();
    // Never overwrite stored content with defaults because a read failed
    if (source === "error") return jsonError("Storage is temporarily unavailable. Try again.", 503);
    const next = change(structuredClone(data));
    if (next instanceof NextResponse) return next;
    const saved = await writePortfolio(next);
    return NextResponse.json({ ok: true, data: saved });
  } catch (err) {
    return storeError(err);
  }
}

export function storeError(err: unknown): NextResponse {
  if (err instanceof StoreNotConfiguredError) return jsonError(err.message, 503);
  console.error("[portfolio-api]", err);
  return jsonError("Something went wrong while saving. Please try again.", 500);
}

/* Parses ?index=N, returning null when missing or not a valid integer */
export function parseIndex(url: string): number | null {
  const raw = new URL(url).searchParams.get("index");
  if (raw === null || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}
