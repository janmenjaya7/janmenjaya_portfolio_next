"use client";
import { useEffect, useRef } from "react";

export default function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const COUNT = 80, CONNECT = 120, MOUSE_R = 150;
    let W = 0, H = 0;
    const mouse = { x: -999, y: -999 };

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let particles: P[] = [];

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }

    function mkParticle(): P {
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.5,
      };
    }

    let raf: number;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(96,165,250,0.5)";
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(59,130,246,${(1 - d / CONNECT) * 0.25})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
        const mx = p.x - mouse.x, my = p.y - mouse.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md < MOUSE_R) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(34,211,238,${(1 - md / MOUSE_R) * 0.5})`;
          ctx.lineWidth = 0.7; ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    particles = Array.from({ length: COUNT }, mkParticle);
    draw();

    const onResize = () => { resize(); particles = Array.from({ length: COUNT }, mkParticle); };
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMove); };
  }, []);

  return <canvas id="bg-canvas" ref={ref} />;
}
