/* "Story in stills": one image per chapter, revealed one after another as you scroll (separate from the video story).
   Manifest checks, scroll → which image / crossfade / slow zoom. Pure and import-free so it runs under `node --test`. */

export type StillImage = {
  /** large WebP (desktop / high-DPR), under /story-stills */
  lg: string;
  /** small WebP (phones, and the blurred backdrop) */
  sm: string;
  /** size of the large file, for the aspect ratio */
  w: number;
  h: number;
  /** description for screen readers */
  alt: string;
};

export type StillsManifest = { version: 1; images: StillImage[] };

export const STILLS_COUNT = 6;

/** Why the section is hidden (null = complete and well-formed: render it). */
export function stillsProblem(m: unknown): string | null {
  if (!m || typeof m !== "object") return "no images yet";
  const man = m as Partial<StillsManifest>;
  if (man.version !== 1) return "unknown manifest version";
  if (!Array.isArray(man.images) || man.images.length !== STILLS_COUNT) return `all ${STILLS_COUNT} images are required`;
  for (let i = 0; i < man.images.length; i++) {
    const img = man.images[i];
    const ok =
      !!img &&
      typeof img.lg === "string" &&
      img.lg.trim() !== "" &&
      typeof img.sm === "string" &&
      img.sm.trim() !== "" &&
      Number.isInteger(img.w) &&
      img.w > 0 &&
      Number.isInteger(img.h) &&
      img.h > 0 &&
      typeof img.alt === "string";
    if (!ok) return `image ${i + 1} is incomplete`;
  }
  return null;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const smooth = (t: number) => t * t * (3 - 2 * t);

export type StillsFrame = {
  /** the chapter being read (switches halfway through a crossfade) */
  index: number;
  /** progress inside the chapter, 0–1 */
  local: number;
  /** blended opacity of every image (at most two non-zero, summing to 1) — for the soft blurred backdrop */
  opacity: number[];
  /** "dip" opacity for the sharp foreground photos: the old one fades out fully before the new one fades in,
      so two faces never overlap as a double exposure */
  reveal: number[];
  /** slow zoom of every image, 1 → 1 + zoom over its chapter (continues while it fades out) */
  scale: number[];
};

/**
 * Scroll progress (0–1 over the pinned section) → what's on screen. Every image gets an equal share of the scroll;
 * the last `fade` part of each share crossfades into the next image. Pure: scrolling back gives the same result.
 */
export function stillsAt(progress: number, count: number, fade = 0.3, zoom = 0.08): StillsFrame {
  const n = Number.isInteger(count) && count > 0 ? count : 1;
  const f = Math.min(0.9, Math.max(0, Number.isFinite(fade) ? fade : 0));
  const p = clamp01(progress);
  const seg = Math.min(n - 1, Math.floor(p * n));
  const local = p >= 1 ? 1 : clamp01(p * n - seg);
  const opacity = new Array<number>(n).fill(0);
  const reveal = new Array<number>(n).fill(0);
  const scale = new Array<number>(n).fill(1);

  // crossfade into the next image during the last part of this one (never after the last image)
  const mix = seg < n - 1 && f > 0 ? smooth(clamp01((local - (1 - f)) / f)) : 0;
  opacity[seg] = 1 - mix;
  reveal[seg] = 1 - smooth(clamp01(mix * 2));
  scale[seg] = 1 + zoom * local;
  if (mix > 0) {
    opacity[seg + 1] = mix;
    reveal[seg + 1] = smooth(clamp01(mix * 2 - 1));
    scale[seg + 1] = 1;
  }
  const index = mix >= 0.5 ? seg + 1 : seg;
  return { index, local: index === seg ? local : 0, opacity, reveal, scale };
}

/** Scroll progress where an image's chapter starts (for "jump to chapter"). */
export function stillStart(i: number, count: number): number {
  return count > 0 ? clamp01(i / count) : 0;
}
