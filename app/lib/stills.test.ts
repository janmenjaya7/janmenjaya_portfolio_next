import { test } from "node:test";
import assert from "node:assert/strict";
import { STILLS_COUNT, stillStart, stillsAt, stillsProblem, type StillsManifest } from "./stills.ts";

const full = (): StillsManifest => ({
  version: 1,
  images: Array.from({ length: STILLS_COUNT }, (_, i) => ({ lg: `scene-0${i + 1}-lg.webp`, sm: `scene-0${i + 1}-sm.webp`, w: 900, h: 1200, alt: `Chapter ${i + 1}` })),
});

test("manifest: the section only appears with all six real images", () => {
  assert.equal(stillsProblem(full()), null);
  assert.equal(stillsProblem(null), "no images yet");
  assert.equal(stillsProblem(undefined), "no images yet");
  assert.equal(stillsProblem("x"), "no images yet");
  assert.equal(stillsProblem({ ...full(), version: 2 }), "unknown manifest version");
  assert.equal(stillsProblem({ ...full(), images: full().images.slice(0, 5) }), "all 6 images are required");
  assert.equal(stillsProblem({ ...full(), images: [] }), "all 6 images are required");
  const blank = full();
  blank.images[2].lg = "  ";
  assert.equal(stillsProblem(blank), "image 3 is incomplete");
  const badSize = full();
  badSize.images[5].h = 0;
  assert.equal(stillsProblem(badSize), "image 6 is incomplete");
  const noAlt = full() as unknown as { version: 1; images: Array<Record<string, unknown>> };
  delete noAlt.images[0].alt;
  assert.equal(stillsProblem(noAlt), "image 1 is incomplete");
  const holey = full() as unknown as { version: 1; images: unknown[] };
  holey.images[1] = null;
  assert.equal(stillsProblem(holey), "image 2 is incomplete");
});

test("scroll → image: equal share each, one image fully shown at the start of its chapter", () => {
  const n = 6;
  const at0 = stillsAt(0, n);
  assert.equal(at0.index, 0);
  assert.deepEqual(at0.opacity, [1, 0, 0, 0, 0, 0]);
  assert.equal(at0.scale[0], 1);
  // start of chapter 3
  const c3 = stillsAt(2 / 6 + 1e-9, n);
  assert.equal(c3.index, 2);
  assert.equal(c3.opacity[2], 1);
  assert.equal(c3.opacity.filter((o) => o > 0).length, 1);
  // the end: the last image, no crossfade into nothing
  const end = stillsAt(1, n);
  assert.equal(end.index, 5);
  assert.equal(end.opacity[5], 1);
  assert.equal(end.local, 1);
  // out of range / garbage input is clamped, never throws
  assert.equal(stillsAt(-3, n).index, 0);
  assert.equal(stillsAt(9, n).index, 5);
  assert.equal(stillsAt(Number.NaN, n).index, 0);
  assert.equal(stillsAt(0.5, 0).index, 0, "no images → a safe single slot");
});

test("crossfade: only in the last part of a chapter, two images at most, opacities sum to 1", () => {
  const n = 6;
  const seg = 1 / n;
  const before = stillsAt(seg * 0.6, n); // 60% into chapter 1, fade starts at 70%
  assert.deepEqual(before.opacity.slice(0, 2), [1, 0]);
  const mid = stillsAt(seg * 0.85, n); // halfway through the fade
  assert.ok(mid.opacity[0] > 0 && mid.opacity[1] > 0);
  assert.ok(Math.abs(mid.opacity[0] + mid.opacity[1] - 1) < 1e-9);
  assert.equal(mid.opacity.filter((o) => o > 0).length, 2);
  // the chapter text switches once the next image dominates
  assert.equal(stillsAt(seg * 0.8, n).index, 0);
  assert.equal(stillsAt(seg * 0.95, n).index, 1);
  // fade = 0 → hard cut
  assert.equal(stillsAt(seg * 0.99, n, 0).opacity[1], 0);
  // scrolling is reversible: the same progress gives the same frame
  assert.deepEqual(stillsAt(0.4321, n), stillsAt(0.4321, n));
});

test("foreground photos dip: never two faces at once, fully shown outside the fade", () => {
  const n = 6;
  for (let p = 0; p <= 1; p += 0.0025) {
    const f = stillsAt(p, n);
    assert.ok(f.reveal.filter((o) => o > 1e-6).length <= 1, `double exposure at progress ${p.toFixed(4)}`);
    f.reveal.forEach((o) => assert.ok(o >= 0 && o <= 1));
  }
  const seg = 1 / n;
  assert.equal(stillsAt(seg * 0.5, n).reveal[0], 1, "outside the fade the photo is fully visible");
  assert.ok(stillsAt(seg * 0.85, n).reveal[0] < 1e-9, "the old photo is gone at the middle of the fade");
  assert.ok(stillsAt(seg * 0.85, n).reveal[1] < 1e-9, "…and the new one hasn't started yet");
  assert.ok(stillsAt(seg * 0.95, n).reveal[1] > 0.5, "the new photo comes in during the second half");
  assert.equal(stillsAt(seg + 1e-9, n).reveal[1], 1, "and is fully shown when its chapter starts");
});

test("slow zoom grows through a chapter and resets for the next image", () => {
  const n = 6;
  const seg = 1 / n;
  const a = stillsAt(seg * 0.1, n).scale[0];
  const b = stillsAt(seg * 0.6, n).scale[0];
  assert.ok(b > a && a >= 1);
  assert.ok(stillsAt(seg * 0.99, n).scale[0] <= 1.08 + 1e-9, "never more than the zoom amount");
  assert.equal(stillsAt(seg * 0.85, n).scale[1], 1, "the incoming image starts unzoomed");
});

test("chapter starts for jump links", () => {
  assert.equal(stillStart(0, 6), 0);
  assert.equal(stillStart(3, 6), 0.5);
  assert.equal(stillStart(6, 6), 1);
  assert.equal(stillStart(2, 0), 0);
});
