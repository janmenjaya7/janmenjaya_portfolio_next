/* Pure helpers for the /newone page. Kept free of imports so they run under `node --test`. */

export type NewoneView = "intro" | "site";

/** `?v=site` opens the site view; anything else (missing, unknown, repeated) shows the intro chooser. */
export function resolveView(raw: string | string[] | undefined | null): NewoneView {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.trim().toLowerCase() === "site" ? "site" : "intro";
}

/** Only allow links we are happy to render: http(s) and mailto. Everything else becomes null. */
export function safeHref(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^(https?:\/\/|mailto:)/i.test(trimmed) ? trimmed : null;
}

/** Turn an email into a mailto link, or null when it does not look like an email. */
export function mailtoHref(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? `mailto:${trimmed}` : null;
}

/** "https://www.ifasonline.com/path" → "ifasonline.com" (falls back to the raw text). */
export function displayDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Two-digit marker for numbered cards: 1 → "01". */
export function indexLabel(i: number): string {
  const n = Number.isFinite(i) && i >= 0 ? Math.floor(i) + 1 : 1;
  return String(n).padStart(2, "0");
}

export function formatClock(date: Date, timeZone: string): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--";
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(date);
  } catch {
    return "--:--";
  }
}

/**
 * Work section layout: projects with a screenshot go in the big stacking deck (in their saved order, up to
 * `maxFeatured`), everything else in the compact "More work" list. Entries that aren't objects are dropped.
 */
export function splitDeck<T extends { image: string | null }>(items: readonly (T | null | undefined)[], maxFeatured = 5): { deck: T[]; more: T[] } {
  const deck: T[] = [];
  const more: T[] = [];
  const cap = Math.max(0, Math.floor(Number.isFinite(maxFeatured) ? maxFeatured : 0));
  for (const it of Array.isArray(items) ? items : []) {
    if (!it || typeof it !== "object") continue;
    if (it.image && deck.length < cap) deck.push(it);
    else more.push(it);
  }
  return { deck, more };
}
