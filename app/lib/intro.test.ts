import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INTRO_BOOT_SCRIPT,
  INTRO_REMEMBER_DAYS,
  INTRO_SCROLL_KEY,
  INTRO_SEEN_AT_KEY,
  INTRO_SEEN_KEY,
  isIntroSeen,
  PHASE,
  quillPoint,
  toRoman,
  unrollForOpen,
  currentSection,
  paperFrame,
  phaseProgress,
  resolveIntroMode,
  sectionReveal,
  type PaperMetrics,
} from "./intro.ts";

const M: PaperMetrics = { height: 2400, openAtStart: 64, viewport: 900, sheetTop: 108, followLine: 0.76, rollFrom: 54, rollTo: 28 };

test("mode: plays on a first visit, static for reduced motion, off once seen this session", () => {
  assert.equal(resolveIntroMode({ seen: false, reduced: false }), "play");
  assert.equal(resolveIntroMode({ seen: false, reduced: true }), "static");
  assert.equal(resolveIntroMode({ seen: true, reduced: false }), "off");
  assert.equal(resolveIntroMode({ seen: true, reduced: true }), "off");
});

/* run the real inline script against a fake <html>, storage, matchMedia, navigation timing, history and layout */
type BootEnv = {
  stored?: string;
  saved?: unknown;
  reduced?: boolean;
  storageThrows?: boolean;
  noMatchMedia?: boolean;
  nav?: string | null;
  /** frames until the streamed page is laid out (hero visible, page tall); Infinity = never */
  layoutAfter?: number;
  /** fire this window event (e.g. "wheel") before the given frame */
  userInput?: { event: string; atFrame: number };
  path?: string;
  /** localStorage "seen at" timestamp (ms) */
  seenAt?: string | null;
  localThrows?: boolean;
};
function boot({ stored, saved, reduced, storageThrows = false, noMatchMedia = false, nav = "navigate", layoutAfter = 0, userInput, path = "/", seenAt = null, localThrows = false }: BootEnv) {
  const attrs: Record<string, string> = {};
  const scrolls: Array<{ top: number; frame: number }> = [];
  let frame = 0;
  const listeners: Record<string, () => void> = {};
  const laidOut = () => frame >= layoutAfter;
  const document = {
    documentElement: {
      setAttribute: (k: string, v: string) => (attrs[k] = v),
      get scrollHeight() {
        return laidOut() ? 20000 : 1200;
      },
    },
    getElementById: (id: string) => (id === "hero" ? { offsetParent: laidOut() ? {} : null } : null),
  };
  const sessionStorage = {
    getItem: (k: string) => {
      if (storageThrows) throw new Error("SecurityError");
      if (k === INTRO_SEEN_KEY) return stored ?? null;
      if (k === INTRO_SCROLL_KEY) return saved === undefined ? null : JSON.stringify(saved);
      return null;
    },
  };
  const matchMedia = noMatchMedia ? undefined : () => ({ matches: !!reduced });
  const performance = { getEntriesByType: () => (nav ? [{ type: nav }] : []) };
  const history = { scrollRestoration: "auto" };
  const queue: Array<() => void> = [];
  const window = {
    innerHeight: 900,
    scrollTo: (o: { top: number }) => scrolls.push({ top: o.top, frame }),
    addEventListener: (type: string, fn: () => void) => (listeners[type] = fn),
    requestAnimationFrame: (fn: () => void) => queue.push(fn),
  };
  const location = { pathname: path };
  const localStorage = {
    getItem: (k: string) => {
      if (localThrows) throw new Error("SecurityError");
      return k === INTRO_SEEN_AT_KEY ? seenAt : null;
    },
  };
  new Function("document", "sessionStorage", "matchMedia", "performance", "history", "window", "location", "localStorage", INTRO_BOOT_SCRIPT)(
    document, sessionStorage, matchMedia, performance, history, window, location, localStorage,
  );
  // run animation frames
  while (queue.length && frame < 1000) {
    frame++;
    if (userInput && frame === userInput.atFrame) listeners[userInput.event]?.();
    queue.shift()!();
  }
  return { attrs, scrolls, restoration: history.scrollRestoration, frames: frame };
}

test("boot script: first visit plays and holds the hero entrance", () => {
  assert.deepEqual(boot({}).attrs, { "data-intro": "play", "data-intro-hold": "" });
});

test("boot script: seen this session → off, no hold (hero animates normally)", () => {
  assert.deepEqual(boot({ stored: "1" }).attrs, { "data-intro": "off" });
});

test("boot script: reduced motion → static, no hold", () => {
  assert.deepEqual(boot({ reduced: true }).attrs, { "data-intro": "static" });
});

test("boot script: blocked storage or missing matchMedia never throws — the intro still plays", () => {
  assert.equal(boot({ storageThrows: true }).attrs["data-intro"], "play");
  assert.equal(boot({ noMatchMedia: true }).attrs["data-intro"], "play");
  assert.equal(boot({ nav: null, stored: "1", saved: { y: 9000, o: 3780 } }).attrs["data-intro"], "off", "no Navigation Timing → still boots");
  assert.equal(boot({ stored: "yes" }).attrs["data-intro"], "play", "only the exact flag counts as seen");
});

test("boot script: only acts on the homepage (it sits in the root layout, shared with /admin and /newone)", () => {
  for (const path of ["/admin", "/newone", "/admin/login"]) {
    const r = boot({ path, stored: "1", saved: { y: 6100, o: 3780 }, nav: "reload" });
    assert.deepEqual(r.attrs, {}, path);
    assert.deepEqual(r.scrolls, [], path);
    assert.equal(r.restoration, "auto", path);
  }
});

test("scroll restore: reload after the intro was seen lands on the same content (y − intro height)", () => {
  const r = boot({ stored: "1", saved: { y: 6100, o: 3780 }, nav: "reload" });
  assert.equal(r.restoration, "manual");
  assert.deepEqual(r.scrolls, [{ top: 2320, frame: 0 }]);
  assert.deepEqual(boot({ stored: "1", saved: { y: 4000, o: 3780 }, nav: "back_forward" }).scrolls, [{ top: 220, frame: 0 }]);
  // left while still inside the intro → top of the page, never negative
  assert.deepEqual(boot({ stored: "1", saved: { y: 1200, o: 3780 }, nav: "reload" }).scrolls, [{ top: 0, frame: 0 }]);
});

test("scroll restore: waits for the streamed page to be laid out, then scrolls exactly once", () => {
  const r = boot({ stored: "1", saved: { y: 6100, o: 3780 }, nav: "reload", layoutAfter: 12 });
  assert.deepEqual(r.scrolls, [{ top: 2320, frame: 12 }]);
});

test("scroll restore: gives up waiting after ~3s of frames instead of looping forever", () => {
  const r = boot({ stored: "1", saved: { y: 6100, o: 3780 }, nav: "reload", layoutAfter: Infinity });
  assert.equal(r.scrolls.length, 1);
  assert.ok(r.scrolls[0].frame > 170 && r.scrolls[0].frame < 200, String(r.scrolls[0].frame));
});

test("scroll restore: the visitor's own scroll/keys/touch win over the restore", () => {
  for (const event of ["wheel", "touchstart", "keydown"]) {
    const r = boot({ stored: "1", saved: { y: 6100, o: 3780 }, nav: "reload", layoutAfter: 20, userInput: { event, atFrame: 5 } });
    assert.deepEqual(r.scrolls, [], event);
  }
});

test("scroll restore: everything else keeps the browser's own restoration", () => {
  const cases: BootEnv[] = [
    { stored: "1", saved: { y: 6100, o: 3780 }, nav: "navigate" }, // a fresh visit starts at the top / #hash as usual
    { stored: "1", saved: { y: 6100, o: 0 }, nav: "reload" }, // the intro was already hidden when they left
    { saved: { y: 6100, o: 3780 }, nav: "reload" }, // intro still plays: same layout as before
    { stored: "1", nav: "reload" }, // nothing saved
    { stored: "1", saved: "garbage", nav: "reload" },
    { stored: "1", saved: { y: "x", o: "y" }, nav: "reload" },
  ];
  for (const c of cases) {
    const r = boot(c);
    assert.deepEqual(r.scrolls, [], JSON.stringify(c));
    assert.equal(r.restoration, "auto", JSON.stringify(c));
  }
});

test("phases are ordered, contiguous and cover the whole scroll", () => {
  const list = [PHASE.rise, PHASE.unroll, PHASE.sign, PHASE.reveal];
  assert.equal(list[0][0], 0);
  assert.equal(list.at(-1)![1], 1);
  for (let i = 1; i < list.length; i++) assert.equal(list[i][0], list[i - 1][1]);
  assert.equal(phaseProgress(0.05, PHASE.unroll), 0);
  assert.equal(phaseProgress(0.9, PHASE.unroll), 1);
  assert.ok(Math.abs(phaseProgress(0.41, PHASE.unroll) - 0.5) < 1e-9);
});

test("paper: rolled up at 0 (only the letterhead), fully open at 1", () => {
  const a = paperFrame(0, M);
  assert.equal(a.open, 64);
  assert.equal(a.hidden, 2400 - 64);
  assert.equal(a.angle, 0);
  assert.equal(a.roll, 54);
  const b = paperFrame(1, M);
  assert.equal(b.open, 2400);
  assert.equal(b.hidden, 0);
  assert.equal(b.roll, 28);
});

test("paper: unrolling is monotonic and the roll keeps turning one way while it thins", () => {
  let prev = paperFrame(0, M);
  for (let i = 1; i <= 100; i++) {
    const f = paperFrame(i / 100, M);
    assert.ok(f.open >= prev.open, `open at ${i}`);
    assert.ok(f.angle >= prev.angle, `angle at ${i}`);
    assert.ok(f.roll <= prev.roll, `roll at ${i}`);
    assert.ok(f.follow <= prev.follow, `camera at ${i}`);
    prev = f;
  }
});

test("paper: rotation matches the paper released (no slipping): angle ≈ distance ÷ radius", () => {
  const f = paperFrame(1, M);
  const distance = 2400 - 64;
  const avgRadius = (54 + 28) / 4;
  assert.ok(Math.abs(f.angle - (distance / avgRadius) * (180 / Math.PI)) < 1e-6);
  assert.ok(f.angle > 360 * 10, "a long document turns the roll many times");
});

test("paper: scrolling back gives exactly the same frame (reversible)", () => {
  const forward = paperFrame(0.37, M);
  paperFrame(0.9, M);
  assert.deepEqual(paperFrame(0.37, M), forward);
});

test("paper: the camera follows only once the roll would pass the follow line, and keeps it there", () => {
  assert.equal(paperFrame(0, M).follow, 0);
  const f = paperFrame(1, M);
  const rollOnScreen = M.sheetTop + f.open + f.follow;
  assert.ok(Math.abs(rollOnScreen - M.viewport * M.followLine) < 1e-6);
  // a short document never needs the camera to move
  assert.equal(paperFrame(1, { ...M, height: 300 }).follow, 0);
});

test("paper: malformed metrics never produce NaN or a negative clip", () => {
  const bad = paperFrame(Number.NaN, { ...M, height: Number.NaN, openAtStart: -50, viewport: Number.NaN, followLine: 7 });
  for (const v of Object.values(bad)) assert.ok(Number.isFinite(v), JSON.stringify(bad));
  assert.ok(bad.hidden >= 0);
  // letterhead taller than the whole document → clamp to the document
  const tiny = paperFrame(0, { ...M, height: 40, openAtStart: 64 });
  assert.equal(tiny.open, 40);
  assert.equal(tiny.hidden, 0);
  // out-of-range progress clamps
  assert.deepEqual(paperFrame(-3, M), paperFrame(0, M));
  assert.deepEqual(paperFrame(9, M), paperFrame(1, M));
});

test("ink settles as the roll passes a section, within the span", () => {
  assert.equal(sectionReveal(100, 200), 0);
  assert.equal(sectionReveal(200, 200), 0);
  assert.ok(Math.abs(sectionReveal(255, 200, 110) - 0.5) < 1e-9);
  assert.equal(sectionReveal(400, 200), 1);
  assert.equal(sectionReveal(201, 200, 0), 1, "zero span settles immediately instead of dividing by zero");
});

test("section counter follows the roll", () => {
  const tops = [64, 400, 900, 1500];
  assert.equal(currentSection(0, tops), 0);
  assert.equal(currentSection(480, tops), 0, "a heading peeking out isn't 'reading' that section yet");
  assert.equal(currentSection(500, tops), 1);
  assert.equal(currentSection(5000, tops), 3);
  assert.equal(currentSection(100, []), 0);
});

test("chapter jump: unrollForOpen inverts paperFrame (so clicking a chapter lands on it)", () => {
  for (const target of [100, 500, 1234, 2000]) {
    const u = unrollForOpen(target, M);
    assert.ok(Math.abs(paperFrame(u, M).open - target) < 0.5, `${target}`);
  }
  assert.equal(unrollForOpen(10, M), 0, "already open at the start");
  assert.equal(unrollForOpen(99999, M), 1, "beyond the end → fully open");
  assert.equal(unrollForOpen(Number.NaN, M), 0);
});

test("chapter numerals are Roman", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 9, 14, 40].map(toRoman), ["I", "II", "III", "IV", "V", "VI", "IX", "XIV", "XL"]);
  assert.equal(toRoman(0), "0");
  assert.equal(toRoman(2.5), "2.5");
});

test("quill: writes left → right across the signature, staying inside its box", () => {
  const box = { x: 100, y: 50, w: 300, h: 60 };
  assert.equal(quillPoint(0, box).x, 100);
  assert.equal(quillPoint(1, box).x, 400);
  let prev = -Infinity;
  for (let i = 0; i <= 50; i++) {
    const pt = quillPoint(i / 50, box);
    assert.ok(pt.x >= prev, "never moves backwards");
    assert.ok(pt.y >= box.y && pt.y <= box.y + box.h, "stays on the line");
    prev = pt.x;
  }
  assert.deepEqual(quillPoint(-1, box), quillPoint(0, box));
  assert.deepEqual(quillPoint(5, box), quillPoint(1, box));
});

import { MAX_MOTES, moteAlpha, spawnMotes, stepMotes } from "./intro.ts";

const seq = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

test("mist: more puffs the further the pointer moves (capped), doubled over buttons, none when still", () => {
  const a = { x: 100, y: 100 };
  assert.equal(spawnMotes(a, { x: 101, y: 100 }).length, 0, "a tiny jitter makes no mist");
  assert.equal(spawnMotes(a, { x: 110, y: 100 }, false, seq([0.5])).length, 1);
  assert.equal(spawnMotes(a, { x: 140, y: 100 }, false, seq([0.5])).length, 3);
  assert.equal(spawnMotes(a, { x: 900, y: 100 }, false, seq([0.5])).length, 4, "fast flicks are capped");
  assert.equal(spawnMotes(a, { x: 900, y: 100 }, true, seq([0.5])).length, 8, "buttons glow more");
  assert.deepEqual(spawnMotes(a, { x: Number.NaN, y: 0 }), []);
});

test("mist: puffs start on the pointer's path and drift upwards", () => {
  const ms = spawnMotes({ x: 0, y: 0 }, { x: 100, y: 0 }, false, seq([0.5]));
  for (const m of ms) {
    assert.ok(m.x >= 0 && m.x <= 100 && m.y === 0);
    assert.ok(m.vy < 0, "rises");
  }
  const later = stepMotes(ms, 0.5);
  assert.ok(later.every((m, i) => m.y < ms[i].y && m.r > ms[i].r), "rises and spreads");
});

test("mist: fades in and out, dies at the end of its life, never exceeds the cap", () => {
  const m = spawnMotes({ x: 0, y: 0 }, { x: 20, y: 0 }, false, seq([0.5]))[0];
  assert.equal(moteAlpha(m), 0, "invisible at birth");
  assert.ok(moteAlpha({ ...m, age: m.life / 2 }) > 0.3, "brightest mid-life");
  let ms = [m];
  for (let i = 0; i < 60; i++) ms = stepMotes(ms, 0.05);
  assert.equal(ms.length, 0, "gone after its life");
  let many = Array.from({ length: 40 }, () => spawnMotes({ x: 0, y: 0 }, { x: 900, y: 0 }, true)).flat();
  many = stepMotes(many, 0.016);
  assert.ok(many.length <= MAX_MOTES);
  assert.deepEqual(stepMotes([m], Number.NaN), [m], "a bad dt doesn't move anything");
  const huge = stepMotes([m], 30)[0];
  assert.ok(huge && Math.abs(huge.y - m.y) < 10, "a stalled tab (huge dt) is clamped");
});

import { railFill } from "./intro.ts";

test("rail: dots are evenly spaced, and the fill reaches dot i exactly when chapter i is read", () => {
  const at = [0.2, 0.25, 0.3, 0.5, 0.6, 0.68]; // uneven chapter lengths (skills is short, work is long)
  at.forEach((p, i) => assert.ok(Math.abs(railFill(p, at) - i / 5) < 1e-9, `dot ${i}`));
  assert.ok(Math.abs(railFill(0.4, at) - 2.5 / 5) < 1e-9, "halfway between III and IV");
  assert.equal(railFill(0, at), 0);
  assert.equal(railFill(0.1, at), 0, "nothing filled before chapter I");
  assert.equal(railFill(0.9, at), 1, "full after the last chapter");
  let prev = -1;
  for (let i = 0; i <= 100; i++) {
    const f = railFill(i / 100, at);
    assert.ok(f >= prev, "never goes backwards");
    prev = f;
  }
});

test("rail: malformed input degrades gracefully", () => {
  assert.equal(railFill(0.4, []), 0.4, "no chapters → plain progress");
  assert.equal(railFill(0.4, [0.3]), 0.4);
  assert.equal(railFill(Number.NaN, [0.2, 0.5]), 0);
  assert.ok(Math.abs(railFill(0.35, [0.2, Number.NaN, 0.5]) - 0.5) < 1e-9, "bad entries skipped");
  assert.equal(railFill(0.3, [0.3, 0.3]), 0, "duplicate positions don't divide by zero");
});


const DAY = 24 * 60 * 60 * 1000;

test("returning visitors: the intro is skipped for 30 days after it was finished or skipped", () => {
  const now = Date.UTC(2026, 10, 24);
  assert.equal(INTRO_REMEMBER_DAYS, 30);
  assert.equal(isIntroSeen({ session: null, seenAt: null, now }), false, "first visit");
  assert.equal(isIntroSeen({ session: "1", seenAt: null, now }), true, "same tab");
  assert.equal(isIntroSeen({ session: null, seenAt: String(now - 3 * DAY), now }), true, "3 days ago");
  assert.equal(isIntroSeen({ session: null, seenAt: String(now - 29.9 * DAY), now }), true);
  assert.equal(isIntroSeen({ session: null, seenAt: String(now - 30 * DAY), now }), false, "30 days on: plays again");
  assert.equal(isIntroSeen({ session: null, seenAt: String(now + DAY), now }), false, "a future timestamp (clock change) doesn't count");
  for (const bad of ["", "abc", "-5", "0", "NaN"]) assert.equal(isIntroSeen({ session: null, seenAt: bad, now }), false, bad);
});

test("boot script: honours the 30-day memory before first paint; blocked localStorage still boots", () => {
  assert.equal(boot({ seenAt: String(Date.now() - 2 * DAY) }).attrs["data-intro"], "off", "seen 2 days ago → no intro");
  assert.equal(boot({ seenAt: String(Date.now() - 45 * DAY) }).attrs["data-intro"], "play", "45 days ago → plays again");
  assert.equal(boot({ seenAt: "garbage" }).attrs["data-intro"], "play");
  assert.equal(boot({ localThrows: true }).attrs["data-intro"], "play", "private mode: no crash, intro plays");
  assert.equal(boot({ stored: "1", localThrows: true }).attrs["data-intro"], "off", "the tab flag alone still works");
});
