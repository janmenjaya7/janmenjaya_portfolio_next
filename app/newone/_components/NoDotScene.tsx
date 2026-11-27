"use client";
import { useEffect, useRef } from "react";
import type { SceneKind } from "../_lib/services";
import styles from "../_styles/services.module.css";

type Props = {
  kind: SceneKind;
  /** draw only while this is true (the active panel); a still frame otherwise */
  active?: boolean;
};

const IVORY = "rgba(242, 239, 232, 0.88)";
const DIM = "rgba(242, 239, 232, 0.28)";
// Espresso & amber: amber carries the drawing, cream is the moving spark
const ACCENT = "rgba(217, 155, 82, 0.95)";
const SPARK = "rgba(245, 239, 230, 0.98)";

/*
  A small dot-matrix illustration drawn on canvas: everything is made of square dots, like a stippled print.
  ui: a wireframe page with cards and a pointer picking one · pulse: a live performance line ·
  network: services linked by data pulses · curve: a bezier on a grid with moving handles.
  Decorative (aria-hidden). Pauses off screen; reduced motion → one still frame.
*/
export default function NoDotScene({ kind, active = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const kickRef = useRef<() => void>(() => {});

  // becoming the active panel restarts the loop; inactive panels stop on their next frame
  useEffect(() => {
    activeRef.current = active;
    kickRef.current();
  }, [active]);

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
    let frame = 0;
    let onScreen = false;
    const seed = kind.length * 97;
    // stable pseudo-random jitter so dots look hand-stippled but don't flicker
    const rnd = (i: number) => {
      const x = Math.sin(i * 12.9898 + seed) * 43758.5453;
      return x - Math.floor(x);
    };

    const dot = (x: number, y: number, s = 1.6) => ctx.fillRect(x - s / 2, y - s / 2, s, s);
    const line = (x1: number, y1: number, x2: number, y2: number, gap = 4.2, s = 1.6, dashed = false) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const n = Math.max(1, Math.floor(len / gap));
      for (let i = 0; i <= n; i++) {
        if (dashed && Math.floor(i / 3) % 2 === 1) continue;
        const k = i / n;
        dot(x1 + (x2 - x1) * k + (rnd(i + x1) - 0.5) * 0.8, y1 + (y2 - y1) * k + (rnd(i + y1) - 0.5) * 0.8, s);
      }
    };
    const rect = (x: number, y: number, rw: number, rh: number, dashed = false) => {
      line(x, y, x + rw, y, 4.2, 1.6, dashed);
      line(x + rw, y, x + rw, y + rh, 4.2, 1.6, dashed);
      line(x + rw, y + rh, x, y + rh, 4.2, 1.6, dashed);
      line(x, y + rh, x, y, 4.2, 1.6, dashed);
    };
    const fill = (x: number, y: number, rw: number, rh: number, density = 0.55, s = 1.8) => {
      let i = 0;
      for (let yy = y + 2; yy < y + rh - 1; yy += 3.4) for (let xx = x + 2; xx < x + rw - 1; xx += 3.4) if (rnd(i++ + xx * 0.13) < density) dot(xx, yy, s);
    };
    const circle = (cx: number, cy: number, r: number, filled = false) => {
      if (filled) {
        let i = 0;
        for (let yy = -r; yy <= r; yy += 3.2) for (let xx = -r; xx <= r; xx += 3.2) if (xx * xx + yy * yy <= r * r && rnd(i++) < 0.75) dot(cx + xx, cy + yy, 1.8);
        return;
      }
      const n = Math.max(12, Math.floor((Math.PI * 2 * r) / 4.2));
      for (let i = 0; i < n; i++) dot(cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r);
    };

    const scenes: Record<SceneKind, (t: number) => void> = {
      ui: (t) => {
        const u = Math.min(w, h * 1.25);
        const ox = (w - u) / 2;
        const oy = (h - u * 0.78) / 2;
        ctx.fillStyle = IVORY;
        // browser frame + nav pills
        rect(ox, oy, u, u * 0.78);
        line(ox, oy + u * 0.07, ox + u, oy + u * 0.07);
        for (let i = 0; i < 3; i++) dot(ox + 10 + i * 8, oy + u * 0.035, 2.6);
        // 2×3 cards
        const cw = (u - 48) / 3;
        const ch = (u * 0.78 - u * 0.07 - 44) / 2;
        const pick = Math.floor(t / 1600) % 6;
        const cards: Array<[number, number]> = [];
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) cards.push([ox + 12 + c * (cw + 12), oy + u * 0.07 + 14 + r * (ch + 14)]);
        cards.forEach(([x, y], i) => {
          ctx.fillStyle = i === pick ? ACCENT : DIM;
          if (i === pick) fill(x, y, cw, ch, 0.7);
          ctx.fillStyle = IVORY;
          rect(x, y, cw, ch, i !== pick);
          ctx.fillStyle = i === pick ? IVORY : DIM;
          line(x + 8, y + ch - 16, x + cw * 0.6, y + ch - 16, 3.2, 2);
        });
        // pointer glides to the picked card
        const [tx, ty] = cards[pick];
        const k = Math.min(1, (t % 1600) / 700);
        const e = 1 - Math.pow(1 - k, 3);
        const [fx, fy] = cards[(pick + 5) % 6];
        const px = fx + cw * 0.6 + (tx + cw * 0.6 - (fx + cw * 0.6)) * e;
        const py = fy + ch * 0.6 + (ty + ch * 0.6 - (fy + ch * 0.6)) * e;
        ctx.fillStyle = SPARK;
        for (let i = 0; i < 9; i++) for (let j = 0; j <= i; j++) if (j < i * 0.62 + 1) dot(px + j * 2.4, py + i * 2.6, 2.2);
      },
      pulse: (t) => {
        const mid = h * 0.55;
        const amp = h * 0.32;
        ctx.fillStyle = DIM;
        for (let x = 10; x < w - 10; x += 26) line(x, h * 0.14, x, h * 0.9, 7, 1.2);
        // heartbeat trace scrolling left: one clear beat (dip, tall spike, recovery) per period; newest part in the cream spark
        const period = Math.max(180, w * 0.42);
        const shift = (t * 0.08) % period;
        const g = (v: number, c: number, s: number) => Math.exp(-((v - c) * (v - c)) / (2 * s * s));
        const yAt = (x: number) => {
          const ph = ((x + shift) % period) / period;
          const beat = -1 * g(ph, 0.5, 0.018) + 0.45 * g(ph, 0.545, 0.016) + 0.12 * g(ph, 0.44, 0.03) - 0.08 * g(ph, 0.62, 0.04);
          return mid + beat * amp + Math.sin((x + shift) * 0.05) * 1.5;
        };
        const headX = w * 0.82;
        let px = 0;
        let py = yAt(0);
        for (let x = 2; x <= headX; x += 2) {
          const y = yAt(x);
          ctx.fillStyle = x > headX - 80 ? SPARK : ACCENT;
          line(px, py, x, y, 2.4, 2.2); // dense dots, so steep spikes stay continuous
          if (x % 6 === 0) dot(x + (rnd(x) - 0.5) * 7, y + (rnd(x + 3) - 0.5) * 7, 1.2);
          px = x;
          py = y;
        }
        ctx.fillStyle = SPARK;
        circle(headX, yAt(headX), 7, true);
        circle(headX, yAt(headX), 13 + Math.sin(t / 260) * 2);
      },
      network: (t) => {
        const u = Math.min(w, h * 1.3);
        const ox = (w - u) / 2;
        const oy = (h - u / 1.3) / 2;
        const nodes: Array<[number, number, number]> = [
          [0.5, 0.5, 0.075],
          [0.14, 0.2, 0.045],
          [0.86, 0.18, 0.045],
          [0.1, 0.8, 0.045],
          [0.88, 0.82, 0.045],
          [0.5, 0.06, 0.036],
          [0.5, 0.95, 0.036],
        ];
        const P = nodes.map(([x, y, r]) => [ox + x * u, oy + y * (u / 1.3), r * u] as [number, number, number]);
        ctx.fillStyle = DIM;
        for (let i = 1; i < P.length; i++) line(P[0][0], P[0][1], P[i][0], P[i][1], 5, 1.6, true);
        P.forEach(([x, y, r], i) => {
          ctx.fillStyle = i === 0 ? ACCENT : IVORY;
          circle(x, y, r, i === 0);
          if (i === 0) {
            ctx.fillStyle = IVORY;
            circle(x, y, r + 8 + Math.sin(t / 400) * 2);
          } else circle(x, y, r * 0.45, true);
        });
        // data pulses travelling out and back
        ctx.fillStyle = SPARK;
        for (let i = 1; i < P.length; i++) {
          const k = ((t / 1500 + i * 0.19) % 1) * 2;
          const f = k <= 1 ? k : 2 - k;
          circle(P[0][0] + (P[i][0] - P[0][0]) * f, P[0][1] + (P[i][1] - P[0][1]) * f, 5, true);
        }
      },
      curve: (t) => {
        const g = Math.min(w, h) / 8;
        const ox = (w - g * 8) / 2;
        const oy = (h - g * 6) / 2;
        ctx.fillStyle = DIM;
        for (let i = 0; i <= 8; i++) line(ox + i * g, oy, ox + i * g, oy + g * 6, 5, 1.2);
        for (let j = 0; j <= 6; j++) line(ox, oy + j * g, ox + g * 8, oy + j * g, 5, 1.2);
        const a: [number, number] = [ox + g * 0.5, oy + g * 5];
        const d: [number, number] = [ox + g * 7.5, oy + g * 1.2];
        const s = Math.sin(t / 1300);
        const b: [number, number] = [ox + g * (2.2 + s * 0.6), oy + g * (0.8 + s * 0.5)];
        const c: [number, number] = [ox + g * (5.6 - s * 0.5), oy + g * (5.4 - s * 0.4)];
        ctx.fillStyle = IVORY;
        line(a[0], a[1], b[0], b[1], 4, 1.6);
        line(d[0], d[1], c[0], c[1], 4, 1.6);
        ctx.fillStyle = ACCENT;
        for (let i = 0; i <= 140; i++) {
          const k = i / 140;
          const m = 1 - k;
          const x = m * m * m * a[0] + 3 * m * m * k * b[0] + 3 * m * k * k * c[0] + k * k * k * d[0];
          const y = m * m * m * a[1] + 3 * m * m * k * b[1] + 3 * m * k * k * c[1] + k * k * k * d[1];
          dot(x, y, 3);
          dot(x + (rnd(i) - 0.5) * 5, y + (rnd(i + 9) - 0.5) * 5, 1.3);
        }
        ctx.fillStyle = IVORY;
        for (const p of [a, d]) fill(p[0] - 6, p[1] - 6, 12, 12, 1, 2.2);
        ctx.fillStyle = SPARK;
        for (const p of [b, c]) circle(p[0], p[1], 6, true);
      },
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      scenes[kind](reduce ? 2400 : now);
    };
    const loop = (now: number) => {
      draw(now);
      frame = onScreen && activeRef.current && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!frame && !reduce && onScreen && activeRef.current && !document.hidden) frame = requestAnimationFrame(loop);
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
      draw(performance.now());
    };
    kickRef.current = kick;
    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      kick();
    });
    io.observe(canvas);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      kickRef.current = () => {};
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [kind]);

  return <canvas ref={ref} className={styles.svCanvas} aria-hidden="true" />;
}
