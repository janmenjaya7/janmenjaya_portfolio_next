import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCENE_ORDER,
  cacheScenes,
  canvasDpr,
  coverRect,
  cueAt,
  frameUrl,
  loadOrder,
  manifestProblem,
  narrationFor,
  nearestLoaded,
  parseVtt,
  positionAt,
  sceneStart,
  storyVisible,
  type StoryManifest,
} from "./story.ts";

const full = (): StoryManifest => ({
  version: 1,
  sizes: { desktop: { w: 1600, h: 900 }, mobile: { w: 800, h: 450 } },
  scenes: SCENE_ORDER.map((id) => ({ id, frames: 20, narration: `narration-${id}.mp3`, subtitles: `${id}.vtt` })),
  music: "background-music.mp3",
  poster: "journey-poster.webp",
});

test("visibility: real assets show everywhere; preview test frames only in development", () => {
  assert.equal(storyVisible(full(), "production"), true);
  assert.equal(storyVisible(full(), "development"), true);
  assert.equal(storyVisible({ ...full(), preview: true }, "development"), true, "preview is visible while developing");
  assert.equal(storyVisible({ ...full(), preview: true }, "production"), false, "a forgotten preview never reaches the live site");
  assert.equal(storyVisible({ ...full(), preview: true }, undefined), true);
  assert.equal(storyVisible(null, "development"), false, "no assets → hidden");
  assert.equal(storyVisible({ ...full(), scenes: [] }, "development"), false, "incomplete → hidden");
});

test("manifest: the story only appears with real frames for all six scenes, in order", () => {
  assert.equal(manifestProblem(full()), null);
  assert.equal(manifestProblem(null), "no assets yet", "nothing generated → hidden");
  assert.equal(manifestProblem({ ...full(), version: 2 }), "unknown manifest version");
  assert.equal(manifestProblem({ ...full(), scenes: full().scenes.slice(0, 5) }), "all six scenes are required");
  const swapped = full();
  [swapped.scenes[0], swapped.scenes[1]] = [swapped.scenes[1], swapped.scenes[0]];
  assert.match(manifestProblem(swapped) ?? "", /scene 1 should be "dream"/);
  const empty = full();
  empty.scenes[3].frames = 1;
  assert.match(manifestProblem(empty) ?? "", /"projects" needs at least 2 frames/);
  assert.equal(manifestProblem({ ...full(), sizes: { desktop: { w: 0, h: 900 }, mobile: { w: 800, h: 450 } } }), "frame sizes missing");
  // narration / music / subtitles are optional: frames alone make a working (silent) story
  const silent = full();
  silent.music = null;
  silent.scenes.forEach((s) => ((s.narration = null), (s.subtitles = null)));
  assert.equal(manifestProblem(silent), null);
});

test("frame URLs are 1-based and per tier", () => {
  assert.equal(frameUrl("dream", 0, "desktop"), "/journey/images/dream/desktop/frame-001.webp");
  assert.equal(frameUrl("future", 19, "mobile"), "/journey/images/future/mobile/frame-020.webp");
});

test("scroll → frame: equal share per scene, first/last frames at the edges, reversible", () => {
  const counts = [20, 20, 30, 25, 20, 24];
  assert.deepEqual(positionAt(0, counts), { scene: 0, frame: 0, global: 0, local: 0 });
  const end = positionAt(1, counts);
  assert.equal(end.scene, 5);
  assert.equal(end.frame, 23);
  assert.equal(end.global, counts.reduce((a, b) => a + b) - 1);
  // each scene starts at k/6 of the scroll
  for (let k = 0; k < 6; k++) assert.equal(positionAt(sceneStart(k, 6) + 1e-9, counts).scene, k);
  // scrolling back gives the same frame
  assert.deepEqual(positionAt(0.4321, counts), positionAt(0.4321, counts));
  // monotonic global frame
  let prev = -1;
  for (let i = 0; i <= 600; i++) {
    const g = positionAt(i / 600, counts).global;
    assert.ok(g >= prev, `frame went backwards at ${i}`);
    prev = g;
  }
  // garbage in → safe
  assert.deepEqual(positionAt(Number.NaN, counts), positionAt(0, counts));
  assert.equal(positionAt(0.5, [Number.NaN, 0, -3]).frame, 0);
});

test("canvas cover-fit: fills the box, never distorts, keeps the focal point when cropping", () => {
  // 16:9 image into a tall phone box → cropped left/right
  const r = coverRect(1600, 900, 390, 844);
  assert.ok(Math.abs(r.w / r.h - 1600 / 900) < 1e-9, "aspect preserved");
  assert.ok(r.h >= 844 - 1e-9 && r.w >= 390, "covers the box");
  assert.ok(Math.abs(r.x + r.w / 2 - 195) < 1e-9, "centred by default");
  // focal point at 30% (character on the left third) stays visible
  const f = coverRect(1600, 900, 390, 844, 0.3);
  const focalX = f.x + 0.3 * f.w;
  assert.ok(focalX >= 0 && focalX <= 390, "focal point on screen");
  assert.ok(f.x <= 0 && f.x + f.w >= 390, "still no empty edge");
  // exact fit
  assert.deepEqual(coverRect(1600, 900, 1600, 900), { x: 0, y: 0, w: 1600, h: 900 });
  // bad sizes → safe
  assert.deepEqual(coverRect(0, 900, 300, 200), { x: 0, y: 0, w: 300, h: 200 });
});

test("canvas DPR is capped (2 desktop, 1.5 phones)", () => {
  assert.equal(canvasDpr(3, true), 1.5);
  assert.equal(canvasDpr(3, false), 2);
  assert.equal(canvasDpr(1, false), 1);
  assert.equal(canvasDpr(Number.NaN, false), 1);
});

test("memory: only the current scene and its neighbours stay decoded", () => {
  assert.deepEqual(cacheScenes(0, 6), [0, 1]);
  assert.deepEqual(cacheScenes(3, 6), [2, 3, 4]);
  assert.deepEqual(cacheScenes(5, 6), [4, 5]);
  assert.deepEqual(cacheScenes(2, 6, 0), [2]);
});

test("loading: the needed frame first, then outward in the scroll direction; every frame exactly once", () => {
  assert.deepEqual(loadOrder(6, 2, 1), [2, 3, 1, 4, 0, 5]);
  assert.deepEqual(loadOrder(6, 2, -1), [2, 1, 3, 0, 4, 5]);
  const all = loadOrder(25, 10, 1);
  assert.equal(all.length, 25);
  assert.equal(new Set(all).size, 25);
  assert.deepEqual(loadOrder(0, 0), []);
  assert.deepEqual(loadOrder(3, 99), [2, 1, 0], "out-of-range start clamps");
});

test("fast scrolling: the nearest decoded frame is shown while the exact one loads", () => {
  const loaded = new Set([0, 1, 7]);
  assert.equal(nearestLoaded(1, (i) => loaded.has(i), 10), 1);
  assert.equal(nearestLoaded(5, (i) => loaded.has(i), 10), 7);
  assert.equal(nearestLoaded(3, (i) => loaded.has(i), 10), 1);
  assert.equal(nearestLoaded(4, () => false, 10), -1);
});

test("WebVTT: cues parsed (SRT commas too), tags stripped, malformed blocks skipped, looked up by playback time", () => {
  const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:02.500
Every journey starts
<b>with a dream.</b>

00:00:02.500 --> 00:00:05,100 align:center
and every dream begins with curiosity.

00:00:09.000 --> 00:00:08.000
backwards — skipped

nonsense block`;
  const cues = parseVtt(vtt);
  assert.equal(cues.length, 2);
  assert.deepEqual(cues[0], { start: 0, end: 2.5, text: "Every journey starts\nwith a dream." });
  assert.equal(cues[1].end, 5.1);
  assert.equal(cueAt(cues, 1)?.text, "Every journey starts\nwith a dream.");
  assert.equal(cueAt(cues, 2.5)?.start, 2.5, "boundaries belong to the next cue");
  assert.equal(cueAt(cues, 7), null);
  assert.equal(cueAt(cues, Number.NaN), null);
  assert.deepEqual(parseVtt(undefined), []);
  assert.equal(parseVtt("WEBVTT\n\n01:02:03.4 --> 01:02:04.000\nx")[0].start, 3723.4, "hours supported");
});

test("narration: never overlaps, never repeats on small scrolls, waits for sound + visibility", () => {
  const base = { soundOn: true, inView: true, narrated: new Set<number>(), playing: null as number | null, hasAudio: () => true };
  assert.deepEqual(narrationFor({ ...base, scene: 0 }), { type: "start", scene: 0 });
  assert.deepEqual(narrationFor({ ...base, scene: 0, playing: 0 }), { type: "none" }, "same scene keeps playing");
  assert.deepEqual(narrationFor({ ...base, scene: 1, playing: 0 }), { type: "start", scene: 1 }, "next scene replaces (the player fades the old one first)");
  assert.deepEqual(narrationFor({ ...base, scene: 0, narrated: new Set([0]) }), { type: "none" }, "scrolling back doesn't replay");
  assert.deepEqual(narrationFor({ ...base, scene: 0, narrated: new Set([0]), playing: 1 }), { type: "stop" }, "…and stops the other voice");
  assert.deepEqual(narrationFor({ ...base, scene: 2, soundOn: false, playing: 1 }), { type: "stop" }, "sound off → silence");
  assert.deepEqual(narrationFor({ ...base, scene: 2, inView: false, playing: 2 }), { type: "stop" }, "left the section → stop");
  assert.deepEqual(narrationFor({ ...base, scene: 3, hasAudio: () => false }), { type: "none" }, "missing recording → silent, no error");
});
