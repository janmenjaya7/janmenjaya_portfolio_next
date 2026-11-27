"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import styles from "../../styles/site/atmosphere.module.css";

type Band = { top: string; left: string; w: string; h: string; o: number; dur: number; delay: number; blur: number };

/* Soft, wide cloud banks — pure CSS, decorative only. Kept deliberately sparse and slow. */
const NIGHT: Band[] = [
  { top: "8%", left: "-20%", w: "70vw", h: "22vh", o: 0.1, dur: 95, delay: 0, blur: 50 },
  { top: "46%", left: "35%", w: "80vw", h: "26vh", o: 0.08, dur: 120, delay: -40, blur: 60 },
  { top: "72%", left: "-10%", w: "65vw", h: "20vh", o: 0.12, dur: 105, delay: -70, blur: 55 },
];

export default function Atmosphere({ className = "", bands = NIGHT }: { className?: string; bands?: Band[] }) {
  const ref = useRef<HTMLDivElement>(null);

  // pause the drift while the section is off screen (saves battery; no visual change)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => el.toggleAttribute("data-paused", !entry?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.atmo} ${className}`.trim()} aria-hidden="true">
      {bands.map((b, i) => (
        <span
          key={i}
          className={styles.atmoBand}
          style={
            {
              top: b.top,
              left: b.left,
              width: b.w,
              height: b.h,
              opacity: b.o,
              filter: `blur(${b.blur}px)`,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
            } as CSSProperties
          }
        />
      ))}
      <span className={styles.atmoGrain} />
    </div>
  );
}
