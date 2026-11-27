import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  formatDuration,
  geo,
  isBot,
  mergeVisit,
  parseUserAgent,
  parseVisit,
  sanitizeBatch,
  summarize,
  trafficSource,
  type TrackBatch,
  type Visit,
  type VisitContext,
} from "./analytics.ts";

const CHROME_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const EDGE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";

const ctx = (over: Partial<VisitContext> = {}): VisitContext => ({ now: 1_000_000_000, vid: "v1", ua: CHROME_WIN, country: "IN", region: "OD", city: "Bhubaneswar", ownHost: "janmenjaya.dev", ...over });

test("sanitize: valid batch kept; malformed input dropped, never thrown", () => {
  const b = sanitizeBatch({
    sid: "abc12345-xyz",
    first: { path: "/", ref: "https://www.linkedin.com/feed/", utmSource: "", viewport: 1440, lang: "en-IN" },
    events: [
      { type: "section", label: "About", at: 1200 },
      { type: "click", label: "Download resume", href: "/api/resume", at: 5000 },
    ],
    durationMs: 6000,
  });
  assert.ok(b);
  assert.equal(b.events.length, 2);
  assert.equal(b.first?.viewport, 1440);
  for (const bad of [null, undefined, "x", 42, [], {}, { sid: "short" }, { sid: "has spaces in it" }, { sid: "<script>alert(1)</script>" }]) {
    assert.equal(sanitizeBatch(bad), null, JSON.stringify(bad));
  }
});

test("sanitize: unknown event types, empty labels, unsafe links and oversized data are dropped or trimmed", () => {
  const b = sanitizeBatch({
    sid: "abcdefgh",
    events: [
      { type: "keypress", label: "password123" },
      { type: "click", label: "   " },
      { type: "click", label: "x".repeat(500), href: "javascript:alert(1)" },
      { type: "click", label: "Line\nbreak\u0000here", href: "data:text/html,hi" },
      { type: "click", label: "GitHub", href: "https://github.com/x" },
      "not-an-object",
    ],
    durationMs: 99 * 60 * 60 * 1000,
  })!;
  assert.equal(b.events.length, 3);
  assert.equal(b.events[0].label.length, LIMITS.label);
  assert.equal(b.events[0].href, undefined, "javascript: links are never stored");
  assert.equal(b.events[1].label, "Line break here", "control characters removed");
  assert.equal(b.events[1].href, undefined, "data: links are never stored");
  assert.equal(b.events[2].href, "https://github.com/x");
  assert.equal(b.durationMs, LIMITS.maxDurationMs, "duration capped at 6h");
  const many = sanitizeBatch({ sid: "abcdefgh", events: Array.from({ length: 500 }, () => ({ type: "click", label: "x" })) })!;
  assert.equal(many.events.length, LIMITS.eventsPerBatch);
  const path = sanitizeBatch({ sid: "abcdefgh", first: { path: "https://evil.example/" } })!;
  assert.equal(path.first?.path, "/", "landing must be a path on this site");
});

test("bots and link previews are not counted as visitors", () => {
  for (const ua of ["Googlebot/2.1 (+http://www.google.com/bot.html)", "facebookexternalhit/1.1", "WhatsApp/2.23.20.0 A", "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0", "curl/8.4.0", "", null, "short"]) {
    assert.equal(isBot(ua), true, String(ua));
  }
  for (const ua of [CHROME_WIN, SAFARI_IPHONE, ANDROID, EDGE]) assert.equal(isBot(ua), false, ua);
});

test("device / browser / OS detection", () => {
  assert.deepEqual(parseUserAgent(CHROME_WIN), { device: "desktop", browser: "Chrome", os: "Windows" });
  assert.deepEqual(parseUserAgent(SAFARI_IPHONE), { device: "mobile", browser: "Safari", os: "iOS" });
  assert.deepEqual(parseUserAgent(IPAD), { device: "tablet", browser: "Safari", os: "iOS" });
  assert.deepEqual(parseUserAgent(EDGE), { device: "desktop", browser: "Edge", os: "Windows" });
  assert.deepEqual(parseUserAgent(ANDROID), { device: "mobile", browser: "Chrome", os: "Android" });
  assert.deepEqual(parseUserAgent(undefined), { device: "desktop", browser: "Other", os: "Other" });
});

test("traffic source: utm first, then referring site name (no path), own site and junk count as Direct", () => {
  assert.equal(trafficSource("https://www.linkedin.com/in/someone?x=1", "", "janmenjaya.dev"), "linkedin.com");
  assert.equal(trafficSource("https://www.google.com/", "Newsletter", "janmenjaya.dev"), "newsletter");
  assert.equal(trafficSource("", "", "janmenjaya.dev"), "Direct");
  assert.equal(trafficSource("https://janmenjaya.dev/#work", "", "janmenjaya.dev"), "Direct");
  assert.equal(trafficSource("not a url", "", "janmenjaya.dev"), "Direct");
});

test("geo headers are decoded safely", () => {
  assert.equal(geo("S%C3%A3o%20Paulo"), "São Paulo");
  assert.equal(geo("%E0%A4%A"), "%E0%A4%A", "a broken encoding doesn't throw");
  assert.equal(geo(null), "");
});

test("merge: first batch creates the visit; later batches add events, sections only once, keep the longest duration", () => {
  const first: TrackBatch = { sid: "s1-abcdef", first: { path: "/", ref: "https://github.com/", utmSource: "", utmMedium: "", utmCampaign: "", viewport: 390, lang: "en" }, events: [{ at: 100, type: "section", label: "About" }], durationMs: 3000 };
  let v = mergeVisit(null, first, ctx({ ua: SAFARI_IPHONE }));
  assert.equal(v.source, "github.com");
  assert.equal(v.device, "mobile");
  assert.equal(v.city, "Bhubaneswar");
  assert.equal(v.events.length, 1);
  v = mergeVisit(v, { sid: "s1-abcdef", events: [{ at: 900, type: "section", label: "About" }, { at: 950, type: "click", label: "Let's talk" }], durationMs: 2000 }, ctx({ now: 1_000_030_000 }));
  assert.equal(v.events.length, 2, "the repeated section is not added twice");
  assert.equal(v.durationMs, 3000, "an out-of-order shorter duration never shrinks it");
  assert.equal(v.lastAt, 1_000_030_000);
  assert.equal(v.source, "github.com", "the first batch decides the source");
  const full = mergeVisit({ ...v, events: Array.from({ length: LIMITS.eventsPerVisit }, (_, i) => ({ at: i, type: "click" as const, label: "x" })) }, { sid: "s1-abcdef", events: [{ at: 1, type: "click", label: "late" }], durationMs: 1 }, ctx());
  assert.equal(full.events.length, LIMITS.eventsPerVisit, "capped per visit");
});

test("parse stored visits: malformed entries are skipped", () => {
  const v = mergeVisit(null, { sid: "abcdefgh", events: [], durationMs: 0 }, ctx());
  assert.equal(parseVisit(JSON.stringify(v))?.id, "abcdefgh");
  assert.equal(parseVisit(v)?.id, "abcdefgh");
  for (const bad of ["{oops", null, 3, { id: "x" }]) assert.equal(parseVisit(bad), null);
});

test("summary: totals, unique visitors, live now, engagement, top lists and the per-day series", () => {
  const now = Date.UTC(2026, 10, 25, 12, 0, 0);
  const H = 60 * 60 * 1000;
  const mk = (id: string, vid: string, ago: number, extra: Partial<Visit> = {}): Visit => ({
    ...mergeVisit(null, { sid: id, events: [], durationMs: 0 }, ctx({ now: now - ago, vid })),
    ...extra,
  });
  const visits: Visit[] = [
    mk("a1aaaaaa", "u1", 1 * 60 * 1000, { source: "linkedin.com", durationMs: 95_000, events: [{ at: 1, type: "section", label: "About" }, { at: 2, type: "click", label: "Download resume" }] }),
    mk("a2aaaaaa", "u1", 3 * H, { source: "linkedin.com", durationMs: 5_000 }),
    mk("a3aaaaaa", "u2", 30 * H, { source: "Direct", country: "US", device: "mobile", durationMs: 40_000, events: [{ at: 1, type: "click", label: "Download resume" }, { at: 2, type: "click", label: "GitHub" }] }),
    mk("a4aaaaaa", "u3", 20 * 24 * H, { source: "google.com" }), // outside 7 days
  ];
  const s = summarize(visits, now, 7, "UTC");
  assert.equal(s.totals.visits, 3);
  assert.equal(s.totals.visitors, 2, "same one-day visitor hash counts once");
  assert.equal(s.totals.liveNow, 1, "only the visit active in the last 2 minutes");
  assert.equal(s.totals.clicks, 3);
  assert.equal(s.totals.engagedRate, 67, "2 of 3 visits clicked or stayed 30s+");
  assert.equal(s.totals.avgDurationMs, Math.round((95_000 + 5_000 + 40_000) / 3));
  assert.deepEqual(s.sources[0], { label: "linkedin.com", count: 2 });
  assert.deepEqual(s.clicks[0], { label: "Download resume", count: 2 });
  assert.deepEqual(s.countries.map((c) => c.label), ["IN", "US"]);
  assert.equal(s.perDay.length, 7);
  assert.equal(s.perDay.at(-1)?.visits, 2, "today");
  assert.equal(s.perDay.at(-2)?.visits, 1, "yesterday");
  assert.equal(s.recent[0].id, "a1aaaaaa", "newest first");
  assert.equal(summarize(visits, now, 30, "UTC").totals.visits, 4);
});

test("summary of nothing is all zeros (empty state), and bad ranges fall back safely", () => {
  const s = summarize([], Date.now(), 7);
  assert.equal(s.totals.visits, 0);
  assert.equal(s.totals.avgDurationMs, 0);
  assert.equal(s.totals.engagedRate, 0);
  assert.deepEqual(s.recent, []);
  assert.equal(summarize([], Date.now(), -3).days, 7);
  assert.equal(summarize([], Date.now(), 999).days, 90);
});

test("duration formatting", () => {
  assert.equal(formatDuration(0), "0s");
  assert.equal(formatDuration(45_400), "45s");
  assert.equal(formatDuration(125_000), "2m 05s");
  assert.equal(formatDuration(3_780_000), "1h 03m");
  assert.equal(formatDuration(Number.NaN), "0s");
});
