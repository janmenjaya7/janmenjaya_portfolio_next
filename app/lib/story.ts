/* Cinematic journey story ("after the hero"): manifest, scroll → frame mapping, canvas cover-fit, frame cache window,
   WebVTT subtitles and narration scheduling. Pure and import-free so it runs under `node --test`. */

export type SceneId = "dream" | "beginning" | "learning" | "projects" | "experience" | "future";

/** One scene's real, processed assets (written by scripts/journey/build-journey.mjs — never hand-made). */
export type SceneAssets = {
  id: SceneId;
  /** number of frames in the scene's image sequence */
  frames: number;
  /** narration file under /journey/audio, or null if not recorded yet */
  narration: string | null;
  /** WebVTT file under /journey/subtitles, or null */
  subtitles: string | null;
};

export type StoryManifest = {
  version: 1;
  /** frame sizes produced for each tier */
  sizes: { desktop: { w: number; h: number }; mobile: { w: number; h: number } };
  scenes: SceneAssets[];
  music: string | null;
  poster: string | null;
  /** true when built by `npm run journey:preview` (labelled test frames) — never shown in a production build */
  preview?: boolean;
};

export const SCENE_ORDER: SceneId[] = ["dream", "beginning", "learning", "projects", "experience", "future"];

/**
 * The story only appears when every scene has real frames (no placeholders). Returns the reason it is hidden,
 * or null when the manifest is complete and well-formed.
 */
export function manifestProblem(m: unknown): string | null {
  if (!m || typeof m !== "object") return "no assets yet";
  const man = m as Partial<StoryManifest>;
  if (man.version !== 1) return "unknown manifest version";
  const sz = man.sizes;
  const okSize = (s: unknown) => !!s && typeof s === "object" && Number.isInteger((s as { w: number }).w) && (s as { w: number }).w > 0 && Number.isInteger((s as { h: number }).h) && (s as { h: number }).h > 0;
  if (!sz || !okSize(sz.desktop) || !okSize(sz.mobile)) return "frame sizes missing";
  if (!Array.isArray(man.scenes) || man.scenes.length !== SCENE_ORDER.length) return "all six scenes are required";
  for (let i = 0; i < SCENE_ORDER.length; i++) {
    const s = man.scenes[i];
    if (!s || s.id !== SCENE_ORDER[i]) return `scene ${i + 1} should be "${SCENE_ORDER[i]}"`;
    if (!Number.isInteger(s.frames) || s.frames < 2) return `scene "${s.id}" needs at least 2 frames`;
  }
  return null;
}

/**
 * Whether the story section renders: only with a complete manifest, and a preview build (test frames) only in
 * development — so a forgotten `journey:preview` can never reach the live site.
 */
export function storyVisible(m: unknown, nodeEnv: string | undefined): boolean {
  if (manifestProblem(m) !== null) return false;
  return !(m as StoryManifest).preview || nodeEnv !== "production";
}

export const pad3 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(3, "0");

/** URL of a frame (1-based on disk: frame-001.webp). */
export function frameUrl(scene: SceneId, index0: number, tier: "desktop" | "mobile"): string {
  return `/journey/images/${scene}/${tier}/frame-${pad3(index0 + 1)}.webp`;
}

export type StoryPosition = {
  /** scene index 0–5 */
  scene: number;
  /** frame index within the scene (0-based) */
  frame: number;
  /** global frame index across all scenes */
  global: number;
  /** progress inside the scene, 0–1 */
  local: number;
};

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * Scroll progress (0–1 over the whole pinned story) → scene + frame. Every scene gets an equal share of the scroll,
 * so short and long sequences feel equally paced. Pure: scrolling back returns exactly the same frames.
 */
export function positionAt(progress: number, frameCounts: number[]): StoryPosition {
  const counts = frameCounts.map((c) => (Number.isFinite(c) && c > 0 ? Math.floor(c) : 1));
  const n = counts.length || 1;
  const p = clamp01(progress);
  const scene = Math.min(n - 1, Math.floor(p * n));
  const local = p >= 1 ? 1 : clamp01(p * n - scene);
  const count = counts[scene] ?? 1;
  const frame = Math.min(count - 1, Math.round(local * (count - 1)));
  const global = counts.slice(0, scene).reduce((a, b) => a + b, 0) + frame;
  return { scene, frame, global, local };
}

/** Scroll progress at which a scene starts (for the progress dots and "jump to scene"). */
export function sceneStart(scene: number, sceneCount: number): number {
  return sceneCount > 0 ? clamp01(scene / sceneCount) : 0;
}

/**
 * Canvas "object-fit: cover" with a focal point: the rectangle to draw the image into so it fills the canvas
 * without distortion, cropping around (fx, fy) (0–1, default centre) — e.g. keep the character's face in view.
 */
export function coverRect(imgW: number, imgH: number, boxW: number, boxH: number, fx = 0.5, fy = 0.5): { x: number; y: number; w: number; h: number } {
  if (!(imgW > 0 && imgH > 0 && boxW > 0 && boxH > 0)) return { x: 0, y: 0, w: Math.max(0, boxW), h: Math.max(0, boxH) };
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  // place the focal point at the box's centre, then clamp so no empty edge shows
  const x = Math.min(0, Math.max(boxW - w, boxW / 2 - clamp01(fx) * w));
  const y = Math.min(0, Math.max(boxH - h, boxH / 2 - clamp01(fy) * h));
  return { x, y, w, h };
}

/** Device-pixel ratio capped for memory/perf (crisp on retina without 3× canvases on phones). */
export function canvasDpr(dpr: number, mobile: boolean): number {
  const d = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  return Math.min(d, mobile ? 1.5 : 2);
}

/**
 * Which scenes' frames to keep decoded: the current one and its neighbours (decoded full-HD frames are ~6 MB each,
 * so keeping all of them would use hundreds of MB). Everything else is released.
 */
export function cacheScenes(current: number, sceneCount: number, radius = 1): number[] {
  const out: number[] = [];
  for (let s = current - radius; s <= current + radius; s++) if (s >= 0 && s < sceneCount) out.push(s);
  return out;
}

/** Load order for a scene: the frame needed now first, then outward in the scroll direction, then the rest. */
export function loadOrder(count: number, from: number, direction: 1 | -1 = 1): number[] {
  if (!(count > 0)) return [];
  const start = Math.min(count - 1, Math.max(0, Math.floor(from)));
  const out = [start];
  for (let d = 1; out.length < count; d++) {
    const ahead = start + d * direction;
    const behind = start - d * direction;
    if (ahead >= 0 && ahead < count) out.push(ahead);
    if (behind >= 0 && behind < count) out.push(behind);
  }
  return out;
}

/** The closest frame that is already decoded (shown while the exact one loads), or -1. */
export function nearestLoaded(want: number, isLoaded: (i: number) => boolean, count: number): number {
  for (let d = 0; d < count; d++) {
    if (want - d >= 0 && isLoaded(want - d)) return want - d;
    if (want + d < count && isLoaded(want + d)) return want + d;
  }
  return -1;
}

/* ── WebVTT ── */

export type Cue = { start: number; end: number; text: string };

const toSeconds = (t: string): number => {
  const m = t.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/);
  if (!m) return Number.NaN;
  return (Number(m[1] ?? 0) * 3600) + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, "0")) / 1000;
};

/** Parse WebVTT (or SRT-style) cues. Malformed blocks are skipped; tags like <b> are stripped. */
export function parseVtt(text: unknown): Cue[] {
  if (typeof text !== "string") return [];
  const cues: Cue[] = [];
  for (const block of text.replace(/\r/g, "").split(/\n{2,}/)) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    const i = lines.findIndex((l) => l.includes("-->"));
    if (i < 0) continue;
    const [a, b] = lines[i].split("-->");
    const start = toSeconds(a);
    const end = toSeconds((b ?? "").trim().split(/\s+/)[0] ?? "");
    const body = lines
      .slice(i + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && body) cues.push({ start, end, text: body });
  }
  return cues.sort((x, y) => x.start - y.start);
}

/** The cue showing at playback time `t` (seconds), or null. */
export function cueAt(cues: Cue[], t: number): Cue | null {
  if (!Number.isFinite(t)) return null;
  for (const c of cues) if (t >= c.start && t < c.end) return c;
  return null;
}

/* ── narration scheduling ── */

export type NarrationAction = { type: "none" } | { type: "start"; scene: number } | { type: "stop" };

/**
 * What the narrator should do when the active scene changes:
 * - nothing while sound is off or the story is off screen
 * - never restart a scene that has already been narrated (scrolling back and forth doesn't repeat it)
 * - a new scene starts its narration; any current narration is faded out first (never two voices at once)
 */
export function narrationFor(next: { scene: number; soundOn: boolean; inView: boolean; narrated: ReadonlySet<number>; playing: number | null; hasAudio: (s: number) => boolean }): NarrationAction {
  if (!next.soundOn || !next.inView) return next.playing === null ? { type: "none" } : { type: "stop" };
  if (next.playing === next.scene) return { type: "none" };
  if (next.narrated.has(next.scene) || !next.hasAudio(next.scene)) return next.playing === null ? { type: "none" } : { type: "stop" };
  return { type: "start", scene: next.scene };
}
