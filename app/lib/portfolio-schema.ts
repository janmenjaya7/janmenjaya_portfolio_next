import { DATA, type PortfolioData } from "../data";

/* Shape rules come from the default DATA object: any stored value is coerced to the
   same shape so the site never renders undefined/null or crashes on malformed data. */

export type SectionKey = keyof PortfolioData;
export const SECTION_KEYS = Object.keys(DATA) as SectionKey[];

type Json = unknown;

const isPlainObject = (v: Json): v is Record<string, Json> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function isSectionKey(key: string): key is SectionKey {
  return (SECTION_KEYS as string[]).includes(key);
}

/* Merge every item of an array into one template so optional keys (e.g. `featured`) are known */
export function itemTemplate(tpl: Json[]): Json {
  if (tpl.length === 0) return "";
  if (!tpl.every(isPlainObject)) return tpl[0];
  return tpl.reduce<Record<string, Json>>((acc, item) => ({ ...acc, ...(item as Record<string, Json>) }), {});
}

function normalize(tpl: Json, val: Json, useDefault: boolean): Json {
  if (Array.isArray(tpl)) {
    if (!Array.isArray(val)) return useDefault ? tpl : [];
    const itemTpl = itemTemplate(tpl);
    return val
      .filter((v) => v !== null && v !== undefined)
      .map((v) => normalize(itemTpl, v, false));
  }
  if (isPlainObject(tpl)) {
    if (!isPlainObject(val)) return useDefault ? tpl : normalize(tpl, {}, false);
    const out: Record<string, Json> = {};
    for (const k of Object.keys(tpl)) out[k] = normalize(tpl[k], val[k], useDefault);
    return out;
  }
  if (typeof tpl === "number") {
    const n = typeof val === "string" && val.trim() === "" ? NaN : Number(val);
    return Number.isFinite(n) ? n : useDefault ? tpl : 0;
  }
  if (typeof tpl === "boolean") {
    return typeof val === "boolean" ? val : useDefault ? tpl : false;
  }
  // string
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return useDefault ? tpl : "";
}

/* Full document: missing top-level keys fall back to defaults */
export function normalizePortfolio(value: Json): PortfolioData {
  return normalize(DATA, value, true) as PortfolioData;
}

/* One section: invalid input is rejected (null) instead of silently replaced */
export function normalizeSection<K extends SectionKey>(key: K, value: Json): PortfolioData[K] | null {
  const tpl = DATA[key] as Json;
  if (Array.isArray(tpl) !== Array.isArray(value)) return null;
  if (isPlainObject(tpl) !== isPlainObject(value)) return null;
  if (typeof tpl === "string" && typeof value !== "string") return null;
  return normalize(tpl, value, false) as PortfolioData[K];
}

/* Blank value matching any template (used by nested array editors in the admin) */
export function blankFrom(tpl: Json): Json {
  return normalize(Array.isArray(tpl) ? itemTemplate(tpl) : tpl, undefined, false);
}
