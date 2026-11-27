import { test } from "node:test";
import assert from "node:assert/strict";
import { easeInOut, fibonacciSphere, fitBottom, morphAmount, sampleDots } from "./dots.ts";

// 4×2 image: left half opaque white/black, right half transparent
const img = (() => {
  const w = 4, h = 2, d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const v = x === 0 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = x < 2 ? 255 : 0;
  }
  return { d, w, h };
})();

test("sampleDots: keeps only opaque cells, with brightness as tone", () => {
  const dots = sampleDots(img.d, img.w, img.h, 1);
  assert.equal(dots.length, 4, "2 opaque columns × 2 rows");
  assert.ok(dots.every((p) => p.x < 2), "transparent half is skipped");
  assert.equal(dots.find((p) => p.x === 0)?.tone, 1);
  assert.equal(dots.find((p) => p.x === 1)?.tone, 0);
});

test("sampleDots: the step thins the grid", () => {
  assert.equal(sampleDots(img.d, img.w, img.h, 2).length, 1);
});

test("sampleDots: malformed input never throws and returns nothing", () => {
  assert.deepEqual(sampleDots(img.d, 0, 2, 1), []);
  assert.deepEqual(sampleDots(img.d, 4, -1, 1), []);
  assert.deepEqual(sampleDots(new Uint8ClampedArray(3), 4, 2, 1), [], "too little data");
  assert.deepEqual(sampleDots(null as unknown as number[], 4, 2, 1), []);
  assert.ok(sampleDots(img.d, img.w, img.h, 0).length > 0, "step < 1 is treated as 1");
});

test("fibonacciSphere: n points on the unit sphere, none for bad counts", () => {
  const pts = fibonacciSphere(500);
  assert.equal(pts.length, 500);
  for (const [x, y, z] of pts) assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-9);
  assert.deepEqual(fibonacciSphere(-3), []);
  assert.deepEqual(fibonacciSphere(1), [[1, 0, 0]]);
});

test("easeInOut: clamped, symmetric, handles junk", () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.equal(easeInOut(0.5), 0.5);
  assert.equal(easeInOut(-2), 0);
  assert.equal(easeInOut(9), 1);
  assert.equal(easeInOut(Number.NaN), 0);
});

test("morphAmount: starts on the sphere, lands in the portrait, scatters on scroll", () => {
  assert.equal(morphAmount(0, 2000, 0, 0), 0, "nothing formed at t=0");
  assert.equal(morphAmount(5000, 2000, 0.9, 0), 1, "every dot (even the latest) has landed after the intro");
  assert.ok(morphAmount(900, 2000, 0, 0) > morphAmount(900, 2000, 0.8, 0), "early dots lead late ones");
  assert.ok(Math.abs(morphAmount(5000, 2000, 0, 1) - 0.15) < 1e-9, "scrolled away: mostly scattered, never fully gone");
  assert.equal(morphAmount(5000, 0, 0, 0), 1, "zero-length intro is safe");
});

test("fitBottom: contain + bottom-centre, safe for empty boxes", () => {
  assert.deepEqual(fitBottom(100, 200, 400, 400), { scale: 2, ox: 100, oy: 0 });
  assert.deepEqual(fitBottom(200, 100, 400, 400), { scale: 2, ox: 0, oy: 200 });
  assert.deepEqual(fitBottom(0, 100, 400, 400), { scale: 0, ox: 0, oy: 0 });
});
