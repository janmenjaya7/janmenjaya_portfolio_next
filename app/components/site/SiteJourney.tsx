"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useScroll, useSpring, useTransform } from "motion/react";
import { EASE_OUT as EASE } from "../motion/MotionKit";
import { usePortfolio } from "../PortfolioProvider";
import { buildJourney, type Milestone } from "../../lib/journey";
import theme from "../../styles/site/theme.module.css";
import styles from "../../styles/site/journey.module.css";

const KIND_LABEL: Record<Milestone["kind"], string> = {
  education: "Education",
  certification: "Certification",
  role: "Role",
  recognition: "Award",
};

/*
  A gentle S-curve through one node per row, in real pixels (w × h) so the drawn stroke
  isn't distorted — scaling the SVG non-uniformly would break the path-length animation.
*/
function pathFor(rows: number, w: number, h: number): string {
  if (rows <= 0 || w <= 0 || h <= 0) return "";
  const X = (pct: number) => ((pct / 100) * w).toFixed(1);
  const Y = (units: number) => ((units / (rows * 100)) * h).toFixed(1);
  let d = `M ${X(50)} ${Y(0)}`;
  for (let i = 0; i < rows; i++) {
    const y = i * 100 + 50;
    // stay inside the centre gutter (cards take ~42% each side) so the line never crosses text
    const swing = i % 2 === 0 ? 44 : 56;
    d += ` C ${X(swing)} ${Y(y - 40)}, ${X(swing)} ${Y(y - 10)}, ${X(50)} ${Y(y)}`;
  }
  const last = rows % 2 === 0 ? 44 : 56;
  d += ` C ${X(last)} ${Y(rows * 100 - 30)}, ${X(50)} ${Y(rows * 100 - 10)}, ${X(50)} ${Y(rows * 100)}`;
  return d;
}

/* Track size in pixels, kept current on resize. */
function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function MilestoneRow({ m, index }: { m: Milestone; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  // the middle 20% band is taller than a row, so one marker is always lit while inside the journey
  const active = useInView(ref, { margin: "-40% 0px -40% 0px" });
  const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const side = index % 2 === 0 ? styles.jrLeft : styles.jrRight;

  return (
    <li ref={ref} className={`${styles.jrRow} ${side} ${active ? styles.jrRowActive : ""}`}>
      <span className={`${styles.jrNode} ${m.current ? styles.jrNodeNow : ""}`} aria-hidden="true">
        <span className={styles.jrNodeCore} />
      </span>
      <motion.article
        className={styles.jrCard}
        initial={{ opacity: 0, y: 36 }}
        animate={seen ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <p className={styles.jrWhen}>
          <span className={theme.jbSerif}>{m.when}</span>
          <span className={styles.jrKind}>{m.current ? "Where I am now" : KIND_LABEL[m.kind]}</span>
        </p>
        <h3 className={styles.jrTitle}>{m.title}</h3>
        {m.place ? <p className={styles.jrPlace}>{m.place}</p> : null}
        {m.detail && m.kind !== "certification" ? <p className={styles.jrDetail}>{m.detail}</p> : null}
      </motion.article>
    </li>
  );
}

/* Signature section: a path that draws itself through the real career milestones as you scroll. */
export default function SiteJourney() {
  const DATA = usePortfolio();
  const milestones = useMemo(() => buildJourney(DATA.credentials, DATA.experience), [DATA.credentials, DATA.experience]);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // atmosphere: night slowly lifts towards dawn across the section
  const { scrollYProgress: sky } = useScroll({ target: sectionRef, offset: ["start end", "end end"] });
  const bg = useTransform(sky, [0, 0.45, 1], ["#071327", "#111827", "#1b2333"]);
  const glow = useTransform(sky, [0.2, 1], [0, 0.55]);
  const cloudsFar = useTransform(sky, [0, 1], ["0%", "-18%"]);
  const cloudsNear = useTransform(sky, [0, 1], ["0%", "-42%"]);

  // the path draws with the track
  const { scrollYProgress: track } = useScroll({ target: trackRef, offset: ["start 62%", "end 58%"] });
  const draw = useSpring(track, { stiffness: 90, damping: 26, mass: 0.4 });
  const size = useSize(trackRef);

  if (milestones.length === 0) return null;
  const rows = milestones.length;
  const d = pathFor(rows, size.w, size.h);

  return (
    <motion.section ref={sectionRef} id="journey" className={`${theme.jbInk} ${styles.jr}`} style={{ backgroundColor: bg }} aria-labelledby="jb-journey-title">
      {/* atmosphere layers (decorative) */}
      <div className={styles.jrSky} aria-hidden="true">
        <motion.span className={styles.jrLight} style={{ opacity: glow }} />
        <motion.div className={`${styles.jrClouds} ${styles.jrCloudsFar}`} style={{ y: cloudsFar }} />
        <motion.div className={`${styles.jrClouds} ${styles.jrCloudsNear}`} style={{ y: cloudsNear }} />
      </div>

      <div className={`${theme.jbWrap} ${styles.jrInner}`}>
        <header className={styles.jrHead}>
          <p className={theme.jbEyebrow}>The journey</p>
          <motion.h2
            id="jb-journey-title"
            className={theme.jbTitle}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            From curiosity <span className={theme.jbSerif}>to craft.</span>
          </motion.h2>
          <p className={styles.jrIntro}>
            Every step below is a real one — the degree, the certificates and the teams that shaped how I build for the web.
          </p>
        </header>

        <div ref={trackRef} className={styles.jrTrack}>
          {/* desktop: winding path, drawn in real pixels */}
          {d ? (
            <svg className={styles.jrPath} width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
              <path d={d} className={styles.jrPathBase} />
              <motion.path d={d} className={styles.jrPathDraw} style={{ pathLength: draw }} />
            </svg>
          ) : null}
          {/* mobile: straight line */}
          <span className={styles.jrLine} aria-hidden="true">
            <motion.span className={styles.jrLineFill} style={{ scaleY: draw }} />
          </span>

          <ol className={styles.jrList}>
            {milestones.map((m, i) => (
              <MilestoneRow key={`${m.kind}-${m.title}-${i}`} m={m} index={i} />
            ))}
          </ol>
        </div>

        <p className={styles.jrEnd}>
          <span className={theme.jbSerif}>…and the journey continues.</span>
        </p>
      </div>
      <div className={styles.jrDawn} aria-hidden="true" />
    </motion.section>
  );
}
