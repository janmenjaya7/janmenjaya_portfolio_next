/* Pure display helpers for the classic site sections. No imports, so they run under `node --test`. */

/** "📍 Pune, MH" → "Pune, MH". Removes leading emoji/pictographs (and variation selectors) from admin-entered labels. */
export function stripLeadingEmoji(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Modifier}‍️]+/u, "").trim();
}

/**
 * Turn a 0–100 skill level into words. Percent bars read as made-up precision;
 * a plain-language label is more honest and easier to scan.
 */
export function levelLabel(level: unknown): string {
  if (level === null || level === undefined || (typeof level === "string" && level.trim() === "")) return "";
  const n = typeof level === "number" ? level : Number(level);
  if (!Number.isFinite(n)) return "";
  if (n >= 90) return "Daily driver";
  if (n >= 80) return "Fluent";
  if (n >= 65) return "Comfortable";
  return "Learning";
}

/** Only http(s) URLs become links; anything else (empty, javascript:, relative) is null. */
export function safeUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  return /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : null;
}

/** "https://www.ifasonline.com/x" → "ifasonline.com"; falls back to the given text. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Two-digit index: 0 → "01". */
export function pad2(i: number): string {
  const n = Number.isFinite(i) && i >= 0 ? Math.floor(i) + 1 : 1;
  return String(n).padStart(2, "0");
}

/** Keep non-empty trimmed strings only. */
export function cleanList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean);
}

export type ParsedStat = { prefix: string; value: number; decimals: number; grouped: boolean; suffix: string };

/** "50K+" → { value: 50, suffix: "K+" }; "50,000+" keeps its grouping; null when there is no number to count. */
export function parseStat(raw: unknown): ParsedStat | null {
  if (typeof raw !== "string") return null;
  const m = raw.trim().match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const digits = m[2];
  const value = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  return { prefix: m[1], value, decimals, grouped: digits.includes(","), suffix: m[3] };
}

/** Render a parsed stat at an in-between value, e.g. while counting up. */
export function formatStat(stat: ParsedStat, current: number): string {
  const n = Math.min(Math.max(current, 0), stat.value);
  const body = stat.grouped
    ? n.toLocaleString("en-US", { minimumFractionDigits: stat.decimals, maximumFractionDigits: stat.decimals })
    : stat.decimals > 0
      ? n.toFixed(stat.decimals)
      : String(Math.round(n));
  return `${stat.prefix}${body}${stat.suffix}`;
}

export type SkillGroup = { name: string; items: Array<{ name: string; level: string }> };

/** Skill clusters from the portfolio data (the same ones /admin edits and the résumé prints); blanks dropped. */
export function skillGroups(skills: unknown): SkillGroup[] {
  if (!Array.isArray(skills)) return [];
  const out: SkillGroup[] = [];
  for (const c of skills) {
    const name = typeof c?.cluster === "string" ? c.cluster.trim() : "";
    const items = (Array.isArray(c?.items) ? c.items : [])
      .map((i: { name?: unknown; level?: unknown }) => ({ name: typeof i?.name === "string" ? i.name.trim() : "", level: levelLabel(i?.level) }))
      .filter((i: { name: string }) => i.name);
    if (items.length) out.push({ name: name || "Skills", items });
  }
  return out;
}

/** Tech pills not already covered by a listed skill ("REST API" is covered by "REST APIs / Axios"). */
export function skillExtras(pills: unknown, groups: SkillGroup[]): string[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");
  const listed = groups.flatMap((g) => g.items.map((i) => norm(i.name)));
  const seen = new Set<string>();
  return cleanList(pills).filter((p) => {
    const n = norm(p);
    if (!n || seen.has(n) || listed.some((l) => l.includes(n) || n.includes(l))) return false;
    seen.add(n);
    return true;
  });
}

export type TextPart = { text: string; figure: boolean };

/* a measurable figure: "50,000+", "~30%", "100+", "4 live…" — but not version numbers glued to words ("ES6+", "HTML5") */
const FIGURE = /(?<![A-Za-z0-9])~?\d[\d,]*(?:\.\d+)?(?:\s?%|\+)?(?![A-Za-z0-9])/g;

/** Split a sentence into plain text and figures, so the figures can be emphasised. */
export function splitFigures(text: unknown): TextPart[] {
  if (typeof text !== "string" || !text) return [];
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(FIGURE)) {
    const i = m.index ?? 0;
    if (i > last) parts.push({ text: text.slice(last, i), figure: false });
    parts.push({ text: m[0], figure: true });
    last = i + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), figure: false });
  return parts;
}

/**
 * Outcome-first bullets: the ones with a measurable figure lead (in their original order), the rest follow.
 * `lead` are shown up front, `more` sit behind a "show more". Nothing is reworded or dropped.
 */
export function prioritiseBullets(bullets: unknown, lead = 3): { lead: string[]; more: string[] } {
  const list = cleanList(bullets);
  const hasFigure = (b: string) => splitFigures(b).some((p) => p.figure);
  const ordered = [...list.filter(hasFigure), ...list.filter((b) => !hasFigure(b))];
  const n = Math.max(0, Math.floor(lead));
  return { lead: ordered.slice(0, n), more: ordered.slice(n) };
}
