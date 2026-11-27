"use client";
import { useEffect, useRef } from "react";
import styles from "../_styles/fx.module.css";

/*
  A soft ring that trails the pointer and grows over links/buttons. Mouse/trackpad only (pointer: fine),
  never with reduced motion. The system cursor stays visible: this is decoration, not a replacement.
*/
export default function NoCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ref.current;
    if (!ring) return;
    let ok = false;
    try {
      ok = window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      ok = false;
    }
    if (!ok) return;

    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let frame = 0;
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      ring.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      ring.setAttribute("data-on", "");
      const hot = (e.target as Element | null)?.closest?.("a, button, [role='button'], summary");
      ring.toggleAttribute("data-hot", !!hot);
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const onLeave = () => ring.removeAttribute("data-on");
    const onDown = () => ring.setAttribute("data-down", "");
    const onUp = () => ring.removeAttribute("data-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div ref={ref} className={styles.noCursor} aria-hidden="true">
        <span className={styles.noCursorRing} />
      </div>
      <div className={styles.noGrain} aria-hidden="true" />
    </>
  );
}
