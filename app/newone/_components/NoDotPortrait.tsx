"use client";
import { useEffect, useRef } from "react";
import { fibonacciSphere, fitBottom, morphAmount, sampleDots } from "../_lib/dots";
import styles from "../_styles/dots.module.css";

type Props = {
  /** the cut-out portrait (transparent background) */
  src: string;
  /** element whose hover reveals the real photo and whose box the dots fill */
  className?: string;
};

/** band: 0–2 = ivory dim/mid/bright (by brightness), 3 = amber sparkle; points are sorted by band so each colour is set once per frame */
type P = { tx: number; ty: number; sx: number; sy: number; sz: number; r: number; delay: number; band: number; fd: number; ox: number; oy: number; vx: number; vy: number };

// shadows stay visible (0.55), mid-tones bright (0.85): the face reads clearly against the dark
const BAND_COLOURS = ["rgba(245, 239, 230, 0.55)", "rgba(245, 239, 230, 0.85)", "rgba(250, 246, 238, 1)", "rgba(217, 155, 82, 0.9)"];

const INTRO_MS = 2600;
const REPEL_PX = 90;

/*
  Hero portrait drawn in halftone dots, always alive but calm:
  - intro: the dots start as a slowly turning sphere and fly into the portrait
  - breathing: the dots stay on a crisp halftone grid; only their size swells in a slow wave rolling out
    from the face, so the image gently pulses instead of jittering
  - the pointer pushes dots away (they spring back); scrolling the hero away scatters them
  Purely decorative: the real <Image> next to it keeps the alt text. Reduced motion → the finished portrait, still.
  Rendering pauses whenever the hero is off screen or the tab is hidden.
*/
export default function NoDotPortrait({ src, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const stage = canvas?.parentElement;
    if (!canvas || !ctx || !stage) return;

    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* assume motion is fine */
    }
    const root = document.getElementById("no-root");
    let pts: P[] = [];
    let w = 0;
    let h = 0;
    let frame = 0;
    let start = 0;
    let visible = true;
    let cancelled = false;
    let img: HTMLImageElement | null = null;
    const pointer = { x: -9999, y: -9999 };

    const build = () => {
      if (!img || !img.naturalWidth) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      if (w < 2 || h < 2) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // dense halftone: one dot every ~3px so the face reads clearly; a little wider on phones
      const fit = fitBottom(img.naturalWidth, img.naturalHeight, w, h * 0.92);
      const gap = w < 600 ? 3 : 2.6; // on-screen spacing between dots (px)
      const sw = Math.max(8, Math.round((img.naturalWidth * fit.scale) / gap));
      const sh = Math.max(8, Math.round((img.naturalHeight * fit.scale) / gap));
      const off = document.createElement("canvas");
      off.width = sw;
      off.height = sh;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0, sw, sh);
      let data: Uint8ClampedArray;
      try {
        data = octx.getImageData(0, 0, sw, sh).data;
      } catch {
        return; // tainted canvas (shouldn't happen: same origin) → leave the photo visible
      }
      const dots = sampleDots(data, sw, sh, 1);
      // auto-levels: stretch this photo's own 5th–95th percentile brightness to 0–1 and lift the mid-tones,
      // so skin, eyes and smile separate clearly instead of all landing in the middle band
      const tones = dots.map((d) => d.tone).sort((p, q) => p - q);
      const lo = tones[Math.floor(tones.length * 0.05)] ?? 0;
      const hi = tones[Math.floor(tones.length * 0.95)] ?? 1;
      const span = Math.max(0.05, hi - lo);
      for (const d of dots) d.tone = Math.pow(Math.min(1, Math.max(0, (d.tone - lo) / span)), 0.66);
      const sphere = fibonacciSphere(dots.length);
      const radius = Math.min(w, h) * 0.34;
      const cx = w / 2;
      const cy = h * 0.52;
      pts = dots.map((d, i) => {
        const [x, y, z] = sphere[i];
        return {
          tx: fit.ox + d.x * gap,
          ty: h * 0.08 + fit.oy + d.y * gap,
          sx: cx + x * radius,
          sy: cy + y * radius,
          sz: z,
          // brighter areas → bigger, brighter dots (halftone); size scales with the spacing, never vanishes
          r: gap * (0.42 + 0.56 * Math.pow(d.tone, 0.8)),
          delay: d.y / sh, // dots settle from the top of the head down
          fd: 0, // distance to the face (set below), drives the breathing wave
          // amber sparkle only on the suit (dark, lower half), never on the face or hair
          band: d.tone < 0.18 && d.y / sh > 0.5 && (i * 7919) % 100 < 7 ? 3 : d.tone < 0.28 ? 0 : d.tone < 0.6 ? 1 : 2,
          ox: 0,
          oy: 0,
          vx: 0,
          vy: 0,
        };
      });
      pts.sort((a, b) => a.band - b.band);
      for (const p of pts) p.fd = Math.hypot(p.tx - w * 0.5, p.ty - h * 0.32);
      stage.setAttribute("data-no-dots", "on");
      if (reduce) draw(INTRO_MS * 3);
    };

    const draw = (now: number) => {
      const t = reduce ? INTRO_MS * 3 : now - start;
      const scroll = reduce ? 0 : Number(root?.style.getPropertyValue("--no-hero") || 0) || 0;
      // after the intro the breathing fades in, so the landing stays crisp
      const alive = reduce ? 0 : Math.min(1, Math.max(0, (t - INTRO_MS) / 1500));
      const spin = reduce ? 0 : t * 0.00025;
      const cos = Math.cos(spin);
      const sin = Math.sin(spin);
      ctx.clearRect(0, 0, w, h);
      let band = -1;
      for (const p of pts) {
        if (p.band !== band) {
          band = p.band;
          ctx.fillStyle = BAND_COLOURS[band];
        }
        const m = morphAmount(t, INTRO_MS, p.delay, scroll);
        // the sphere turns around its vertical axis until the dot leaves it
        const rx = (p.sx - w / 2) * cos - p.sz * Math.min(w, h) * 0.34 * sin + w / 2;
        let x = rx + (p.tx - rx) * m;
        let y = p.sy + (p.ty - p.sy) * m;
        let size = p.r * (0.7 + 0.3 * m);
        if (!reduce) {
          // breathing: dots stay on their grid (crisp halftone); only their size swells in a slow outward wave
          if (alive > 0) {
            // weaker near the face so features never flicker; fuller over the shoulders and suit
            const reach = Math.min(1, p.fd / (h * 0.28));
            size *= 1 + 0.14 * reach * Math.sin(t * 0.0016 - p.fd * 0.03) * alive;
          }
          // pointer repel with a spring back
          const dx = x + p.ox - pointer.x;
          const dy = y + p.oy - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL_PX * REPEL_PX) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / REPEL_PX) * 2.4;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
          p.vx += -p.ox * 0.06;
          p.vy += -p.oy * 0.06;
          p.vx *= 0.82;
          p.vy *= 0.82;
          p.ox += p.vx;
          p.oy += p.vy;
          x += p.ox;
          y += p.oy;
        }
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    };

    const loop = (now: number) => {
      if (!start) start = now;
      draw(now);
      frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!frame && !reduce && visible && !document.hidden && pts.length) frame = requestAnimationFrame(loop);
    };

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(stage);
    const ro = new ResizeObserver(() => {
      build();
      kick();
    });
    const onVisibility = () => kick();

    img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      ro.observe(canvas);
      build();
      kick();
    };
    img.onerror = () => stage.removeAttribute("data-no-dots"); // keep the normal photo
    img.src = src;

    if (!reduce) {
      stage.addEventListener("pointermove", onPointer, { passive: true });
      stage.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener("pointermove", onPointer);
      stage.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      stage.removeAttribute("data-no-dots");
      if (img) img.onload = img.onerror = null;
    };
  }, [src]);

  return <canvas ref={canvasRef} className={`${styles.ndCanvas} ${className}`.trim()} aria-hidden="true" />;
}
