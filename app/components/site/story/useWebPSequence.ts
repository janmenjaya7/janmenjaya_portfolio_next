"use client";
/*
  Canvas WebP image-sequence player for the journey story.
  - one <canvas>, no image elements in the DOM
  - frames are fetched + decoded off the main thread (createImageBitmap), at most 4 requests at a time
  - load order: the needed frame first, then outward in the scroll direction; the next scene starts early
  - memory: only the current scene and its neighbours stay decoded; others are released (bitmap.close())
  - draws only when the frame actually changes (one rAF), cover-fit around the scene's focal point, DPR-capped
  - while the exact frame loads, the nearest decoded one is shown; if a scene can't load at all, onFail fires
  Nothing here touches React state per frame.
*/
import { useEffect, useRef } from "react";
import { cacheScenes, canvasDpr, coverRect, frameUrl, loadOrder, nearestLoaded, type StoryManifest, type StoryPosition } from "../../../lib/story";

type Frame = ImageBitmap | HTMLImageElement;
type Options = {
  manifest: StoryManifest;
  focal: Array<{ x: number; y: number }>;
  /** called once if frames can't be loaded (network/asset error) → show the poster instead */
  onFail: () => void;
  /** called after the first frame is on the canvas */
  onReady: () => void;
};

export type SequenceApi = {
  /** show the frame for this scroll position */
  show: (pos: StoryPosition, direction: 1 | -1) => void;
};

const MAX_PARALLEL = 4;

async function decode(url: string, signal: AbortSignal): Promise<Frame> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  if (typeof createImageBitmap === "function") return createImageBitmap(blob);
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await img.decode();
  return img;
}

const release = (f: Frame | undefined) => {
  if (f && "close" in f) f.close();
  else if (f && f.src.startsWith("blob:")) URL.revokeObjectURL(f.src);
};

export function useWebPSequence(canvasRef: React.RefObject<HTMLCanvasElement | null>, { manifest, focal, onFail, onReady }: Options): React.RefObject<SequenceApi | null> {
  const api = useRef<SequenceApi | null>(null);
  const cbs = useRef({ onFail, onReady });
  // keep the latest callbacks without re-running the loader effect
  useEffect(() => {
    cbs.current = { onFail, onReady };
  }, [onFail, onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;

    const counts = manifest.scenes.map((s) => s.frames);
    const mobile = () => window.innerWidth < 768;
    const tier: "desktop" | "mobile" = mobile() ? "mobile" : "desktop";
    const cache: Array<Map<number, Frame>> = counts.map(() => new Map());
    const failed: Array<Set<number>> = counts.map(() => new Set());
    const queue: Array<{ scene: number; frame: number }> = [];
    const inflight = new Set<string>();
    const abort = new AbortController();
    let want: StoryPosition = { scene: 0, frame: 0, global: 0, local: 0 };
    let dir: 1 | -1 = 1;
    let drawn = "";
    let raf = 0;
    let ready = false;
    let gaveUp = false;

    const key = (s: number, f: number) => `${s}:${f}`;

    const draw = () => {
      raf = 0;
      const sceneCache = cache[want.scene];
      const f = nearestLoaded(want.frame, (i) => sceneCache.has(i), counts[want.scene]);
      if (f < 0) return;
      const k = key(want.scene, f) + `@${canvas.width}x${canvas.height}`;
      if (k === drawn) return; // nothing changed: no redraw
      const img = sceneCache.get(f)!;
      const iw = "naturalWidth" in img ? img.naturalWidth : img.width;
      const ih = "naturalHeight" in img ? img.naturalHeight : img.height;
      const fp = focal[want.scene] ?? { x: 0.5, y: 0.5 };
      const r = coverRect(iw, ih, canvas.width, canvas.height, fp.x, fp.y);
      ctx.drawImage(img, r.x, r.y, r.w, r.h);
      drawn = k;
      if (!ready) {
        ready = true;
        cbs.current.onReady();
      }
    };
    const requestDraw = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const pump = () => {
      while (inflight.size < MAX_PARALLEL && queue.length) {
        const job = queue.shift()!;
        const k = key(job.scene, job.frame);
        if (cache[job.scene].has(job.frame) || inflight.has(k) || failed[job.scene].has(job.frame)) continue;
        // skip work for scenes we've moved away from
        if (!cacheScenes(want.scene, counts.length).includes(job.scene)) continue;
        inflight.add(k);
        decode(frameUrl(manifest.scenes[job.scene].id, job.frame, tier), abort.signal)
          .then((frame) => {
            if (abort.signal.aborted || !cacheScenes(want.scene, counts.length).includes(job.scene)) return release(frame);
            cache[job.scene].set(job.frame, frame);
            if (job.scene === want.scene) requestDraw();
          })
          .catch(() => {
            if (abort.signal.aborted) return;
            failed[job.scene].add(job.frame);
            // a whole scene unreadable (or nothing at all on screen yet after the first scene fails) → poster
            const sceneDead = failed[job.scene].size >= counts[job.scene];
            if (!gaveUp && (sceneDead || (!ready && job.scene === 0 && failed[0].size >= Math.min(3, counts[0])))) {
              gaveUp = true;
              cbs.current.onFail();
            }
          })
          .finally(() => {
            inflight.delete(k);
            pump();
          });
      }
    };

    const plan = () => {
      // keep the neighbourhood, release everything else
      const keep = cacheScenes(want.scene, counts.length);
      cache.forEach((m, s) => {
        if (!keep.includes(s)) {
          m.forEach(release);
          m.clear();
        }
      });
      queue.length = 0;
      for (const i of loadOrder(counts[want.scene], want.frame, dir)) queue.push({ scene: want.scene, frame: i });
      // the next scene in the scroll direction starts loading once we're past a third of this one
      const next = want.scene + dir;
      if (next >= 0 && next < counts.length && (dir > 0 ? want.local > 0.33 : want.local < 0.67)) {
        for (const i of loadOrder(counts[next], dir > 0 ? 0 : counts[next] - 1, dir)) queue.push({ scene: next, frame: i });
      }
      pump();
    };

    const resize = () => {
      const dpr = canvasDpr(window.devicePixelRatio, mobile());
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        drawn = "";
        requestDraw();
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let lastPlanned = "";
    api.current = {
      show: (pos, direction) => {
        want = pos;
        dir = direction;
        // re-plan only when the scene (or the half of it that decides prefetching) changes
        const p = `${pos.scene}:${pos.local > 0.33 ? 1 : 0}:${direction}`;
        if (p !== lastPlanned) {
          lastPlanned = p;
          plan();
        } else if (!cache[pos.scene].has(pos.frame)) {
          queue.unshift({ scene: pos.scene, frame: pos.frame });
          pump();
        }
        requestDraw();
      },
    };

    return () => {
      abort.abort();
      cancelAnimationFrame(raf);
      ro.disconnect();
      cache.forEach((m) => {
        m.forEach(release);
        m.clear();
      });
      api.current = null;
    };
  }, [canvasRef, manifest, focal]);

  return api;
}
