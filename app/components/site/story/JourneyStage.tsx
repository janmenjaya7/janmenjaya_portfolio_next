"use client";
/*
  Pinned, scroll-driven six-scene story.
  - a tall section with a sticky 100svh stage; scroll progress → scene + frame (positionAt), drawn on one canvas
  - React state changes only when the scene / final-card / visibility changes — never per frame
  - reduced motion → a calm static version (poster + the six chapters as text)
  - frames failing to load → the poster stays up and the words still follow the scroll
*/
import { useCallback, useEffect, useRef, useState } from "react";
import { positionAt, sceneStart, type StoryManifest } from "../../../lib/story";
import { FINAL_CARD, SCENES, SCREENS_PER_SCENE } from "./journeyConfig";
import { useWebPSequence } from "./useWebPSequence";
import { useJourneyAudio } from "./useJourneyAudio";
import JourneyControls from "./JourneyControls";
import JourneySubtitles from "./JourneySubtitles";
import JourneyProgress from "./JourneyProgress";
import theme from "../../../styles/site/theme.module.css";
import styles from "../../../styles/site/story.module.css";

const FOCAL = SCENES.map((s) => s.focal);
const FINAL_FROM = 0.55; // the closing card appears over the second half of scene 6

function prefersReduced(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export default function JourneyStage({ manifest }: { manifest: StoryManifest }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState(0);
  const [final, setFinal] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(true);

  const onFail = useCallback(() => setFailed(true), []);
  const onReady = useCallback(() => setReady(true), []);
  const seq = useWebPSequence(canvasRef, { manifest, focal: FOCAL, onFail, onReady });
  const { engine, state: audio } = useJourneyAudio(manifest);
  const counts = manifest.scenes.map((s) => s.frames);
  const countsKey = counts.join(",");

  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }
    const sync = () => setReduced(mq!.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq!.removeEventListener("change", sync);
  }, []);

  /* scroll → frame (rAF-throttled), scene/final-card state, audio position */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;
    const frameCounts = countsKey.split(",").map(Number);
    let raf = 0;
    let lastY = window.scrollY;
    let inView = false;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const dir: 1 | -1 = y < lastY ? -1 : 1;
      lastY = y;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // frames load only once the visitor heads for the story (within half a screen, after a real scroll) or it is
      // already on screen — so they never compete with the hero on page load
      const near = r.top < vh * 1.5 && r.bottom > -vh * 0.5 && (y > 0 || r.top < vh);
      if (!near && !inView) return;
      const run = r.height - vh;
      const pos = positionAt(run > 0 ? -r.top / run : 0, frameCounts);
      seq.current?.show(pos, dir);
      setScene(pos.scene);
      setFinal(pos.scene === frameCounts.length - 1 && pos.local >= FINAL_FROM);
      engine.update(pos.scene, inView);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // narration + music only while the stage is on screen
    const vis = new IntersectionObserver((entries) => {
      for (const e of entries) inView = e.isIntersecting;
      if (!inView) engine.update(engine.scene, false);
      onScroll();
    });
    const stage = section.querySelector<HTMLElement>("[data-sy-stage]");
    if (stage) vis.observe(stage);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      vis.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, countsKey, seq, engine]);

  const scrollToScene = useCallback(
    (i: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const run = section.offsetHeight - window.innerHeight;
      // a hair past the start so the target scene (not the previous one's last frame) is shown
      const y = top + run * sceneStart(i, SCENES.length) + (i > 0 ? 2 : 0);
      window.scrollTo({ top: y, behavior: prefersReduced() ? "auto" : "smooth" });
    },
    [],
  );

  const replay = useCallback(() => {
    engine.reset();
    scrollToScene(0);
  }, [engine, scrollToScene]);

  const posterSrc = manifest.poster ? `/journey/poster/${manifest.poster}` : null;
  const current = SCENES[scene] ?? SCENES[0];

  /* ── reduced motion: no pinning, no frame playback ── */
  if (reduced) {
    return (
      <section id="story" className={`${theme.jbInk} ${styles.syStatic}`} aria-labelledby="sy-static-title">
        <div className={`${theme.jbWrap} ${styles.syStaticInner}`}>
          <p className={theme.jbEyebrow}>My story</p>
          <h2 id="sy-static-title" className={styles.syStaticTitle}>
            Six chapters, one journey
          </h2>
          {posterSrc && (
            // eslint-disable-next-line @next/next/no-img-element -- generated asset, already sized WebP
            <img className={styles.syStaticPoster} src={posterSrc} alt="" width={manifest.sizes.desktop.w} height={manifest.sizes.desktop.h} loading="lazy" decoding="async" />
          )}
          <ol className={styles.syStaticList}>
            {SCENES.map((s) => (
              <li key={s.id} className={styles.syStaticItem}>
                <span className={styles.syStaticNum}>{s.number}</span>
                <div>
                  <h3 className={styles.syStaticHead}>{s.title}</h3>
                  <p className={styles.syStaticText}>{s.narration}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className={styles.syStaticFinal}>
            <strong>{FINAL_CARD.name}</strong> · {FINAL_CARD.role} · {FINAL_CARD.stack}
          </p>
        </div>
      </section>
    );
  }

  const isMobileLen = `calc(${SCENES.length} * ${SCREENS_PER_SCENE.mobile} * 100svh + 100svh)`;
  const isDesktopLen = `calc(${SCENES.length} * ${SCREENS_PER_SCENE.desktop} * 100svh + 100svh)`;

  return (
    <section
      id="story"
      ref={sectionRef}
      className={`${theme.jbInk} ${styles.sy}`}
      aria-label="My story in six chapters"
      style={{ ["--sy-len-m" as string]: isMobileLen, ["--sy-len-d" as string]: isDesktopLen }}
    >
      {/* the whole story as text for screen readers (the canvas is decorative) */}
      <ol className={styles.syVisuallyHidden}>
        {SCENES.map((s) => (
          <li key={s.id}>
            {s.title}: {s.narration}
          </li>
        ))}
      </ol>

      <div className={styles.syStage} data-sy-stage>
        {posterSrc && (
          // eslint-disable-next-line @next/next/no-img-element -- generated asset; shown until the first frame is drawn
          <img data-sy-poster className={`${styles.syPoster} ${ready && !failed ? styles.syHidden : ""}`} src={posterSrc} alt="" aria-hidden="true" decoding="async" />
        )}
        <canvas ref={canvasRef} data-sy-canvas className={`${styles.syCanvas} ${ready && !failed ? "" : styles.syHidden}`} aria-hidden="true" />
        <div className={styles.syShade} aria-hidden="true" />

        <div className={styles.syTitleBox} aria-hidden="true">
          <p key={current.id} data-sy-title className={`${styles.syTitle} ${final ? styles.syHidden : ""}`}>
            <span className={styles.syTitleNum}>{current.number}</span>
            {current.title}
          </p>
        </div>

        <div data-sy-final className={`${styles.syFinal} ${final ? styles.syFinalOn : ""}`} aria-hidden={!final}>
          <p className={styles.syFinalName}>{FINAL_CARD.name}</p>
          <p className={styles.syFinalRole}>{FINAL_CARD.role}</p>
          <p className={styles.syFinalStack}>{FINAL_CARD.stack}</p>
          <p className={styles.syFinalLine}>{FINAL_CARD.line}</p>
        </div>

        {subtitlesOn && !final && <JourneySubtitles cue={audio.speaking === scene ? audio.cue : null} caption={current.caption} speaking={audio.speaking === scene} />}

        <JourneyProgress active={scene} onJump={scrollToScene} />

        <JourneyControls
          hasAudio={engine.hasAudio}
          soundOn={audio.soundOn}
          paused={audio.paused}
          subtitlesOn={subtitlesOn}
          onSound={(on) => engine.setSound(on)}
          onSubtitles={setSubtitlesOn}
          onPause={() => engine.togglePause()}
          onReplay={replay}
        />
      </div>
    </section>
  );
}
