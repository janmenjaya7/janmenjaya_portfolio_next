"use client";
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import styles from "../../styles/site/wordmark.module.css";

type Props = { text: string };

/*
  Footer name as a living wordmark:
  - letters rise in one by one when it scrolls into view
  - a soft light wave keeps passing through the outlines
  - letters near the pointer lift and fill with colour (a "magnetic wave")
  Decorative only: hidden from assistive tech (the name is in the copyright line).
*/
export default function FooterWordmark({ text }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const letters = Array.from(text);

  // reveal once in view, and track visibility so the ambient loops can pause (CSS does the animating)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = !!entry?.isIntersecting;
        if (visible) el.setAttribute("data-shown", "");
        el.toggleAttribute("data-active", visible); // ambient loops pause off screen
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root || e.pointerType === "touch") return;
    root.querySelectorAll<HTMLSpanElement>("[data-letter]").forEach((span) => {
      const r = span.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy * 0.6);
      const p = Math.max(0, 1 - dist / 260);
      span.style.setProperty("--p", p.toFixed(3));
    });
  };

  const onLeave = () => {
    rootRef.current?.querySelectorAll<HTMLSpanElement>("[data-letter]").forEach((span) => span.style.setProperty("--p", "0"));
  };

  return (
    <div ref={rootRef} className={styles.wm} aria-hidden="true" onPointerMove={onMove} onPointerLeave={onLeave}>
      <span className={styles.wmGlow} />
      {letters.map((ch, i) => (
        <span key={i} className={styles.wmMask}>
          <span data-letter="" className={styles.wmLetter} style={{ "--i": i, "--n": letters.length } as CSSProperties}>
            {ch}
          </span>
        </span>
      ))}
      <span className={styles.wmMask}>
        <span className={`${styles.wmLetter} ${styles.wmDot}`} style={{ "--i": letters.length } as CSSProperties}>
          .
        </span>
      </span>
    </div>
  );
}
