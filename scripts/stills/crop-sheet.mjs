// Cut the six chapter images out of the character reference sheet (option A — until real scene images exist).
//
//   npm run stills:crop                 # story-stills-src/character-sheet.png → story-stills-src/scene-01.png … scene-06.png
//   npm run stills:crop -- --force      # overwrite existing scene images (otherwise they are kept)
//   npm run stills:crop -- --sheet D:/art/sheet.png
//
// The boxes match the 1672×941 sheet layout (portrait | four turnaround poses | three expression panels).
// Small panels are enlarged with Lanczos so they hold up in the section; real scene renders will always look sharper.
import sharp from "sharp";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SRC = join(ROOT, "story-stills-src");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const SHEET = arg("sheet", join(SRC, "character-sheet.png"));
const FORCE = process.argv.includes("--force");
const BASE = { w: 1672, h: 941 };
const MIN_H = 900; // enlarge small panels to at least this height

// [left, top, width, height] on the 1672×941 sheet, scaled if the sheet is a different size
const CROPS = [
  { box: [1433, 0, 239, 312], alt: "Janmenjaya thinking, hand on chin, with a curious smile" },
  { box: [1433, 314, 239, 296], alt: "Janmenjaya concentrating on a laptop screen" },
  { box: [785, 45, 210, 875], alt: "Janmenjaya standing at a three-quarter angle in a dark hoodie, smiling" },
  { box: [515, 45, 275, 875], alt: "Janmenjaya standing facing forward, hands in pockets, smiling" },
  { box: [1433, 612, 239, 329], alt: "Janmenjaya smiling with a raised fist" },
  { box: [0, 0, 480, 941], alt: "Portrait of Janmenjaya Biswal smiling" },
];

if (!existsSync(SHEET)) {
  console.error(`✖ Character sheet not found: ${SHEET}`);
  process.exit(1);
}
const meta = await sharp(SHEET).metadata();
const sx = meta.width / BASE.w;
const sy = meta.height / BASE.h;
if (Math.abs(sx - sy) > 0.02) console.warn(`⚠ The sheet is ${meta.width}×${meta.height}, not 16:9 like the expected layout — check the crops.`);

mkdirSync(SRC, { recursive: true });
const alts = {};
for (const [i, { box, alt }] of CROPS.entries()) {
  const name = `scene-${String(i + 1).padStart(2, "0")}`;
  alts[name] = alt;
  const out = join(SRC, `${name}.png`);
  const existing = ["png", "jpg", "jpeg", "webp"].some((e) => existsSync(join(SRC, `${name}.${e}`)));
  if (existing && !FORCE) {
    console.log(`• ${name}: kept your existing image (use --force to replace it with the crop)`);
    continue;
  }
  const [l, t, w, h] = box;
  const region = {
    left: Math.round(l * sx),
    top: Math.round(t * sy),
    width: Math.min(Math.round(w * sx), meta.width - Math.round(l * sx)),
    height: Math.min(Math.round(h * sy), meta.height - Math.round(t * sy)),
  };
  let img = sharp(SHEET).extract(region);
  if (region.height < MIN_H) img = img.resize({ height: MIN_H, kernel: "lanczos3" });
  await img.png().toFile(out);
  console.log(`✔ ${name}.png (${region.width}×${region.height}${region.height < MIN_H ? ` → enlarged to ${MIN_H}px tall` : ""})`);
}
// only fills in descriptions that aren't already there, so your own wording is never overwritten
const altFile = join(SRC, "alt.json");
let current = {};
if (existsSync(altFile)) {
  try {
    current = JSON.parse((await import("node:fs")).readFileSync(altFile, "utf8"));
  } catch {
    current = {};
  }
}
writeFileSync(altFile, JSON.stringify({ ...alts, ...current }, null, 2) + "\n");
console.log("\nNext: npm run stills:build");
