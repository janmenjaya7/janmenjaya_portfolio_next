"use client";
/*
  Shared motion settings for the main site, built on `motion`.
  One easing curve and one scroll-reveal recipe so every section moves the same way:
  reveals ~0.8s ease-out, triggered once when ~12% into view. Everything collapses to its
  final state when the visitor prefers reduced motion (MotionConfig reducedMotion="user").
*/
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MotionConfig, animate, motion, useInView, useReducedMotion, useScroll, useSpring } from "motion/react";
import { formatStat, parseStat } from "../../lib/display-utils";

/** The one easing curve used across the site (a soft "ease-out-quint"). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Props for a fade-and-rise reveal when an element scrolls into view. Spread onto any motion element. */
export const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -12% 0px" },
  transition: { duration: 0.8, ease: EASE_OUT, delay },
});

/* ── provider: honours the OS "reduce motion" setting everywhere below ── */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* ── thin page progress bar ── */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });
  return <motion.div aria-hidden="true" className={className} style={{ scaleX, transformOrigin: "0% 50%" }} />;
}

/* ── stat that counts up once visible ("50K+", "3+", "50,000+") ── */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const stat = parseStat(value);
    if (!inView || !stat || reduce) return;
    const controls = animate(0, stat.value, {
      duration: 1.4,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(formatStat(stat, v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">
        {display}
      </span>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>{value}</span>
    </span>
  );
}
