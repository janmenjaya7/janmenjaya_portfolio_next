"use client";
import { useEffect, useRef } from "react";

export default function Cursor() {
  const ringRef   = useRef<HTMLDivElement>(null);
  const dotRef    = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ring   = ringRef.current!;
    const dot    = dotRef.current!;
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let raf: number;
    const trail: { x: number; y: number; life: number; size: number }[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top  = my + "px";
      trail.push({ x: mx, y: my, life: 1.0, size: Math.random() * 3 + 2 });
      if (trail.length > 22) trail.shift();
    };

    const onDown = () => {
      dot.classList.add("clicking");
      ring.classList.add("clicking");
    };
    const onUp = () => {
      dot.classList.remove("clicking");
      ring.classList.remove("clicking");
    };

    const onEnter = () => {
      dot.classList.add("hovering");
      ring.classList.add("hovering");
    };
    const onLeave = () => {
      dot.classList.remove("hovering");
      ring.classList.remove("hovering");
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);

    const attachHover = () => {
      document.querySelectorAll("a, button, .glow-card, [data-hover]").forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };
    attachHover();

    const observer = new MutationObserver(attachHover);
    observer.observe(document.body, { childList: true, subtree: true });

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth ring follow
      rx = lerp(rx, mx, 0.1);
      ry = lerp(ry, my, 0.1);
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";

      // Draw trail
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= 0.045;
        if (p.life <= 0) { trail.splice(i, 1); continue; }

        // Glowing trail dot
        const alpha  = p.life * 0.6;
        const radius = p.size * p.life;
        const grad   = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 2.5);
        grad.addColorStop(0,   `rgba(96,165,250,${alpha})`);
        grad.addColorStop(0.5, `rgba(59,130,246,${alpha * 0.5})`);
        grad.addColorStop(1,   `rgba(37,99,235,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        * { cursor: none !important; }

        .cursor-dot {
          position: fixed;
          width: 7px; height: 7px;
          background: #93c5fd;
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width 0.2s, height 0.2s, background 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 8px rgba(96,165,250,0.9), 0 0 20px rgba(96,165,250,0.4);
        }
        .cursor-dot.hovering {
          width: 10px; height: 10px;
          background: #bfdbfe;
          box-shadow: 0 0 12px rgba(96,165,250,1), 0 0 30px rgba(96,165,250,0.6);
        }
        .cursor-dot.clicking {
          width: 5px; height: 5px;
          background: #fff;
          box-shadow: 0 0 16px rgba(255,255,255,1), 0 0 40px rgba(96,165,250,0.8);
        }

        .cursor-ring {
          position: fixed;
          width: 38px; height: 38px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 99998;
          transform: translate(-50%, -50%);
          border: 1.5px solid rgba(96,165,250,0.55);
          box-shadow:
            0 0 10px rgba(96,165,250,0.2),
            inset 0 0 10px rgba(96,165,250,0.05);
          transition:
            width 0.3s cubic-bezier(0.23,1,0.32,1),
            height 0.3s cubic-bezier(0.23,1,0.32,1),
            border-color 0.3s,
            background 0.3s,
            box-shadow 0.3s;
        }
        .cursor-ring.hovering {
          width: 56px; height: 56px;
          border-color: rgba(96,165,250,0.5);
          background: rgba(96,165,250,0.07);
          box-shadow:
            0 0 20px rgba(96,165,250,0.25),
            inset 0 0 20px rgba(96,165,250,0.08);
        }
        .cursor-ring.clicking {
          width: 28px; height: 28px;
          border-color: rgba(147,197,253,0.95);
          background: rgba(96,165,250,0.15);
          box-shadow:
            0 0 24px rgba(96,165,250,0.5),
            inset 0 0 12px rgba(96,165,250,0.2);
        }

        .cursor-canvas {
          position: fixed; top: 0; left: 0;
          width: 100vw; height: 100vh;
          pointer-events: none;
          z-index: 99997;
        }

        @media (pointer: coarse) {
          * { cursor: auto !important; }
          .cursor-dot, .cursor-ring, .cursor-canvas { display: none !important; }
        }
      `}</style>

      <canvas className="cursor-canvas" ref={canvasRef} />
      <div    className="cursor-ring"   ref={ringRef}   />
      <div    className="cursor-dot"    ref={dotRef}    />
    </>
  );
}