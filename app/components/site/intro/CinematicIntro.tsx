"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, Download, FastForward } from "lucide-react";
import { usePortfolio } from "../../PortfolioProvider";
import { buildResumeSheet, resumeChapters } from "../../../lib/journey";
import { INTRO_REPLAY_EVENT, INTRO_SCROLL_KEY, INTRO_SEEN_AT_KEY, INTRO_SEEN_KEY, isIntroSeen, resolveIntroMode, toRoman } from "../../../lib/intro";
import { canUseFancyPointer, createIntroPointer } from "./introPointer";
import { CloudAtmosphere, CloudCurtain, FilmGrain } from "./CloudAtmosphere";
import ResumeScroll from "./ResumeScroll";
import styles from "../../../styles/site/intro.module.css";

/** The name emblem: a golden bansuri with a mor pankh and "Janmenjaya Biswal" hanging from it (built by scripts/brand). */
const LOGO_SRC = "/brand/janmenjaya-biswal.svg";

const html = () => document.documentElement;
const releaseHero = () => html().removeAttribute("data-intro-hold");
const markSeen = () => {
  // this tab, and this browser for the next 30 days (Replay intro in the footer always brings it back)
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* storage blocked: the intro simply plays again next time */
  }
  try {
    localStorage.setItem(INTRO_SEEN_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};
const readStore = (store: () => Storage, key: string) => {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
};
const heroTop = () => {
  const hero = document.getElementById("hero");
  return hero ? hero.getBoundingClientRect().top + window.scrollY : 0;
};

/*
  "Clouds of possibility — unroll my journey".
  Rendered on every visit but shown by CSS only when <html data-intro> is "play" or "static" (set before paint by
  INTRO_BOOT_SCRIPT), so returning visitors, no-JS visitors and crawlers get the normal page with no layout shift.
  GSAP is downloaded only when the scroll-driven version actually plays.
*/
export default function CinematicIntro({ resumeHref }: { resumeHref: string | null }) {
  const DATA = usePortfolio();
  const sheet = useMemo(() => buildResumeSheet(DATA), [DATA]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0); // bumped by "Replay intro" to build the timeline again
  const controls = useRef<{ settle: () => void; goToChapter: (i: number) => void } | null>(null);

  /* a client-side navigation into "/" doesn't run the inline boot script, and <html> keeps whatever mode an earlier
     visit set — decide again before paint so a finished intro never replays when coming back */
  useLayoutEffect(() => {
    const seen = isIntroSeen({
      session: readStore(() => sessionStorage, INTRO_SEEN_KEY),
      seenAt: readStore(() => localStorage, INTRO_SEEN_AT_KEY),
      now: Date.now(),
    });
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* ignore */
    }
    const mode = resolveIntroMode({ seen, reduced });
    if (html().dataset.intro === mode) return;
    html().setAttribute("data-intro", mode);
    if (mode === "play" && window.scrollY < 1) html().setAttribute("data-intro-hold", "");
    else releaseHero();
  }, []);

  /* build the scroll timeline (play mode only) */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (html().dataset.intro !== "play") {
      releaseHero();
      return;
    }
    let cancelled = false;
    let dispose = () => {};
    controls.current = null;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("./introTimeline")])
      .then(([{ gsap }, { ScrollTrigger }, { createIntroTimeline }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const c = createIntroTimeline(root, gsap, ScrollTrigger, { onHeroCue: releaseHero, onComplete: markSeen });
        dispose = c.dispose;
        controls.current = c;
      })
      .catch(() => {
        // couldn't load the animation code (offline, blocked chunk): show the readable static version instead
        if (cancelled) return;
        html().setAttribute("data-intro", "static");
        releaseHero();
      });
    return () => {
      cancelled = true;
      controls.current = null;
      dispose();
    };
  }, [run]);

  /* desktop pointer layer: ring cursor, parallax, paper tilt (never on touch or with reduced motion) */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || html().dataset.intro !== "play" || !canUseFancyPointer()) return;
    return createIntroPointer(root);
  }, [run]);

  /* replay from the footer; pause the ambient drift while the intro is off screen */
  useEffect(() => {
    const root = rootRef.current;
    const onReplay = () => {
      try {
        sessionStorage.removeItem(INTRO_SEEN_KEY);
        localStorage.removeItem(INTRO_SEEN_AT_KEY);
      } catch {
        /* ignore */
      }
      let reduced = false;
      try {
        reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        /* ignore */
      }
      const mode = reduced ? "static" : "play";
      const changed = html().dataset.intro !== mode;
      html().setAttribute("data-intro", mode);
      window.scrollTo({ top: 0, behavior: "instant" });
      if (changed) setRun((n) => n + 1);
      root?.querySelector<HTMLElement>("[data-ci-skip]")?.focus({ preventScroll: true });
    };
    window.addEventListener(INTRO_REPLAY_EVENT, onReplay);

    // remember where the visitor was and how tall the intro above the hero was, so a reload that hides the intro
    // (already seen) can land on the same content instead of ~4 screens further down (see INTRO_BOOT_SCRIPT)
    const onHide = () => {
      try {
        const o = html().dataset.intro === "off" ? 0 : heroTop();
        sessionStorage.setItem(INTRO_SCROLL_KEY, JSON.stringify({ y: Math.round(window.scrollY), o: Math.round(o) }));
      } catch {
        /* storage blocked: the browser's own restoration applies */
      }
    };
    window.addEventListener("pagehide", onHide);

    const io = root ? new IntersectionObserver(([e]) => root.toggleAttribute("data-idle", !e?.isIntersecting)) : null;
    if (root) io?.observe(root);
    return () => {
      window.removeEventListener(INTRO_REPLAY_EVENT, onReplay);
      window.removeEventListener("pagehide", onHide);
      io?.disconnect();
    };
  }, []);

  const skip = () => {
    markSeen();
    releaseHero();
    window.scrollTo({ top: heroTop(), behavior: "instant" });
    controls.current?.settle(); // land on the hero at once, without fast-forwarding the whole animation
    document.getElementById("hero")?.querySelector<HTMLElement>("a[href='#projects']")?.focus({ preventScroll: true });
  };

  // the seal under the name: start reading (first chapter), or just nudge the page if the timeline isn't ready yet
  const begin = () => {
    if (controls.current) controls.current.goToChapter(0);
    else window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
  };

  const name = sheet.name || "Janmenjaya Biswal";
  const chapters = resumeChapters(sheet, !!resumeHref);
  const stack = sheet.skills[0]?.items.filter((s) => /react|next|javascript/i.test(s)).slice(0, 3) ?? [];

  return (
    <div ref={rootRef} className={styles.ciRoot} data-ci-root="" role="region" aria-label="Introduction">
      <div className={styles.ciStage} data-ci-stage="">
        <CloudAtmosphere />

        {/* controls first in the DOM: Skip intro is the first stop after "Skip to content" (painted on top via z-index) */}
        <div className={styles.ciChrome} data-ci-chrome="">
          <button type="button" className={styles.ciSkip} onClick={skip} data-ci-skip="">
            Skip intro
            <FastForward size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
          {resumeHref ? (
            <a href={resumeHref} download className={styles.ciDownload}>
              <Download size={15} strokeWidth={1.8} aria-hidden="true" />
              <span className={styles.ciDownloadLabel}>Download resume</span>
            </a>
          ) : null}

          {/* chapter index: each numeral sits where its chapter is on the paper (placed by the timeline) */}
          <nav className={styles.ciRail} aria-label="Resume chapters" data-ci-rail="">
            <span className={styles.ciRailCount} aria-hidden="true">
              <span data-ci-count="">I</span>
              <span className={styles.ciRailOf}>/ {toRoman(chapters.length)}</span>
            </span>
            <span className={styles.ciRailTrack}>
              <span className={styles.ciRailBar} data-ci-bar="" />
              {chapters.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={styles.ciMark}
                  data-ci-mark={i}
                  data-active={i === 0 ? "" : undefined}
                  aria-current={i === 0 ? "step" : undefined}
                  style={{ "--at": chapters.length > 1 ? i / (chapters.length - 1) : 0 } as CSSProperties}
                  onClick={() => controls.current?.goToChapter(i)}
                  aria-label={`Chapter ${toRoman(i + 1)}: ${label}`}
                >
                  <span className={styles.ciMarkGem} aria-hidden="true" />
                  <span className={styles.ciMarkNum} aria-hidden="true">
                    {toRoman(i + 1)}
                  </span>
                  <span className={styles.ciMarkLabel} aria-hidden="true">
                    {label}
                  </span>
                </button>
              ))}
            </span>
            <span className={styles.ciRailLabel} data-ci-label="" aria-hidden="true">
              {chapters[0]}
            </span>
          </nav>
        </div>

        <div className={styles.ciIdentity} data-ci-identity="">
          <div className={styles.ciIdInner} data-ci-id-inner="">
            <p className={styles.ciIdKicker}>The journey of</p>
            {/* the name as a Samarkan-style emblem: letters hanging from a golden bansuri with a mor pankh */}
            <p className={styles.ciIdName}>
              {/* standalone, self-contained SVG (public/brand): animates on its own and respects reduced motion.
                  The alt is the same full name the artwork shows. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- an animated SVG asset; next/image would rasterise/restrict it */}
              <img src={LOGO_SRC} alt={name} width={1100} height={280} className={styles.ciLogo} fetchPriority="high" decoding="async" />
            </p>
            <p className={styles.ciIdRole}>
              {sheet.role || "Frontend Developer"}
              {stack.length ? <span className={styles.ciIdStack}>{stack.join(" · ")}</span> : null}
            </p>
            <p className={styles.ciIdQuote}>Every line of code is a part of my journey.</p>
            <button type="button" className={styles.ciToSite} onClick={skip}>
              Go to portfolio
              <ArrowDown size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>

          {/* engraved seal: a rotating inscription round a bobbing arrow; starts the unroll */}
          <button type="button" className={styles.ciCue} onClick={begin} data-ci-cue="" aria-label="Scroll to discover: start unrolling the resume">
            <svg viewBox="0 0 120 120" className={styles.ciCueRing} aria-hidden="true" focusable="false">
              <defs>
                <path id="ci-cue-circle" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" />
              </defs>
              <circle cx="60" cy="60" r="57" className={styles.ciCueOuter} />
              <circle cx="60" cy="60" r="33" className={styles.ciCueInner} />
              <text className={styles.ciCueText}>
                <textPath href="#ci-cue-circle" textLength="280" lengthAdjust="spacing">
                  Scroll to discover ✦ Unroll the journey ✦
                </textPath>
              </text>
            </svg>
            <span className={styles.ciCueCore} aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" />
              </svg>
            </span>
          </button>
        </div>

        <ResumeScroll sheet={sheet} resumeHref={resumeHref} />
        <CloudCurtain />
        <FilmGrain />

        {/* golden mist that drifts off the pointer (desktop mouse only, drawn by introPointer) */}
        <canvas className={styles.ciDust} data-ci-dust="" aria-hidden="true" />

        <span className={styles.ciCursor} data-ci-cursor="" aria-hidden="true">
          <span className={styles.ciCursorRing} data-ci-cursor-ring="">
            <span className={styles.ciCursorRingInner}>
              <span className={styles.ciCursorLabel}>Scroll</span>
            </span>
          </span>
          <span className={styles.ciCursorDot} data-ci-cursor-dot="" />
        </span>
      </div>
    </div>
  );
}
