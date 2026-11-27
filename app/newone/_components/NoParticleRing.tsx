"use client";
import { useEffect, useRef } from "react";
import styles from "../_styles/ring.module.css";

type Props = {
  /** Number of particles at a 1440px-wide viewport; scaled down on smaller screens. */
  density?: number;
  /** Ring radius as a share of the shorter canvas side. */
  radius?: number;
  className?: string;
};

type Particle = { angle: number; dist: number; size: number; alpha: number; speed: number; twinkle: number; accent: boolean };

/* Decorative ring of slowly orbiting particles. Purely visual: hidden from assistive tech. */
export default function NoParticleRing({ density = 900, radius = 0.36, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let tiltX = 0;
    let tiltY = 0;

    const seed = () => {
      const count = Math.round(density * Math.min(1, Math.max(0.35, width / 1440)));
      particles = Array.from({ length: count }, () => {
        // gaussian-ish spread around the ring so the edge looks soft, not drawn
        const spread = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        return {
          angle: Math.random() * Math.PI * 2,
          dist: 1 + spread * 0.38,
          size: Math.random() < 0.08 ? 1.6 + Math.random() : 0.6 + Math.random() * 0.9,
          alpha: 0.25 + Math.random() * 0.75,
          speed: (0.00008 + Math.random() * 0.00018) * (Math.random() < 0.5 ? 1 : -1),
          twinkle: Math.random() * Math.PI * 2,
          accent: Math.random() < 0.035,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduceMotion) draw(0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      const base = Math.min(width, height) * radius;
      tiltX += (pointerX - tiltX) * 0.04;
      tiltY += (pointerY - tiltY) * 0.04;
      const cx = width / 2 + tiltX * 18;
      const cy = height / 2 + tiltY * 18;
      for (const p of particles) {
        const a = p.angle + (reduceMotion ? 0 : t * p.speed);
        const r = base * p.dist;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.92;
        const flicker = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(t * 0.0015 + p.twinkle);
        ctx.globalAlpha = p.alpha * flicker;
        ctx.fillStyle = p.accent ? "#d99b52" : "#f2efe8";
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(loop);
    };

    const onPointer = (e: PointerEvent) => {
      pointerX = e.clientX / window.innerWidth - 0.5;
      pointerY = e.clientY / window.innerHeight - 0.5;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (!reduceMotion) {
      frame = requestAnimationFrame(loop);
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, [density, radius]);

  return <canvas ref={canvasRef} className={`${styles.noRingCanvas} ${className}`.trim()} aria-hidden="true" />;
}
