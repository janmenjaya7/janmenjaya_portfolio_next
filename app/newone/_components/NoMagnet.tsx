"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "../_styles/finale.module.css";

type Props = { children: ReactNode; strength?: number };

/*
  Magnetic wrapper: the child leans toward the pointer while it's near, then springs back.
  Mouse only, never with reduced motion; purely visual (the link inside is unchanged for keyboard/touch).
*/
export default function NoMagnet({ children, strength = 0.28 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ok = false;
    try {
      ok = window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      ok = false;
    }
    if (!ok) return;
    let frame = 0;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) * 0.9;
      if (Math.hypot(dx, dy) > reach) {
        set(0, 0);
        return;
      }
      set(dx * strength, dy * strength);
    };
    const reset = () => set(0, 0);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, [strength]);

  return (
    <span ref={ref} className={styles.fnMagnet}>
      {children}
    </span>
  );
}
