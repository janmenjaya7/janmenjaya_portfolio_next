/* Visitor analytics — privacy-friendly, cookie-free. Pure and import-free so it runs under `node --test`.
   What is kept per visit: time, country/region/city (from the hosting platform), device/browser/OS, where the visitor
   came from (site name only), the landing page, how long they stayed, sections reached and things clicked.
   Never kept: IP addresses, cookies/IDs on the device, anything typed into forms. "Unique visitors" use a one-day
   hash (secret + day + IP + browser) that can't be reversed or linked across days. */

export type TrackEventType = "section" | "click";
export type TrackEvent = { at: number; type: TrackEventType; label: string; href?: string };

export type Visit = {
  id: string;
  /** one-day anonymous visitor hash (counts unique visitors per day; not linkable across days) */
  vid: string;
  startedAt: number;
  lastAt: number;
  durationMs: number;
  country: string;
  region: string;
  city: string;
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
  /** "Direct", or the site the visitor came from (hostname only), or the utm_source */
  source: string;
  campaign: string;
  landing: string;
  viewport: number;
  lang: string;
  events: TrackEvent[];
};

export type TrackBatch = {
  sid: string;
  first?: { path: string; ref: string; utmSource: string; utmMedium: string; utmCampaign: string; viewport: number; lang: string };
  events: TrackEvent[];
  durationMs: number;
};

export const LIMITS = { eventsPerBatch: 40, eventsPerVisit: 200, label: 80, href: 200, path: 200, maxDurationMs: 6 * 60 * 60 * 1000 } as const;

const CONTROL = /[\u0000-\u001f\u007f]/g;
const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
const num = (v: unknown, min: number, max: number, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback);

/** Validate a batch from the browser. Anything malformed is dropped rather than stored. */
export function sanitizeBatch(raw: unknown): TrackBatch | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const sid = typeof r.sid === "string" && /^[A-Za-z0-9-]{8,64}$/.test(r.sid) ? r.sid : "";
  if (!sid) return null;

  let first: TrackBatch["first"];
  if (r.first && typeof r.first === "object") {
    const f = r.first as Record<string, unknown>;
    const path = clean(f.path, LIMITS.path);
    first = {
      path: path.startsWith("/") ? path : "/",
      ref: clean(f.ref, 300),
      utmSource: clean(f.utmSource, 60),
      utmMedium: clean(f.utmMedium, 60),
      utmCampaign: clean(f.utmCampaign, 80),
      viewport: num(f.viewport, 0, 10000),
      lang: clean(f.lang, 20),
    };
  }

  const events: TrackEvent[] = [];
  if (Array.isArray(r.events)) {
    for (const e of r.events.slice(0, LIMITS.eventsPerBatch)) {
      if (!e || typeof e !== "object") continue;
      const x = e as Record<string, unknown>;
      if (x.type !== "section" && x.type !== "click") continue;
      const label = clean(x.label, LIMITS.label);
      if (!label) continue;
      const href = clean(x.href, LIMITS.href);
      // only keep links that are safe to show as plain text (no javascript:, data:, …)
      const safeHref = href && /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(href) ? href : "";
      events.push({ at: num(x.at, 0, LIMITS.maxDurationMs), type: x.type, label, ...(safeHref ? { href: safeHref } : {}) });
    }
  }
  return { sid, first, events, durationMs: num(r.durationMs, 0, LIMITS.maxDurationMs) };
}

/** Crawlers, link previews, uptime checkers and headless browsers aren't visitors. */
export function isBot(ua: string | null | undefined): boolean {
  if (!ua || ua.length < 20) return true;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|postman|insomnia/i.test(
    ua,
  );
}

/** Device, browser and OS from the User-Agent (coarse — good enough for a dashboard). */
export function parseUserAgent(ua: string | null | undefined): { device: Visit["device"]; browser: string; os: string } {
  const s = ua ?? "";
  const tablet = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s);
  const mobile = !tablet && /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s);
  const os = /Windows NT/i.test(s)
    ? "Windows"
    : /iPhone|iPad|iPod/i.test(s)
      ? "iOS"
      : /Android/i.test(s)
        ? "Android"
        : /CrOS/i.test(s)
          ? "ChromeOS"
          : /Mac OS X|Macintosh/i.test(s)
            ? "macOS"
            : /Linux/i.test(s)
              ? "Linux"
              : "Other";
  const browser = /Edg(e|A|iOS)?\//i.test(s)
    ? "Edge"
    : /OPR\/|Opera/i.test(s)
      ? "Opera"
      : /SamsungBrowser/i.test(s)
        ? "Samsung Internet"
        : /Firefox|FxiOS/i.test(s)
          ? "Firefox"
          : /Chrome|CriOS/i.test(s)
            ? "Chrome"
            : /Safari/i.test(s)
              ? "Safari"
              : "Other";
  return { device: tablet ? "tablet" : mobile ? "mobile" : "desktop", browser, os };
}

/** Where the visitor came from: utm_source if given, else the referring site's name, else "Direct". */
export function trafficSource(ref: string, utmSource: string, ownHost: string): string {
  if (utmSource) return utmSource.toLowerCase();
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || host === ownHost.replace(/^www\./, "").toLowerCase()) return "Direct";
    return host;
  } catch {
    return "Direct";
  }
}

/** Decode a geo header value (Vercel URL-encodes city names); never throws. */
export function geo(v: string | null | undefined): string {
  if (!v) return "";
  try {
    return clean(decodeURIComponent(v), 60);
  } catch {
    return clean(v, 60);
  }
}

export type VisitContext = {
  now: number;
  vid: string;
  ua: string;
  country: string;
  region: string;
  city: string;
  ownHost: string;
};

/** Fold a batch into the stored visit (creating it on the first batch). Sections are kept once each. */
export function mergeVisit(existing: Visit | null, batch: TrackBatch, ctx: VisitContext): Visit {
  const base: Visit =
    existing ??
    (() => {
      const ua = parseUserAgent(ctx.ua);
      const f = batch.first;
      return {
        id: batch.sid,
        vid: ctx.vid,
        startedAt: ctx.now - Math.min(batch.durationMs, 60_000),
        lastAt: ctx.now,
        durationMs: 0,
        country: ctx.country,
        region: ctx.region,
        city: ctx.city,
        ...ua,
        source: trafficSource(f?.ref ?? "", f?.utmSource ?? "", ctx.ownHost),
        campaign: [f?.utmMedium, f?.utmCampaign].filter(Boolean).join(" / "),
        landing: f?.path ?? "/",
        viewport: f?.viewport ?? 0,
        lang: f?.lang ?? "",
        events: [],
      };
    })();

  const seenSections = new Set(base.events.filter((e) => e.type === "section").map((e) => e.label));
  const events = [...base.events];
  for (const e of batch.events) {
    if (events.length >= LIMITS.eventsPerVisit) break;
    if (e.type === "section") {
      if (seenSections.has(e.label)) continue;
      seenSections.add(e.label);
    }
    events.push(e);
  }
  return { ...base, lastAt: ctx.now, durationMs: Math.max(base.durationMs, batch.durationMs), events };
}

/** Parse a stored visit; null for anything malformed. */
export function parseVisit(v: unknown): Visit | null {
  const o = typeof v === "string" ? safeJson(v) : v;
  if (!o || typeof o !== "object") return null;
  const x = o as Partial<Visit>;
  if (typeof x.id !== "string" || typeof x.startedAt !== "number" || typeof x.lastAt !== "number" || !Array.isArray(x.events)) return null;
  return x as Visit;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export type Count = { label: string; count: number };
export type VisitorSummary = {
  days: number;
  totals: { visits: number; visitors: number; liveNow: number; avgDurationMs: number; engagedRate: number; clicks: number };
  perDay: Array<{ day: string; visits: number }>;
  sources: Count[];
  countries: Count[];
  devices: Count[];
  browsers: Count[];
  sections: Count[];
  clicks: Count[];
  recent: Visit[];
};

export const LIVE_WINDOW_MS = 2 * 60 * 1000;

const top = (m: Map<string, number>, n: number): Count[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([label, count]) => ({ label, count }));
const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

/** Local calendar day (YYYY-MM-DD) in a time zone, for the per-day chart. */
export function dayKey(ts: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

/** Dashboard numbers for the last `days` days (visits outside the range are ignored). */
export function summarize(all: Visit[], now: number, days: number, timeZone = "Asia/Kolkata", recentCount = 50): VisitorSummary {
  const d = Number.isInteger(days) && days > 0 ? Math.min(days, 90) : 7;
  const from = now - d * 24 * 60 * 60 * 1000;
  const visits = all.filter((v) => v && v.startedAt >= from && v.startedAt <= now + 60_000).sort((a, b) => b.startedAt - a.startedAt);

  const sources = new Map<string, number>();
  const countries = new Map<string, number>();
  const devices = new Map<string, number>();
  const browsers = new Map<string, number>();
  const sections = new Map<string, number>();
  const clicks = new Map<string, number>();
  const perDay = new Map<string, number>();
  const visitors = new Set<string>();
  let duration = 0;
  let engaged = 0;
  let clickCount = 0;
  let live = 0;

  for (let i = 0; i < d; i++) perDay.set(dayKey(now - i * 24 * 60 * 60 * 1000, timeZone), 0);

  for (const v of visits) {
    visitors.add(v.vid || v.id);
    bump(sources, v.source || "Direct");
    bump(countries, v.country || "Unknown");
    bump(devices, v.device || "desktop");
    bump(browsers, v.browser || "Other");
    const k = dayKey(v.startedAt, timeZone);
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
    duration += v.durationMs || 0;
    if (now - v.lastAt <= LIVE_WINDOW_MS) live++;
    const visitSections = new Set<string>();
    let didClick = false;
    for (const e of v.events) {
      if (e.type === "section") visitSections.add(e.label);
      else {
        clickCount++;
        didClick = true;
        bump(clicks, e.label);
      }
    }
    visitSections.forEach((s) => bump(sections, s));
    // engaged = clicked something, or stayed 30s+, or got past the first two sections
    if (didClick || (v.durationMs || 0) >= 30_000 || visitSections.size > 2) engaged++;
  }

  return {
    days: d,
    totals: {
      visits: visits.length,
      visitors: visitors.size,
      liveNow: live,
      avgDurationMs: visits.length ? Math.round(duration / visits.length) : 0,
      engagedRate: visits.length ? Math.round((engaged / visits.length) * 100) : 0,
      clicks: clickCount,
    },
    perDay: [...perDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, n]) => ({ day, visits: n })),
    sources: top(sources, 8),
    countries: top(countries, 8),
    devices: top(devices, 3),
    browsers: top(browsers, 6),
    sections: top(sections, 12),
    clicks: top(clicks, 12),
    recent: visits.slice(0, recentCount),
  };
}

/** "2m 05s", "45s", "1h 03m" */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round((Number.isFinite(ms) ? ms : 0) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}
