"use client";
import { Fragment, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowUpRight, Download, MapPin } from "lucide-react";
import { usePortfolio } from "../PortfolioProvider";
import Atmosphere from "./Atmosphere";
import Magnetic from "./Magnetic";
import { PORTRAIT } from "../../lib/portrait";
import { safeUrl } from "../../lib/display-utils";
import theme from "../../styles/site/theme.module.css";
import styles from "../../styles/site/hero.module.css";

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-1.97c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);
const LinkedinIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

/* Words of the main statement; `em` words get the serif accent. */
const STATEMENT: Array<{ w: string; em?: boolean }> = [
  { w: "I" }, { w: "build" }, { w: "fast," }, { w: "accessible" }, { w: "React" }, { w: "&" }, { w: "Next.js" }, { w: "products" },
  { w: "—" }, { w: "used" }, { w: "by" }, { w: "50,000+", em: true }, { w: "learners.", em: true },
];

/* Entrance delays are CSS custom properties: the intro plays on first paint, before JavaScript loads. */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function SiteHero({ resumeHref }: { resumeHref: string | null }) {
  const DATA = usePortfolio();
  const github = safeUrl(DATA.github);
  const linkedin = safeUrl(DATA.linkedin);
  const current = (Array.isArray(DATA.experience) ? DATA.experience : []).find((j) => j?.current);
  const city = DATA.location?.split(",")[0]?.trim() || "";
  const name = DATA.name?.trim() || "Janmenjaya Biswal";

  // scroll-linked only: the portrait drifts slower than the page and the copy fades as the hero leaves
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const onScreen = useInView(ref); // looping details pause when the hero is out of view

  return (
    <section ref={ref} id="hero" className={`${theme.jbInk} ${styles.hero}`} aria-labelledby="jb-hero-title" data-idle={onScreen ? undefined : ""}>
      <Atmosphere />
      <div className={styles.heroHorizon} aria-hidden="true" />

      <div className={`${theme.jbWrap} ${styles.heroGrid}`}>
        <motion.div className={styles.heroCopy} style={{ y: copyY, opacity: fade }}>
          {/* top row: status (+ compact portrait card on phones, rendered by the visual column) */}
          <p className={`${styles.heroStatus} ${styles.heroIn}`} style={d(80)}>
            <span className={styles.heroStatusDot} aria-hidden="true" />
            Available for opportunities
          </p>

          <h1 id="jb-hero-title" className={styles.heroTitle}>
            <span className={`${styles.heroHello} ${styles.heroIn}`} style={d(160)}>
              Hi, I&apos;m {name}.
            </span>
            <span className={styles.heroStatement}>
              {STATEMENT.map((x, i) => (
                // the space sits between the clipped word boxes; inside an inline-block it would collapse
                <Fragment key={i}>
                  <span className={styles.heroWordMask}>
                    <span
                      className={`${styles.heroWord} ${x.em ? theme.jbSerif : ""}`}
                      style={d(260 + i * 45)}
                    >
                      {x.w}
                    </span>
                  </span>
                  {i < STATEMENT.length - 1 ? " " : null}
                </Fragment>
              ))}
            </span>
          </h1>

          <p className={`${styles.heroText} ${styles.heroIn}`} style={d(820)}>
            {/* the current company comes from /admin (same as the "Now" line), so this never goes stale */}
            {current?.company?.trim() ? `Frontend developer at ${current.company.trim()}, shipping` : "Shipping"} responsive, scalable web apps
            with React.js, Next.js and JavaScript — with clean code, thoughtful interfaces and experiences that feel natural to use.
          </p>

          <div className={`${styles.heroActions} ${styles.heroIn}`} style={d(920)}>
            <Magnetic>
              <a href="#projects" className={`${theme.jbBtn} ${theme.jbBtnSolid}`}>
                View my work
                <ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </Magnetic>
            {resumeHref ? (
              <a href={resumeHref} download className={`${theme.jbBtn} ${theme.jbBtnLine}`}>
                Download resume
                <Download size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
            ) : null}
            <span className={styles.heroSocial}>
              {github ? (
                <a href={github} target="_blank" rel="noopener noreferrer" className={theme.jbIconBtn} aria-label="GitHub profile">
                  <GithubIcon />
                </a>
              ) : null}
              {linkedin ? (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className={theme.jbIconBtn} aria-label="LinkedIn profile">
                  <LinkedinIcon />
                </a>
              ) : null}
            </span>
          </div>

          {current?.company?.trim() ? (
            <p className={`${styles.heroNow} ${styles.heroIn}`} style={d(1040)}>
              <span className={styles.heroNowLabel}>Now</span>
              <span>
                {current.title?.trim() || "Software Developer — Frontend"} at <strong>{current.company}</strong>
              </span>
            </p>
          ) : null}
        </motion.div>

        <div className={`${styles.heroVisual} ${styles.heroInVisual}`} style={d(200)}>
          <motion.div className={styles.heroPortraitWrap} style={{ y: portraitY }}>
            {/* gradient stage the portrait rises out of */}
            <span className={styles.heroStage} aria-hidden="true">
              <span className={styles.heroStageGrid} />
              <span className={styles.heroStageSweep} />
            </span>
            <span className={styles.heroTag} aria-hidden="true">
              React · Next.js
            </span>
            <Image
              src={PORTRAIT.src}
              alt={`Portrait of ${name}`}
              width={PORTRAIT.width}
              height={PORTRAIT.height}
              sizes="(max-width: 768px) 280px, (max-width: 1200px) 38vw, 460px"
              loading="eager"
              fetchPriority="high"
              className={styles.heroPortrait}
            />
            {city ? (
              <span className={styles.heroPlace}>
                <MapPin size={13} strokeWidth={1.8} aria-hidden="true" />
                Based in {city}, India
              </span>
            ) : null}
          </motion.div>
        </div>
      </div>

      <a href="#journey" className={`${styles.heroScroll} ${styles.heroIn}`} style={d(1300)}>
        <span className={styles.heroScrollLine} aria-hidden="true" />
        Scroll to follow the journey
        <ArrowDown size={14} strokeWidth={1.8} aria-hidden="true" />
      </a>
    </section>
  );
}
