// Local PREVIEW of the journey story — before the real 3D renders exist.
//
//   npm run journey:preview      # build labelled test frames + quiet test tones, then `npm run dev` and scroll to the story
//   npm run journey:clean        # remove them again (do this before committing)
//
// What it makes (in a temporary folder outside the project, deleted afterwards):
//   - 6 scenes × 36 frames: a dark tinted gradient, a soft moving "character" disc and a label
//     "PREVIEW · 01 The Dream · replace with your 3D render"
//   - a short quiet tone per scene standing in for narration, with subtitles using the real narration text
//   - a quiet looping chord standing in for the music
// The result is marked `preview: true` in the manifest, and the site refuses to render a preview in a production build,
// so these test frames can never appear on the live site — even if `journey:clean` is forgotten.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SRC = join(tmpdir(), "jb-journey-preview-src");
const FRAMES = 36;
const SECONDS = 4; // length of each stand-in narration tone
const W = 1920;
const H = 1080;
const SCENES = [
  { id: "dream", hue: 225 },
  { id: "beginning", hue: 255 },
  { id: "learning", hue: 195 },
  { id: "projects", hue: 30 },
  { id: "experience", hue: 150 },
  { id: "future", hue: 42 },
];

// titles + narration come from the real story config, so the preview reads like the finished story
const config = readFileSync(join(ROOT, "app/components/site/story/journeyConfig.ts"), "utf8");
const pick = (key) => [...config.matchAll(new RegExp(`${key}:\\s*"([^"]+)"`, "g"))].map((m) => m[1]);
const titles = pick("title");
const narrations = pick("narration");
if (titles.length !== 6 || narrations.length !== 6) {
  console.error("✖ Couldn't read the six scene titles/narrations from journeyConfig.ts.");
  process.exit(1);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function frameSvg(si, f) {
  const { hue } = SCENES[si];
  const k = f / (FRAMES - 1); // 0 → 1 through the scene
  const cx = 560 + k * 800; // the "character" drifts across, so scrolling visibly changes frames
  const cy = 520 - Math.sin(k * Math.PI) * 60;
  const num = String(si + 1).padStart(2, "0");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bg" cx="${30 + k * 40}%" cy="40%" r="85%">
      <stop offset="0" stop-color="hsl(${hue},45%,${22 + k * 6}%)"/>
      <stop offset="1" stop-color="#0b0e13"/>
    </radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="260" fill="url(#glow)"/>
  <circle cx="${cx}" cy="${cy}" r="70" fill="#ebe8e1" opacity=".85"/>
  <text x="${W / 2}" y="${H / 2 + 230}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" letter-spacing="6" fill="#d9b46a">PREVIEW · ${num} ${esc(titles[si].toUpperCase())}</text>
  <text x="${W / 2}" y="${H / 2 + 280}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#a2a7b1">replace with your 3D render · frame ${f + 1}/${FRAMES}</text>
</svg>`;
}

// 16-bit mono WAV; `voices` = [frequency, volume][] summed, with a soft fade in/out
function wav(seconds, voices) {
  const rate = 16000;
  const n = rate * seconds;
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  const fade = rate * 0.4;
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / fade, (n - i) / fade);
    const v = voices.reduce((a, [hz, vol]) => a + Math.sin((2 * Math.PI * hz * i) / rate) * vol, 0);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * env)) * 32767), 44 + i * 2);
  }
  return b;
}

const ts = (s) => `00:00:${s.toFixed(3).padStart(6, "0")}`;
function vtt(text) {
  // split the real narration into two cues at a natural break
  const words = text.split(" ");
  const cut = Math.max(1, words.findIndex((w, i) => i >= words.length / 2 - 1 && /[,.]$/.test(w)) + 1 || Math.ceil(words.length / 2));
  const a = words.slice(0, cut).join(" ");
  const b = words.slice(cut).join(" ");
  const mid = SECONDS / 2;
  return `WEBVTT\n\n${ts(0.3)} --> ${ts(mid)}\n${a}\n${b ? `\n${ts(mid)} --> ${ts(SECONDS - 0.2)}\n${b}\n` : ""}`;
}

rmSync(SRC, { recursive: true, force: true });
try {
  console.log("Making preview test frames…");
  for (const [si, { id }] of SCENES.entries()) {
    const dir = join(SRC, id);
    mkdirSync(dir, { recursive: true });
    for (let f = 0; f < FRAMES; f++) await sharp(Buffer.from(frameSvg(si, f))).png({ compressionLevel: 3 }).toFile(join(dir, `frame${f + 1}.png`));
  }
  mkdirSync(join(SRC, "audio"), { recursive: true });
  mkdirSync(join(SRC, "subtitles"), { recursive: true });
  for (let i = 0; i < 6; i++) {
    const n = String(i + 1).padStart(2, "0");
    writeFileSync(join(SRC, "audio", `narration-scene-${n}.wav`), wav(SECONDS, [[392 + i * 22, 0.08]]));
    writeFileSync(join(SRC, "subtitles", `scene-${n}.vtt`), vtt(narrations[i]));
  }
  // A minor chord, quiet: stands in for the music bed
  writeFileSync(join(SRC, "audio", "background-music.wav"), wav(8, [[110, 0.05], [130.8, 0.04], [164.8, 0.04]]));

  execFileSync(process.execPath, [join(ROOT, "scripts/journey/build-journey.mjs"), "--src", SRC, "--preview"], { stdio: "inherit" });
} finally {
  rmSync(SRC, { recursive: true, force: true });
}

console.log(`
PREVIEW ready → run \`npm run dev\` and scroll past the hero.
• These are TEST frames/tones. Production builds ignore them (the section stays hidden on the live site).
• Remove them with \`npm run journey:clean\` before committing.`);
