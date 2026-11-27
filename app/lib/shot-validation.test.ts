import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_SHOT_BYTES, detectImageType, isShotMeta, isShotSlug, shotSlug, shotUrl, validateShot } from "./shot-validation.ts";

const bytes = (...b: number[]) => Uint8Array.from([...b, ...new Array(Math.max(0, 12 - b.length)).fill(0)]);
const ascii = (s: string) => Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const WEBP = ascii("RIFF\x00\x00\x00\x00WEBP");

test("detectImageType: reads the real format from the bytes", () => {
  assert.equal(detectImageType(JPEG), "image/jpeg");
  assert.equal(detectImageType(PNG), "image/png");
  assert.equal(detectImageType(WEBP), "image/webp");
});

test("detectImageType: rejects renamed or unsafe files and short/missing input", () => {
  assert.equal(detectImageType(ascii("%PDF-1.7 xxxxx")), null, "PDF renamed to .jpg");
  assert.equal(detectImageType(ascii("<svg xmlns=..")), null, "SVG (can carry script)");
  assert.equal(detectImageType(ascii("GIF89a......")), null, "GIF not accepted");
  assert.equal(detectImageType(ascii("RIFF....WAVE")), null, "RIFF but not WebP");
  assert.equal(detectImageType(Uint8Array.from([0xff, 0xd8, 0xff])), null, "too short to judge");
  assert.equal(detectImageType(null), null);
  assert.equal(detectImageType(undefined), null);
});

test("validateShot: accepts a real image up to exactly the limit", () => {
  assert.deepEqual(validateShot({ name: "crm.jpg", size: 120_000, head: JPEG }), { ok: true, type: "image/jpeg" });
  assert.deepEqual(validateShot({ name: "crm.webp", size: MAX_SHOT_BYTES, head: WEBP }), { ok: true, type: "image/webp" });
});

test("validateShot: friendly errors for empty, oversized and wrong files", () => {
  const err = (r: ReturnType<typeof validateShot>) => (r.ok ? "" : r.error);
  assert.match(err(validateShot({ name: "", size: 10, head: JPEG })), /choose an image/);
  assert.match(err(validateShot({ name: "a.jpg", size: 0, head: JPEG })), /empty/);
  assert.match(err(validateShot({ name: "a.jpg", size: Number.NaN, head: JPEG })), /empty/);
  assert.match(err(validateShot({ name: "a.jpg", size: MAX_SHOT_BYTES + 1, head: JPEG })), /under 600 KB/);
  assert.match(err(validateShot({ name: "a.jpg", size: 2_500_000, head: JPEG })), /2\.4 MB/);
  assert.match(err(validateShot({ name: "fake.jpg", size: 500, head: ascii("%PDF-1.7 xxxxx") })), /JPG, PNG or WebP/);
  assert.match(err(validateShot({ name: "a.png", size: 500, head: null })), /JPG, PNG or WebP/);
  assert.match(err(validateShot({ name: 42, size: 500, head: JPEG })), /choose an image/);
});

test("shotSlug: stable, URL-safe keys from project titles", () => {
  assert.equal(shotSlug("IFAS Admin CRM Dashboard"), "ifas-admin-crm-dashboard");
  assert.equal(shotSlug("  Café — Next.js & React!  "), "cafe-next-js-react");
  assert.equal(shotSlug("ELA Learn"), "ela-learn");
  assert.equal(shotSlug("!!!"), null, "nothing usable");
  assert.equal(shotSlug(""), null);
  assert.equal(shotSlug(undefined), null);
  assert.equal(shotSlug(123), null);
  const long = shotSlug("a ".repeat(80));
  assert.ok(long && long.length <= 60 && !long.endsWith("-"), "trimmed to 60 chars without a trailing dash");
});

test("isShotSlug: only what shotSlug can produce (blocks path tricks)", () => {
  assert.equal(isShotSlug("ifas-admin-panel"), true);
  assert.equal(isShotSlug(shotSlug("a ".repeat(80))), true);
  for (const bad of ["", "-x", "x-", "../etc", "a/b", "UPPER", "a b", "x".repeat(61), null, 5]) assert.equal(isShotSlug(bad), false, String(bad));
});

test("isShotMeta + shotUrl", () => {
  const meta = { type: "image/png" as const, size: 2048, updatedAt: 1_700_000_000_000 };
  assert.equal(isShotMeta(meta), true);
  assert.equal(isShotMeta({ ...meta, type: "image/svg+xml" }), false);
  assert.equal(isShotMeta({ ...meta, size: 0 }), false);
  assert.equal(isShotMeta({ type: "image/png", size: 1 }), false);
  assert.equal(isShotMeta(null), false);
  assert.equal(shotUrl("ifas-crm", meta), "/api/project-shot/ifas-crm?v=1700000000000");
});
