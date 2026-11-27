"use client";
import { useEffect, useRef } from "react";
import { fibonacciSphere } from "../_lib/dots";
import styles from "../_styles/dots.module.css";

type Props = {
  /** grain dots at a 1440px-wide hero; scaled down on smaller screens */
  density?: number;
};

/*
  Hero background: one dense sphere of very fine grain sitting right behind the portrait, lit like a halo:
  the rim glows and the centre (right behind the face) stays dark, so the portrait reads clearly. It turns
  slowly, with a warm amber tint on the upper-left rim. The pointer tilts it a touch.
  Calm by design: no ripples or flashes. Decorative (aria-hidden); pauses off screen / in a hidden tab;
  reduced motion draws one still frame.
*/
export default function NoDotField({ density = 7000 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* fine */
    }
    let w = 0;
    let h = 0;
    let sphere: Array<[number, number, number]> = [];
    // projected positions + shade band per dot, reused every frame (no per-frame allocation)
    let PX = new Float32Array(0);
    let PY = new Float32Array(0);
    let PB = new Int8Array(0);
    // rim → front: cream at rising alpha, plus a warm amber tint for the lit upper-left
    const SHADES = [
      "rgba(245, 239, 230, 0.07)",
      "rgba(245, 239, 230, 0.15)",
      "rgba(245, 239, 230, 0.26)",
      "rgba(245, 239, 230, 0.4)",
      "rgba(217, 155, 82, 0.45)",
    ];
    let frame = 0;
    let tick = 0;
    let visible = true;
    let tx = 0;
    let ty = 0;
    let px = 0;
    let py = 0;

    const seed = () => {
      const n = Math.round(density * Math.min(1, Math.max(0.4, w / 1440)));
      sphere = fibonacciSphere(n).map(([x, y, z], i) => {
        // a little radial jitter: grain, not a lattice
        const j = Math.sin(i * 12.9898) * 43758.5453;
        const r = 1 + ((j - Math.floor(j)) - 0.5) * 0.05;
        return [x * r, y * r, z * r];
      });
      PX = new Float32Array(n);
      PY = new Float32Array(n);
      PB = new Int8Array(n);
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      px += (tx - px) * 0.04;
      py += (ty - py) * 0.04;
      const a = reduce ? 0.8 : now * 0.00005 + px * 0.3;
      const tilt = 0.28 + py * 0.12;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      // sits behind the portrait: centred on the head/shoulders, big enough to frame them
      const R = Math.min(w * 0.36, h * 0.46);
      const cx = w * 0.5;
      const cy = h * 0.5;
      for (let i = 0; i < sphere.length; i++) {
        const [x, y, z] = sphere[i];
        const x1 = x * ca + z * sa;
        const z1 = -x * sa + z * ca;
        const y2 = y * ct - z1 * st;
        const z2 = y * st + z1 * ct;
        PX[i] = cx + x1 * R;
        PY[i] = cy + y2 * R;
        if (z2 < -0.05) {
          PB[i] = -1; // back half hidden: the sphere reads as solid
          continue;
        }
        // halo lighting: bright at the rim (z near 0), dark in the middle (z near 1, behind the face),
        // a little stronger toward the upper-left
        const light = (1 - z2) * 0.85 + (-x1 * 0.12 - y2 * 0.14);
        PB[i] = light > 0.86 && i % 7 === 0 ? 4 : light > 0.78 ? 3 : light > 0.6 ? 2 : light > 0.38 ? 1 : z2 > 0.7 ? -1 : 0;
      }
      for (let b = 0; b < SHADES.length; b++) {
        ctx.fillStyle = SHADES[b];
        for (let i = 0; i < sphere.length; i++) if (PB[i] === b) ctx.fillRect(PX[i], PY[i], 1.15, 1.15);
      }
    };

    const loop = (now: number) => {
      // the sphere turns very slowly: redrawing every other frame looks identical and halves the cost
      if (tick++ % 2 === 0) draw(now);
      frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!frame && !reduce && visible && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      if (w < 2 || h < 2) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(performance.now());
    };
    const onPointer = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    io.observe(canvas);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    if (!reduce) window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [density]);

  return <canvas ref={ref} className={styles.ndField} aria-hidden="true" />;
}
