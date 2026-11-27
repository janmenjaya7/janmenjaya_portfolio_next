/* Pure helpers for the /newone dot-matrix effects (hero dot portrait, dot illustrations).
   No imports, no DOM: unit-tested with `node --test`. */

export type Dot = {
  /** target position in source-image pixels */
  x: number;
  y: number;
  /** 0–1 brightness of the sampled area (drives dot size) */
  tone: number;
};

/**
 * Halftone sampling: walk the image on a grid of `step` px and keep one dot per cell that is
 * opaque enough, with its brightness. `rgba` is ImageData-style data (4 bytes per pixel).
 * Malformed input (wrong length, bad sizes) returns an empty list instead of throwing.
 */
export function sampleDots(rgba: ArrayLike<number>, width: number, height: number, step: number, minAlpha = 96): Dot[] {
  const w = Math.floor(width);
  const h = Math.floor(height);
  const s = Math.max(1, Math.floor(step));
  if (!(w > 0 && h > 0) || !rgba || rgba.length < w * h * 4) return [];
  const out: Dot[] = [];
  for (let y = Math.floor(s / 2); y < h; y += s) {
    for (let x = Math.floor(s / 2); x < w; x += s) {
      const i = (y * w + x) * 4;
      const a = rgba[i + 3];
      if (a < minAlpha) continue;
      const lum = (0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]) / 255;
      out.push({ x, y, tone: Math.min(1, Math.max(0, lum)) });
    }
  }
  return out;
}

/** Evenly spread points on a unit sphere (Fibonacci lattice): the "cloud" the portrait forms from. */
export function fibonacciSphere(count: number): Array<[number, number, number]> {
  const n = Math.max(0, Math.floor(count));
  const pts: Array<[number, number, number]> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = golden * i;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return pts;
}

/** Ease-in-out cubic, clamped to 0–1. */
export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Morph amount for one dot: 0 = on the sphere, 1 = in the portrait.
 * Dots arrive staggered by `delay` (0–1 share of the intro), then scrolling away (`scroll` 0–1)
 * scatters them back out.
 */
export function morphAmount(elapsedMs: number, introMs: number, delay: number, scroll: number): number {
  const span = Math.max(1, introMs);
  const d = Math.min(0.9, Math.max(0, delay));
  const local = (elapsedMs / span - d * 0.45) / 0.55;
  const intro = easeInOut(local);
  const away = 1 - Math.min(1, Math.max(0, scroll)) * 0.85;
  return intro * away;
}

/** Fit a source box into a target box ("contain"), anchored to the bottom centre. */
export function fitBottom(srcW: number, srcH: number, boxW: number, boxH: number): { scale: number; ox: number; oy: number } {
  if (!(srcW > 0 && srcH > 0 && boxW > 0 && boxH > 0)) return { scale: 0, ox: 0, oy: 0 };
  const scale = Math.min(boxW / srcW, boxH / srcH);
  return { scale, ox: (boxW - srcW * scale) / 2, oy: boxH - srcH * scale };
}
