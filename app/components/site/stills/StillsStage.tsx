"use client";
/*
  Pinned "story in stills": a sticky stage; as you scroll, each chapter image slowly zooms, then crossfades into the next.
  - scroll → stillsAt(): opacity + zoom are written straight to the image styles in one rAF (no React render per frame)
  - React state changes only when the chapter or the final card changes (text column + chapter buttons)
  - reduced motion → no pinning: the six chapters as a simple list
*/
import { useCallback, useEffect, useRef, useState } from "react";
import { stillStart, stillsAt, type StillsManifest } from "../../../lib/stills";
import { FINAL_CARD, SCENES } from "../story/journeyConfig";
import theme from "../../../styles/site/theme.module.css";
import styles from "../../../styles/site/stills.module.css";

const BASE = "/story-stills/";
const FINAL_FROM = 0.55; // the name card replaces the last chapter's text over its second half
const SCREENS_PER_IMAGE = { desktop: 0.9, mobile: 0.8 };
const SM_MAX = 720; // matches scripts/stills/build-stills.mjs

function prefersReduced(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const smWidth = (w: number, h: number) => Math.round(w * Math.min(1, SM_MAX / Math.max(w, h)));

export default function StillsStage({ manifest }: { manifest: StillsManifest }) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const backRefs = useRef<Array<HTMLImageElement | null>>([]);
  const [index, setIndex] = useState(0);
  const [final, setFinal] = useState(false);
  const [reduced, setReduced] = useState(false);
  const images = manifest.images;
  const count = images.length;

  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top > vh || r.bottom < 0) return; // off screen: nothing to do
      const run = r.height - vh;
      const f = stillsAt(run > 0 ? -r.top / run : 0, count);
      for (let i = 0; i < count; i++) {
        const img = imgRefs.current[i];
        const back = backRefs.current[i];
        if (img) {
          img.style.opacity = String(f.reveal[i]);
          img.style.transform = `scale(${f.scale[i].toFixed(4)})`;
        }
        if (back) back.style.opacity = String(f.opacity[i]);
      }
      setIndex(f.index);
      setFinal(f.index === count - 1 && f.local >= FINAL_FROM);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, count]);

  const jumpTo = useCallback(
    (i: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const run = section.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + run * stillStart(i, count) + (i > 0 ? 2 : 0), behavior: prefersReduced() ? "auto" : "smooth" });
    },
    [count],
  );

  const scene = SCENES[index] ?? SCENES[0];

  /* ── reduced motion: a calm list ── */
  if (reduced) {
    return (
      <section id="chapters" className={`${theme.jbInk} ${styles.ssStatic}`} aria-labelledby="ss-static-title">
        <div className={theme.jbWrap}>
          <p className={theme.jbEyebrow}>My story</p>
          <h2 id="ss-static-title" className={styles.ssStaticTitle}>
            Six chapters, one journey
          </h2>
          <ol className={styles.ssStaticList}>
            {images.map((img, i) => (
              <li key={img.lg} className={styles.ssStaticItem}>
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimised WebP from build-stills */}
                <img className={styles.ssStaticImg} src={BASE + img.sm} alt={img.alt || SCENES[i]?.title || ""} width={smWidth(img.w, img.h)} height={Math.round(smWidth(img.w, img.h) * (img.h / img.w))} loading="lazy" decoding="async" />
                <div>
                  <span className={styles.ssNum}>{SCENES[i]?.number}</span>
                  <h3 className={styles.ssStaticHead}>{SCENES[i]?.title}</h3>
                  <p className={styles.ssStaticText}>{SCENES[i]?.narration}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section
      id="chapters"
      ref={sectionRef}
      className={`${theme.jbInk} ${styles.ss}`}
      aria-labelledby="ss-title"
      style={{
        ["--ss-len-d" as string]: `calc(${count} * ${SCREENS_PER_IMAGE.desktop} * 100svh + 100svh)`,
        ["--ss-len-m" as string]: `calc(${count} * ${SCREENS_PER_IMAGE.mobile} * 100svh + 100svh)`,
      }}
    >
      <h2 id="ss-title" className={styles.ssVisuallyHidden}>
        My story in six chapters
      </h2>
      {/* the whole story for screen readers; the animated stage below is decorative */}
      <ol className={styles.ssVisuallyHidden}>
        {images.map((img, i) => (
          <li key={img.lg}>
            {SCENES[i]?.title}: {SCENES[i]?.narration} {img.alt ? `(Image: ${img.alt})` : ""}
          </li>
        ))}
      </ol>

      <div className={styles.ssStage} data-ss-stage>
        <div className={styles.ssBackdrop} aria-hidden="true">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- blurred atmosphere from the small WebP
            <img key={img.sm} ref={(el) => void (backRefs.current[i] = el)} className={styles.ssBackImg} src={BASE + img.sm} alt="" loading="lazy" decoding="async" style={{ opacity: i === 0 ? 1 : 0 }} />
          ))}
        </div>

        <div className={styles.ssLayout}>
          <div className={styles.ssFrame} aria-hidden="true">
            <div className={styles.ssGlow} />
            {images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- pre-optimised WebP with a small/large srcset
              <img
                key={img.lg}
                ref={(el) => void (imgRefs.current[i] = el)}
                data-ss-img={i}
                className={styles.ssImg}
                src={BASE + img.lg}
                srcSet={`${BASE + img.sm} ${smWidth(img.w, img.h)}w, ${BASE + img.lg} ${img.w}w`}
                sizes="(max-width: 899px) 70vw, 40vw"
                width={img.w}
                height={img.h}
                alt=""
                loading="lazy"
                decoding="async"
                style={{ opacity: i === 0 ? 1 : 0 }}
              />
            ))}
          </div>

          <div className={styles.ssText} aria-hidden="true">
            {final ? (
              <div key="final" className={styles.ssCopy} data-ss-final>
                <p className={styles.ssFinalName}>{FINAL_CARD.name}</p>
                <p className={styles.ssFinalRole}>{FINAL_CARD.role}</p>
                <p className={styles.ssFinalStack}>{FINAL_CARD.stack}</p>
                <p className={styles.ssFinalLine}>{FINAL_CARD.line}</p>
              </div>
            ) : (
              <div key={scene.id} className={styles.ssCopy} data-ss-chapter={scene.number}>
                <p className={styles.ssEyebrow}>
                  <span className={styles.ssNum}>{scene.number}</span> / {String(count).padStart(2, "0")}
                </p>
                <p className={styles.ssTitle}>{scene.title}</p>
                <p className={styles.ssNarration}>{scene.narration}</p>
              </div>
            )}
          </div>
        </div>

        <nav className={styles.ssDots} aria-label="Story chapters">
          <ol className={styles.ssDotList}>
            {SCENES.slice(0, count).map((s, i) => (
              <li key={s.id}>
                <button type="button" className={`${styles.ssDot} ${i === index ? styles.ssDotOn : ""}`} onClick={() => jumpTo(i)} aria-current={i === index ? "step" : undefined} aria-label={`Chapter ${s.number}: ${s.label}`}>
                  <span className={styles.ssDotNum}>{s.number}</span>
                  <span className={styles.ssDotLabel}>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
