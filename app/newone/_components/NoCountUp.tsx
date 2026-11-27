"use client";
import { useEffect, useRef, useState } from "react";
import { formatStat, parseStat } from "../../lib/display-utils";
import tokens from "../_styles/tokens.module.css";

type Props = { value: string; className?: string };

/* Counts a stat up from zero the first time it scrolls into view. Values without a number render as-is. */
export default function NoCountUp({ value, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    const stat = parseStat(value);
    if (!el || !stat || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(formatStat(stat, stat.value * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">
        {display}
      </span>
      <span className={tokens.noSrOnly}>{value}</span>
    </span>
  );
}
