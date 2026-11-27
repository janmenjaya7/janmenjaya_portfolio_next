/* The name logo (public/brand/janmenjaya-biswal.svg) must stay a clean, standalone asset — these are its brief's rules. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const svg = readFileSync(new URL("../../public/brand/janmenjaya-biswal.svg", import.meta.url), "utf8");
const attr = (tag: string, name: string) => [...tag.matchAll(new RegExp(`${name}="([^"]*)"`, "g"))].map((m) => m[1]);

test("logo: viewBox 0 0 1100 280, with an accessible title", () => {
  const root = svg.match(/<svg[^>]*>/)?.[0] ?? "";
  assert.deepEqual(attr(root, "viewBox"), ["0 0 1100 280"]);
  assert.match(root, /role="img"/);
  assert.match(svg, /<title[^>]*>Janmenjaya Biswal<\/title>/, "the same full name as the hero and résumé");
});

test("logo: transparent — no background rect, no drop-shadow / filter box", () => {
  for (const rect of svg.match(/<rect[^>]*>/g) ?? []) {
    const w = Number(attr(rect, "width")[0]);
    const h = Number(attr(rect, "height")[0]);
    assert.ok(!(w >= 1000 && h >= 250), `a canvas-sized rect looks like a background: ${rect.slice(0, 120)}`);
  }
  assert.doesNotMatch(svg, /<filter|drop-shadow|feDropShadow/);
});

test("logo: self-contained — letterforms are paths (no <text>, no web fonts, no external refs)", () => {
  assert.doesNotMatch(svg, /<text|@font-face|@import|font-family/);
  assert.doesNotMatch(svg, /(href|src)="(https?:)?\/\//, "no external resources");
  assert.equal((svg.match(/<path id="g\d+"/g) ?? []).length, 16, "one vector path per letter: Janmenjaya (10) + Biswal (6)");
});

test("logo: only flute, feather and typography — no lotus / vine / scrollwork layers", () => {
  assert.doesNotMatch(svg, /lotus|vine|filigree|scroll-?work|flourish/i);
  assert.match(svg, /class="flute"/);
  assert.match(svg, /class="feather"/);
  assert.match(svg, /class="lt"/);
});

test("logo: flute spans x 80→1020, y 55→82, with six finger holes + one embouchure hole", () => {
  assert.match(svg, /<rect x="80" y="55" width="940" height="27"/);
  const holes = svg.match(/<ellipse[^>]*fill="url\(#jb-hole\)"/g) ?? [];
  assert.equal(holes.length, 7);
});

test("logo: the brief's colours — gold #F6D365→#B8860B, enamel #0A2472→#1E56A0 on the capitals", () => {
  const gold = svg.match(/<linearGradient id="jb-gold"[\s\S]*?<\/linearGradient>/)?.[0] ?? "";
  assert.match(gold, /#f6d365/i);
  assert.match(gold, /#b8860b/i);
  const enamel = svg.match(/<linearGradient id="jb-enamel"[\s\S]*?<\/linearGradient>/)?.[0] ?? "";
  assert.match(enamel, /#1e56a0/i);
  assert.match(enamel, /#0a2472/i);
  assert.equal((svg.match(/class="cap"/g) ?? []).length, 2, "exactly two enamel capitals: J and B");
});

test("logo: letters hang from rings under the flute; motion stops for reduced-motion users", () => {
  assert.ok((svg.match(/class="rg"/g) ?? []).length >= 8, "rings under the flute");
  assert.match(svg, /@media \(prefers-reduced-motion:reduce\)\{[^}]*animation:none/);
  assert.ok(Buffer.byteLength(svg) < 60 * 1024, "stays light (< 60 KB)");
});
