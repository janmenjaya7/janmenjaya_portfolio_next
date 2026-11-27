// Generates the standalone bansuri name logo: public/brand/janmenjaya-biswal.svg
//
// The letters are converted from a font into vector paths, so the SVG needs no web font and renders the same
// everywhere. Default font: Amita Bold (SIL Open Font License, scripts/brand/fonts/OFL.txt).
//
//   npm run brand:logo                                   # rebuild with the defaults
//   npm run brand:logo -- --font path/to/Samarkan.ttf    # any .ttf/.otf you are licensed to use on the web
//   npm run brand:logo -- --first Janmenjaya --last Biswal --out public/brand/other.svg
//
// Ring positions, the feather and the glints are placed from the font's real glyph boxes, so another font just works.
import opentype from "opentype.js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const OUT = arg("out", here("../../public/brand/janmenjaya-biswal.svg"));
const FONT = arg("font", here("./fonts/Amita-Bold.ttf"));
const FIRST = arg("first", "Janmenjaya");
const LAST = arg("last", "Biswal");
const font = opentype.loadSync(FONT);

/* ── layout (viewBox 0 0 1100 280) ── */
const FLUTE = { x1: 80, x2: 1020, y1: 55, y2: 82 };
const BASE = 186; // shared baseline
const RING_Y = 89; // ring centres just under the flute
const WORDS = [
  { text: FIRST, size: 150 },
  { text: LAST, size: 112 },
].filter((w) => w.text);
const GAP = 38;

const n = (v) => +v.toFixed(1);
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// measure + place glyphs
function layoutWord(text, size) {
  const glyphs = font.stringToGlyphs(text);
  const scale = size / font.unitsPerEm;
  const items = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    items.push({ g, ch: text[i], x, size });
    x += g.advanceWidth * scale;
    if (glyphs[i + 1]) x += font.getKerningValue(g, glyphs[i + 1]) * scale;
  });
  return { items, width: x };
}
// a wider font is scaled down so the name always hangs within the flute (20 units clear at each end)
const measure = (k) => {
  const ws = WORDS.map((w) => layoutWord(w.text, w.size * k));
  return { ws, total: ws.reduce((s, w) => s + w.width, 0) + GAP * k * (ws.length - 1) };
};
const room = FLUTE.x2 - FLUTE.x1 - 40;
let fit = measure(1);
if (fit.total > room) fit = measure(room / fit.total);
const words = fit.ws;
const total = fit.total;
let cursor = (FLUTE.x1 + FLUTE.x2) / 2 - total / 2;
const letters = [];
words.forEach((w, wi) => {
  for (const it of w.items) {
    const path = it.g.getPath(cursor + it.x, BASE, it.size);
    const bb = path.getBoundingBox();
    letters.push({ ch: it.ch, d: path.toPathData(1), bb, cap: /[A-Z]/.test(it.ch), word: wi });
  }
  cursor += w.width + GAP * (total > room ? room / total : 1);
});
const textLeft = Math.min(...letters.map((l) => l.bb.x1));
const textRight = Math.max(...letters.map((l) => l.bb.x2));
const textBottom = Math.max(...letters.map((l) => l.bb.y2));
// the feather rests above the first word's "e" (or its middle letter if it has none)
const firstWord = letters.filter((l) => l.word === 0);
const eLetter = firstWord.find((l) => l.ch === "e") ?? firstWord[Math.floor(firstWord.length / 2)];
const eCx = (eLetter.bb.x1 + eLetter.bb.x2) / 2;
console.error(JSON.stringify({ total: n(total), textLeft: n(textLeft), textRight: n(textRight), textBottom: n(textBottom), eCx: n(eCx), tops: letters.map((l) => [l.ch, n(l.bb.y1)]) }));

/* ── flute parts ── */
const FL_W = FLUTE.x2 - FLUTE.x1;
const FL_H = FLUTE.y2 - FLUTE.y1;
const FL_CY = (FLUTE.y1 + FLUTE.y2) / 2;
const holes = [222, 266, 310, 354, 398, 442].map((x) => ({ x, rx: 5.6, ry: 4.4 }));
const embouchure = { x: 888, rx: 7, ry: 4.8 };
const bands = [118, 176, 498, 590, 836, 950, 990];
const grain = [];
for (let i = 0; i < 26; i++) {
  const y = FLUTE.y1 + 3 + rand() * (FL_H - 6);
  const x0 = FLUTE.x1 + rand() * FL_W * 0.85;
  const len = 60 + rand() * 260;
  const x1 = Math.min(FLUTE.x2 - 4, x0 + len);
  const w = (rand() - 0.5) * 1.6;
  grain.push(`M${n(x0)} ${n(y)}Q${n((x0 + x1) / 2)} ${n(y + w)} ${n(x1)} ${n(y + w * 0.4)}`);
}
const nodes = [150, 530, 870]; // natural bamboo nodes

/* ── peacock feather (drawn upright, base at 0,0) ── */
const FEATHER_X = n(eCx - 8);
const FEATHER_Y = 114; // quill tucked behind the flute; the eye sits on top of it, fully inside the viewBox
const barbs = [];
const barbColors = ["#1f8f5f", "#8fae3c", "#b98a3a", "#1aa39a", "#5fa046"];
for (let y = 10, i = 0; y <= 58; y += 2.6, i++) {
  const t = (y - 10) / 48;
  const len = 5 + t * 15;
  for (const dir of [-1, 1]) {
    const bend = 4 + t * 4;
    barbs.push({ d: `M0 ${n(-y)}Q${n(dir * len * 0.55)} ${n(-y - 2)} ${n(dir * len)} ${n(-y - bend)}`, c: barbColors[(i + (dir > 0 ? 2 : 0)) % barbColors.length] });
  }
}
const wisps = [];
for (let i = 0; i < 15; i++) {
  const a = ((-80 + i * (160 / 14)) * Math.PI) / 180;
  const r1 = 20;
  const r2 = 31 + (i % 3) * 3;
  const cx = 0, cy = -78;
  wisps.push(`M${n(cx + Math.sin(a) * r1 * 0.8)} ${n(cy - Math.cos(a) * r1)}Q${n(cx + Math.sin(a) * (r1 + 5))} ${n(cy - Math.cos(a) * (r2 - 3) - 2)} ${n(cx + Math.sin(a) * r2 * 0.9)} ${n(cy - Math.cos(a) * r2)}`);
}

/* ── sparkles (Ramayana-style twinkles) ── */
const sparkles = [
  { x: n(textLeft + 30), y: 104, s: 1, d: 3.2 },
  { x: n(eCx + 46), y: 22, s: 0.8, d: 4.4 },
  { x: n(textRight - 40), y: 104, s: 0.9, d: 5.1 },
  { x: n((textLeft + textRight) / 2 + 120), y: 118, s: 0.7, d: 3.8 },
  { x: FLUTE.x1 + 30, y: 40, s: 0.75, d: 5.8 },
];
const star = (s) => `M0 ${-9 * s}C${1.2 * s} ${-2 * s} ${2 * s} ${-1.2 * s} ${9 * s} 0C${2 * s} ${1.2 * s} ${1.2 * s} ${2 * s} 0 ${9 * s}C${-1.2 * s} ${2 * s} ${-2 * s} ${1.2 * s} ${-9 * s} 0C${-2 * s} ${-1.2 * s} ${-1.2 * s} ${-2 * s} 0 ${-9 * s}Z`;

/* ── letters with rings ── */
let delay = 1.05;
const letterSvg = letters
  .map((l, i) => {
    const cx = n((l.bb.x1 + l.bb.x2) / 2);
    const top = l.bb.y1;
    const hang = top > RING_Y + 4; // hangs below the flute (J rises over it instead)
    const ring = hang
      ? `<circle class="rg" cx="${cx}" cy="${RING_Y}" r="5"/>` + (top > RING_Y + 7 ? `<path class="lk" d="M${cx} ${RING_Y + 5}V${n(top + 4)}"/>` : "")
      : "";
    const body = l.cap
      ? `<use href="#g${i}" class="cap-rim"/><use href="#g${i}" class="cap"/>`
      : `<use href="#g${i}" class="lc"/>`;
    const bevel = `<g clip-path="url(#k${i})"><use href="#g${i}" class="hi" transform="translate(0 2.2)"/><use href="#g${i}" class="lo" transform="translate(0 -2)"/></g>`;
    const d1 = delay.toFixed(2);
    const sway = (3.2 + (i % 4) * 0.45).toFixed(2);
    const swayDelay = (delay + 1.4).toFixed(2);
    delay += 0.09;
    return `    <g class="lt" style="transform-origin:${cx}px ${RING_Y}px;animation-delay:${d1}s,${swayDelay}s;animation-duration:1.4s,${sway}s">${ring}${body}${bevel}</g>`;
  })
  .join("\n");

const glyphDefs = letters.map((l, i) => `    <path id="g${i}" d="${l.d}"/>`).join("\n");
const clipDefs = letters.map((_, i) => `    <clipPath id="k${i}"><use href="#g${i}"/></clipPath>`).join("\n");
const allGlyphUses = letters.map((_, i) => `<use href="#g${i}"/>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 280" role="img" aria-labelledby="jb-logo-title">
  <title id="jb-logo-title">${[FIRST, LAST].filter(Boolean).join(" ")}</title>
  <!-- Bansuri name logo, generated by scripts/brand/build-logo.mjs. Transparent background; letterforms converted to vector paths. -->
  <style>
    .rg{fill:none;stroke:url(#jb-ring);stroke-width:2.4}
    .lk{fill:none;stroke:url(#jb-ring);stroke-width:2.2;stroke-linecap:round}
    .lc{fill:url(#jb-gold);stroke:#5e4106;stroke-width:1.1;paint-order:stroke}
    .cap-rim{fill:none;stroke:#3d2a03;stroke-width:10;stroke-linejoin:round}
    .cap{fill:url(#jb-enamel);stroke:url(#jb-rim);stroke-width:6.5;stroke-linejoin:round;paint-order:stroke}
    .hi{fill:none;stroke:#fff6d2;stroke-width:2.2;opacity:.75}
    .lo{fill:none;stroke:#4a3204;stroke-width:2;opacity:.45}
    .grain{fill:none;stroke:#6b3b12;stroke-width:.7;stroke-linecap:round;opacity:.32}

    /* animation: the flute appears, the mor pankh settles, each letter drops onto its ring and swings,
       then keeps a gentle chime-like sway; golden glints run through the name (Ramayana-title style) */
    .flute{transform-box:fill-box;transform-origin:50% 50%;animation:jb-draw 1s cubic-bezier(.22,1,.36,1) .1s both}
    .feather{transform-box:fill-box;transform-origin:50% 100%;animation:jb-feather-in 1.1s cubic-bezier(.22,1,.36,1) .7s both,jb-feather-sway 5s ease-in-out 1.8s infinite}
    .lt{transform-box:view-box;animation-name:jb-hang,jb-sway;animation-timing-function:cubic-bezier(.3,.6,.3,1),ease-in-out;animation-fill-mode:both,none;animation-iteration-count:1,infinite}
    .shine{animation:jb-shine 6.5s ease-in-out 3.2s infinite}
    .spark{transform-box:fill-box;transform-origin:50% 50%;opacity:0;animation:jb-twinkle 3.6s ease-in-out infinite}
    @keyframes jb-draw{from{transform:scaleX(0);opacity:0}30%{opacity:1}}
    @keyframes jb-feather-in{from{opacity:0;transform:translateY(-18px) rotate(-14deg)}}
    @keyframes jb-feather-sway{0%,100%{transform:rotate(0)}30%{transform:rotate(2.6deg)}70%{transform:rotate(-2deg)}}
    @keyframes jb-hang{0%{opacity:0;transform:translateY(-38px) rotate(-9deg)}40%{opacity:1;transform:translateY(5px) rotate(5deg)}62%{transform:translateY(-1.5px) rotate(-2.6deg)}82%{transform:rotate(1.1deg)}100%{opacity:1;transform:none}}
    @keyframes jb-sway{0%,100%{transform:rotate(0)}25%{transform:rotate(.9deg)}75%{transform:rotate(-.9deg)}}
    @keyframes jb-shine{0%{transform:translateX(-260px)}45%,100%{transform:translateX(1180px)}}
    @keyframes jb-twinkle{0%,62%,100%{opacity:0;transform:scale(.2) rotate(0)}75%{opacity:1;transform:scale(1) rotate(45deg)}88%{opacity:0;transform:scale(.3) rotate(90deg)}}
    @media (prefers-reduced-motion:reduce){.flute,.feather,.lt,.shine,.spark{animation:none}.shine,.spark{display:none}}
  </style>
  <defs>
    <linearGradient id="jb-bamboo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a3510"/>
      <stop offset=".14" stop-color="#b8792e"/>
      <stop offset=".34" stop-color="#f3cf86"/>
      <stop offset=".5" stop-color="#dba552"/>
      <stop offset=".78" stop-color="#9b6223"/>
      <stop offset="1" stop-color="#4a2a0b"/>
    </linearGradient>
    <linearGradient id="jb-bamboo-tone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3b1f06" stop-opacity=".45"/>
      <stop offset=".08" stop-color="#3b1f06" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff2c8" stop-opacity=".08"/>
      <stop offset=".92" stop-color="#3b1f06" stop-opacity="0"/>
      <stop offset="1" stop-color="#3b1f06" stop-opacity=".45"/>
    </linearGradient>
    <linearGradient id="jb-band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5c2e0e"/>
      <stop offset=".22" stop-color="#c97a3a"/>
      <stop offset=".38" stop-color="#ffd9a0"/>
      <stop offset=".55" stop-color="#d4924a"/>
      <stop offset=".8" stop-color="#8a4a1c"/>
      <stop offset="1" stop-color="#4a2408"/>
    </linearGradient>
    <linearGradient id="jb-band-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a3d05"/>
      <stop offset=".3" stop-color="#e9be5a"/>
      <stop offset=".45" stop-color="#fff0b8"/>
      <stop offset=".65" stop-color="#c99a3c"/>
      <stop offset="1" stop-color="#4a3204"/>
    </linearGradient>
    <radialGradient id="jb-hole" cx=".5" cy=".42" r=".6">
      <stop offset="0" stop-color="#0d0601"/>
      <stop offset=".7" stop-color="#1f1004"/>
      <stop offset="1" stop-color="#5a3510"/>
    </radialGradient>
    <linearGradient id="jb-gold" gradientUnits="userSpaceOnUse" x1="0" y1="95" x2="0" y2="232">
      <stop offset="0" stop-color="#fff4c2"/>
      <stop offset=".22" stop-color="#f6d365"/>
      <stop offset=".5" stop-color="#e0ad42"/>
      <stop offset=".75" stop-color="#b8860b"/>
      <stop offset="1" stop-color="#7a5605"/>
    </linearGradient>
    <linearGradient id="jb-rim" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="235">
      <stop offset="0" stop-color="#fff1b8"/>
      <stop offset=".35" stop-color="#f6d365"/>
      <stop offset=".7" stop-color="#c8951e"/>
      <stop offset="1" stop-color="#8a6208"/>
    </linearGradient>
    <linearGradient id="jb-enamel" gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="235">
      <stop offset="0" stop-color="#3d7fd6"/>
      <stop offset=".35" stop-color="#1e56a0"/>
      <stop offset="1" stop-color="#0a2472"/>
    </linearGradient>
    <linearGradient id="jb-ring" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe9a8"/>
      <stop offset=".5" stop-color="#c98a3a"/>
      <stop offset="1" stop-color="#7a4a14"/>
    </linearGradient>
    <linearGradient id="jb-shine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fffbe8" stop-opacity=".85"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="jb-quill" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#d9c29a"/>
      <stop offset="1" stop-color="#f6ecd2"/>
    </linearGradient>
    <radialGradient id="jb-eye-halo" cx=".5" cy=".55" r=".55">
      <stop offset="0" stop-color="#e9c46a"/>
      <stop offset=".75" stop-color="#c08a33"/>
      <stop offset="1" stop-color="#8a5a1c"/>
    </radialGradient>
    <radialGradient id="jb-eye-green" cx=".5" cy=".58" r=".55">
      <stop offset="0" stop-color="#2fc48a"/>
      <stop offset="1" stop-color="#0f6e4c"/>
    </radialGradient>
    <radialGradient id="jb-eye-teal" cx=".5" cy=".6" r=".55">
      <stop offset="0" stop-color="#5fe0d6"/>
      <stop offset="1" stop-color="#14879a"/>
    </radialGradient>
    <radialGradient id="jb-eye-blue" cx=".45" cy=".45" r=".6">
      <stop offset="0" stop-color="#3a7ff0"/>
      <stop offset=".7" stop-color="#123fa8"/>
      <stop offset="1" stop-color="#0a2472"/>
    </radialGradient>
    <clipPath id="jb-tube"><rect x="${FLUTE.x1}" y="${FLUTE.y1}" width="${FL_W}" height="${FL_H}" rx="${FL_H / 2}"/></clipPath>
    <clipPath id="jb-text">${allGlyphUses}</clipPath>
${glyphDefs}
${clipDefs}
  </defs>

  <!-- mor pankh, tucked behind the flute above the "e" -->
  <g transform="translate(${FEATHER_X} ${FEATHER_Y}) rotate(13) scale(1.08)">
    <g class="feather">
${barbs.map((b) => `      <path d="${b.d}" fill="none" stroke="${b.c}" stroke-width=".85" stroke-linecap="round"/>`).join("\n")}
${wisps.map((d) => `      <path d="${d}" fill="none" stroke="#7fb046" stroke-width=".7" stroke-linecap="round" opacity=".85"/>`).join("\n")}
      <ellipse cx="0" cy="-78" rx="21" ry="26" fill="url(#jb-eye-halo)"/>
      <ellipse cx="0" cy="-77" rx="17" ry="21.5" fill="url(#jb-eye-green)"/>
      <ellipse cx="0" cy="-76" rx="12.6" ry="16" fill="url(#jb-eye-teal)"/>
      <ellipse cx="0" cy="-74.5" rx="8.6" ry="10.8" fill="url(#jb-eye-blue)"/>
      <ellipse cx="0" cy="-72.5" rx="4" ry="5.4" fill="#06123d"/>
      <ellipse cx="-3.4" cy="-80" rx="2.4" ry="3.6" fill="#ffffff" opacity=".35"/>
      <path d="M0 6C0.6 -30 0.4 -60 0 -104" fill="none" stroke="url(#jb-quill)" stroke-width="1.9" stroke-linecap="round"/>
    </g>
  </g>

  <!-- the bansuri -->
  <g class="flute">
    <!-- royal-blue and gold finial accent above the far-left end -->
    <path d="M${FLUTE.x1 + 10} ${FLUTE.y1 + 2}C${FLUTE.x1 + 2} ${FLUTE.y1 - 14} ${FLUTE.x1 + 8} ${FLUTE.y1 - 32} ${FLUTE.x1 + 26} ${FLUTE.y1 - 34}C${FLUTE.x1 + 40} ${FLUTE.y1 - 35} ${FLUTE.x1 + 44} ${FLUTE.y1 - 20} ${FLUTE.x1 + 34} ${FLUTE.y1 - 15}C${FLUTE.x1 + 27} ${FLUTE.y1 - 12} ${FLUTE.x1 + 22} ${FLUTE.y1 - 20} ${FLUTE.x1 + 28} ${FLUTE.y1 - 23}C${FLUTE.x1 + 18} ${FLUTE.y1 - 22} ${FLUTE.x1 + 16} ${FLUTE.y1 - 10} ${FLUTE.x1 + 22} ${FLUTE.y1 + 2}Z" fill="url(#jb-enamel)" stroke="url(#jb-rim)" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="${FLUTE.x1 + 26}" cy="${FLUTE.y1 - 34}" r="2.6" fill="#f6d365"/>
    <rect x="${FLUTE.x1}" y="${FLUTE.y1}" width="${FL_W}" height="${FL_H}" rx="${FL_H / 2}" fill="url(#jb-bamboo)"/>
    <g clip-path="url(#jb-tube)">
${grain.map((d) => `      <path class="grain" d="${d}"/>`).join("\n")}
${nodes.map((x) => `      <rect x="${x - 2}" y="${FLUTE.y1}" width="4" height="${FL_H}" fill="#5a3510" opacity=".28"/><rect x="${x + 2}" y="${FLUTE.y1}" width="1.5" height="${FL_H}" fill="#ffe7b0" opacity=".35"/>`).join("\n")}
      <rect x="${FLUTE.x1}" y="${FLUTE.y1}" width="${FL_W}" height="${FL_H}" fill="url(#jb-bamboo-tone)"/>
      <rect x="${FLUTE.x1}" y="${FLUTE.y1 + 5}" width="${FL_W}" height="2.4" fill="#fff8e0" opacity=".35"/>
      <rect class="shine" x="${FLUTE.x1}" y="${FLUTE.y1}" width="120" height="${FL_H}" fill="url(#jb-shine)" opacity=".7"/>
    </g>
    <rect x="${FLUTE.x1}" y="${FLUTE.y1}" width="${FL_W}" height="${FL_H}" rx="${FL_H / 2}" fill="none" stroke="#3b1f06" stroke-width="1" opacity=".55"/>
    <!-- open mouth end -->
    <ellipse cx="${FLUTE.x2 - 3}" cy="${FL_CY}" rx="4.5" ry="${FL_H / 2 - 1.5}" fill="#2a1505"/>
    <ellipse cx="${FLUTE.x2 - 3}" cy="${FL_CY}" rx="4.5" ry="${FL_H / 2 - 1.5}" fill="none" stroke="#e6b86a" stroke-width="1.2"/>
    <!-- carved copper / gold bands -->
${bands
  .map((x, i) => {
    const fill = i % 2 ? "url(#jb-band-gold)" : "url(#jb-band)";
    return `    <g><rect x="${x - 8}" y="${FLUTE.y1 - 2.5}" width="16" height="${FL_H + 5}" rx="3" fill="${fill}" stroke="#3b1f06" stroke-width=".8"/><path d="M${x - 8} ${FLUTE.y1 + 5}H${x + 8}M${x - 8} ${FLUTE.y2 - 5}H${x + 8}" stroke="#3b1f06" stroke-width=".7" opacity=".7"/><path d="M${x - 6} ${FL_CY}l3 -4 3 4 3 -4 3 4" fill="none" stroke="#3b1f06" stroke-width=".8" opacity=".75"/></g>`;
  })
  .join("\n")}
    <!-- six finger holes + the embouchure hole -->
${[...holes, embouchure]
  .map((h) => `    <ellipse cx="${h.x}" cy="${FL_CY}" rx="${h.rx}" ry="${h.ry}" fill="url(#jb-hole)"/><path d="M${h.x - h.rx} ${FL_CY + 0.6}A${h.rx} ${h.ry} 0 0 0 ${h.x + h.rx} ${FL_CY + 0.6}" fill="none" stroke="#ffe3a6" stroke-width=".9" opacity=".7"/>`)
  .join("\n")}
  </g>

  <!-- the name, each letter hanging from a ring under the flute -->
  <g>
${letterSvg}
  </g>

  <!-- golden glint through the letters -->
  <g clip-path="url(#jb-text)"><rect class="shine" x="0" y="60" width="200" height="190" fill="url(#jb-shine)"/></g>

  <!-- twinkles -->
${sparkles.map((s) => `  <g transform="translate(${s.x} ${s.y})"><path class="spark" d="${star(s.s)}" fill="#fff6d2" style="animation-delay:${s.d}s"/></g>`).join("\n")}
</svg>
`;
writeFileSync(OUT, svg);
console.error(`wrote ${OUT} (${(svg.length / 1024).toFixed(1)} KB)`);
