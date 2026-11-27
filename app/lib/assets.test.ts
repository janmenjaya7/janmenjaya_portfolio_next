/* Site images ship as WebP only (smaller, alpha-capable). Uploads in /admin may still be JPG/PNG — those are inputs. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test("public/: no .jpg / .jpeg / .png images — WebP (or SVG) only", () => {
  const raster = walk(join(root, "public")).filter((p) => /\.(jpe?g|png)$/i.test(p));
  assert.deepEqual(raster, []);
});

test("every image path the code references exists in public/ (no broken images after the WebP switch)", () => {
  const sources = ["app/lib/journey.ts", "app/lib/portrait.ts"].map((f) => readFileSync(join(root, f), "utf8")).join("\n");
  const paths = [...sources.matchAll(/"(\/[\w/.-]+\.(?:webp|jpe?g|png|svg))"/g)].map((m) => m[1]);
  assert.ok(paths.length >= 5, `found ${paths.length} image paths`);
  for (const p of paths) {
    assert.match(p, /\.(webp|svg)$/, `${p} should be WebP`);
    assert.ok(statSync(join(root, "public", p)).isFile(), `${p} is missing`);
  }
});
