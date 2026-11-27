/* Cinematic intro: mode, storage and the paper-unrolling geometry.
   Pure and import-free so it runs under `node --test`. */

/** sessionStorage key: set once the visitor has finished or skipped the intro in this tab. */
export const INTRO_SEEN_KEY = "jb-intro-seen";

/** localStorage key: when (ms since epoch) this browser last finished or skipped the intro. */
export const INTRO_SEEN_AT_KEY = "jb-intro-seen-at";

/** A returning visitor skips the intro for this long (Replay intro in the footer always brings it back). */
export const INTRO_REMEMBER_DAYS = 30;
const REMEMBER_MS = INTRO_REMEMBER_DAYS * 24 * 60 * 60 * 1000;

/**
 * Has this visitor already seen the intro? Yes if they finished/skipped it in this tab, or in this browser within
 * the last 30 days. A timestamp from the future (clock changed) or garbage counts as "not seen".
 */
export function isIntroSeen({ session, seenAt, now }: { session: string | null; seenAt: string | null; now: number }): boolean {
  if (session === "1") return true;
  const at = Number(seenAt);
  return Number.isFinite(at) && at > 0 && at <= now && now - at < REMEMBER_MS;
}

/** Window event fired by the footer's "Replay intro"; the intro listens for it. */
export const INTRO_REPLAY_EVENT = "jb:intro-replay";

/** Attribute on <html> that CSS keys off: "play" (scroll-driven), "static" (reduced motion), "off" (hidden). */
export type IntroMode = "play" | "static" | "off";

export function resolveIntroMode({ seen, reduced }: { seen: boolean; reduced: boolean }): IntroMode {
  if (seen) return "off";
  return reduced ? "static" : "play";
}

/** sessionStorage key: scroll position at page hide + how tall the intro above the hero was (`{ y, o }`). */
export const INTRO_SCROLL_KEY = "jb-intro-scroll";

/*
  Runs inline before first paint (root layout, first thing in <body>). Self-contained (no outer references) because it is
  serialised with toString(). It must never throw: storage can be blocked (private mode) and matchMedia or
  the Navigation Timing API can be missing — in those cases the intro still plays.

  - sets <html data-intro="play|static|off">; "play" also sets data-intro-hold (the hero entrance waits for the clouds)
  - when the intro is hidden on a reload / back-forward, the page is shorter than when the visitor left it, so the
    browser's own scroll restoration would land too far down: restore `y - o` (o = intro height then) instead.
*/
function bootIntro(seenKey: string, scrollKey: string, seenAtKey: string, rememberMs: number) {
  if (location.pathname !== "/") return; // it lives in the root layout; only the homepage has an intro
  const d = document.documentElement;
  let seen = false;
  let reduced = false;
  try {
    seen = sessionStorage.getItem(seenKey) === "1";
  } catch {}
  if (!seen) {
    try {
      // same rule as isIntroSeen (this function is serialised, so it can't call it)
      const at = Number(localStorage.getItem(seenAtKey));
      const now = Date.now();
      seen = Number.isFinite(at) && at > 0 && at <= now && now - at < rememberMs;
    } catch {}
  }
  try {
    reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {}
  const mode = seen ? "off" : reduced ? "static" : "play";
  d.setAttribute("data-intro", mode);
  if (mode === "play") d.setAttribute("data-intro-hold", "");
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const returning = !!nav && (nav.type === "reload" || nav.type === "back_forward");
    const saved = JSON.parse(sessionStorage.getItem(scrollKey) || "null");
    if (mode !== "off" || !returning || !saved || !(saved.o > 0)) {
      history.scrollRestoration = "auto";
      return;
    }
    const y = Math.max(0, (Number(saved.y) || 0) - saved.o);
    history.scrollRestoration = "manual";
    // the page streams in behind a loading skeleton (React reveals it a little later), so wait — frame by
    // frame, at most ~3s — until the hero is really laid out and the page is tall enough to land on `y`.
    // If the visitor scrolls first, their scroll wins.
    let stopped = false;
    const stop = function () {
      stopped = true;
    };
    const opts = { once: true, passive: true };
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("touchstart", stop, opts);
    window.addEventListener("keydown", stop, opts);
    let frames = 0;
    const tick = function () {
      if (stopped) return;
      const hero = document.getElementById("hero");
      const ready = !!hero && hero.offsetParent !== null && document.documentElement.scrollHeight - window.innerHeight >= y;
      if (ready || frames++ > 180) window.scrollTo({ top: y, behavior: "instant" });
      else window.requestAnimationFrame(tick);
    };
    tick();
  } catch {}
}

export const INTRO_BOOT_SCRIPT = `(${bootIntro.toString()})(${JSON.stringify(INTRO_SEEN_KEY)},${JSON.stringify(INTRO_SCROLL_KEY)},${JSON.stringify(INTRO_SEEN_AT_KEY)},${REMEMBER_MS});`;

/** Timeline phases as shares of the whole scroll (0 → 1). */
export const PHASE = {
  /** name lifts away while the rolled paper rises into view */
  rise: [0, 0.12],
  /** the roll travels down and unrolls the document */
  unroll: [0.12, 0.7],
  /** the peacock-feather quill signs, the wax seal stamps, warm light crosses the paper */
  sign: [0.7, 0.84],
  /** clouds gather, then part onto the hero */
  reveal: [0.84, 1],
} as const;

export const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Progress of the whole timeline mapped into one phase (0 before it, 1 after it). */
export function phaseProgress(p: number, [from, to]: readonly [number, number]): number {
  return to <= from ? (p >= to ? 1 : 0) : clamp01((p - from) / (to - from));
}

/* Gentle ease so the roll starts and settles like something with weight. */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export type PaperMetrics = {
  /** full height of the resume content, px */
  height: number;
  /** height already open while rolled up (the header band), px */
  openAtStart: number;
  /** stage (viewport) height, px */
  viewport: number;
  /** where the top of the sheet sits in the stage before it starts following the roll, px */
  sheetTop: number;
  /** the roll is kept above this line of the stage (0–1) — the "camera" follows it */
  followLine: number;
  /** roll diameter fully rolled / fully unrolled, px */
  rollFrom: number;
  rollTo: number;
};

export type PaperFrame = {
  /** px of paper unrolled (visible, from the top of the sheet) */
  open: number;
  /** px of the sheet still clipped below the roll */
  hidden: number;
  /** roll diameter, px (the roll thins as paper leaves it) */
  roll: number;
  /** roll rotation in degrees: distance travelled ÷ radius — the paper never slips */
  angle: number;
  /** translateY for the whole document so the roll stays on screen, px (≤ 0) */
  follow: number;
};

/**
 * Geometry for one frame of the unroll. A pure function of progress, so scrolling back up
 * replays exactly the same frames in reverse.
 */
export function paperFrame(unroll: number, m: PaperMetrics): PaperFrame {
  const height = Math.max(0, m.height || 0);
  const start = Math.min(height, Math.max(0, m.openAtStart || 0));
  const t = easeInOut(clamp01(unroll));
  const open = lerp(start, height, t);
  const roll = Math.max(1, lerp(m.rollFrom, m.rollTo, t));

  // integrate distance / radius with the average radius over the travel (exact for a linear taper)
  const travelled = open - start;
  const avgRadius = Math.max(0.5, (m.rollFrom + roll) / 4);
  const angle = (travelled / avgRadius) * (180 / Math.PI);

  const line = clamp01(m.followLine) * Math.max(0, m.viewport || 0);
  const follow = Math.min(0, line - (m.sheetTop + open));

  return { open, hidden: height - open, roll, angle, follow };
}

/** How settled a section is (0–1) given how far the paper is open; ink settles within `span` px behind the roll. */
export function sectionReveal(open: number, sectionTop: number, span = 110): number {
  return clamp01((open - sectionTop) / Math.max(1, span));
}

/** Paper progress (0–1) at which `target` px are open — the inverse of paperFrame (it is monotonic). */
export function unrollForOpen(target: number, m: PaperMetrics): number {
  if (!Number.isFinite(target)) return 0;
  let lo = 0;
  let hi = 1;
  if (paperFrame(0, m).open >= target) return 0;
  if (paperFrame(1, m).open <= target) return 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (paperFrame(mid, m).open < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 1 → "I", 6 → "VI", 14 → "XIV" (chapter numerals). Out of range → the plain number. */
export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return String(n);
  const table: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of table) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

/** Signature writing point at progress s (0–1) across a signature box: left→right with a handwriting wobble. */
export function quillPoint(s: number, box: { x: number; y: number; w: number; h: number }): { x: number; y: number } {
  const t = clamp01(s);
  return { x: box.x + box.w * t, y: box.y + box.h * (0.62 - 0.22 * Math.sin(t * Math.PI * 9)) };
}

/** Index of the section being read (for the "03 / 06" counter): the last one the roll is well into, or 0. */
export function currentSection(open: number, tops: number[], into = 90): number {
  let i = 0;
  tops.forEach((top, n) => {
    if (open > top + into) i = n;
  });
  return i;
}

/* ── golden mist drifting off the pointer ── */

/** One puff of mist: position/velocity in px and px/s, radius px, age and lifetime in s. */
export type Mote = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number };

export const MAX_MOTES = 90;

/**
 * Puffs released along the pointer's path from `a` to `b`: about one per 14px travelled (at most 4 per event,
 * double over buttons and links), each with a soft upward drift. `rand` is injectable for tests.
 */
export function spawnMotes(a: { x: number; y: number }, b: { x: number; y: number }, hot = false, rand: () => number = Math.random): Mote[] {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  if (!Number.isFinite(dist) || dist < 2) return [];
  const n = Math.min(4, Math.floor(dist / 14) + 1) * (hot ? 2 : 1);
  const out: Mote[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1);
    out.push({
      x: a.x + (b.x - a.x) * t + (rand() - 0.5) * 10,
      y: a.y + (b.y - a.y) * t + (rand() - 0.5) * 10,
      vx: (rand() - 0.5) * 24,
      vy: -12 - rand() * 22, // mist rises
      r: 16 + rand() * 30,
      age: 0,
      life: 1.4 + rand() * 1.3,
    });
  }
  return out;
}

/** Advance the mist by `dt` seconds: drift, gentle drag, growth; spent puffs are dropped and the oldest trimmed to MAX_MOTES. */
export function stepMotes(motes: Mote[], dt: number): Mote[] {
  const step = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0; // a stalled tab doesn't teleport the mist
  const drag = Math.pow(0.35, step);
  const next: Mote[] = [];
  for (const m of motes) {
    const age = m.age + step;
    if (age >= m.life) continue;
    next.push({ x: m.x + m.vx * step, y: m.y + m.vy * step, vx: m.vx * drag, vy: m.vy * drag - 4 * step, r: m.r + 14 * step, age, life: m.life });
  }
  return next.length > MAX_MOTES ? next.slice(next.length - MAX_MOTES) : next;
}

/** Opacity over a puff's life: fades in, then out (0 at birth and death). */
export function moteAlpha(m: Mote, peak = 0.32): number {
  const t = m.life > 0 ? clamp01(m.age / m.life) : 1;
  return peak * Math.sin(Math.PI * t);
}

/**
 * Rail fill (0–1) for evenly spaced chapter dots. `at` holds the scroll progress where each chapter is read;
 * the fill reaches dot i exactly at at[i] and moves linearly between neighbouring dots (so the gaps can be equal
 * even though chapters have different lengths). Before the first chapter it grows from 0; after the last it stays full.
 */
export function railFill(progress: number, at: number[]): number {
  const p = clamp01(progress);
  const pts = at.filter((v) => Number.isFinite(v));
  if (pts.length < 2) return p;
  const last = pts.length - 1;
  if (p <= pts[0]) return 0;
  if (p >= pts[last]) return 1;
  for (let i = 0; i < last; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (p <= b) return (i + (b > a ? (p - a) / (b - a) : 1)) / last;
  }
  return 1;
}
