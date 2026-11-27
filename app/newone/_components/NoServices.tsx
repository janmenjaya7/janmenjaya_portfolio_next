"use client";
import { useEffect, useRef, useState } from "react";
import { SERVICES, activeService } from "../_lib/services";
import { indexLabel } from "../_lib/newone-utils";
import NoDotScene from "./NoDotScene";
import tokens from "../_styles/tokens.module.css";
import styles from "../_styles/services.module.css";

type Props = { index: string };

/*
  "What I do": a pinned chapter. On desktop the section stays on screen for about four screen-heights while
  the four services take turns (text + dot-matrix scene); the tab row shows how far through each one you are
  and jumps to it on click. Phones and reduced motion get a plain stacked list (no pinning).
  Progress comes from the track's position (one rAF-throttled scroll listener); React only re-renders
  when the active service changes, the bar fill is a CSS variable.
*/
export default function NoServices({ index }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const count = SERVICES.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      // stacked (unpinned) layout: the track is no taller than the screen → nothing to drive
      if (span < 40) {
        track.style.setProperty("--sv-local", "1");
        setPinned(false);
        return;
      }
      setPinned(true);
      const { index: i, local } = activeService(-r.top / span, count);
      track.style.setProperty("--sv-local", local.toFixed(3));
      setActive((prev) => (prev === i ? prev : i));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);

  // tab click: scroll to the middle of that service's stretch of the pinned track
  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const span = track.offsetHeight - window.innerHeight;
    if (span < 40) {
      document.getElementById(`no-svc-${SERVICES[i].id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const top = track.getBoundingClientRect().top + window.scrollY + span * ((i + 0.15) / count);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section id="services" className={styles.svRoot} aria-labelledby="no-svc-title">
      <div ref={trackRef} className={styles.svTrack} style={{ "--sv-count": count } as React.CSSProperties}>
        <div className={styles.svSticky}>
          <header className={styles.svHead}>
            <p className={tokens.noOverline}>
              <span className={styles.svIndex}>{index}</span> — What I do
            </p>
            <h2 id="no-svc-title" className={styles.svTitle}>
              The whole front end, <span className={styles.svTitleMuted}>done properly.</span>
            </h2>
          </header>

          <div className={styles.svStage}>
            {SERVICES.map((s, i) => (
              <article
                key={s.id}
                id={`no-svc-${s.id}`}
                className={styles.svPanel}
                data-active={i === active ? "" : undefined}
                aria-labelledby={`no-svc-${s.id}-title`}
              >
                <div className={styles.svCopy}>
                  <p className={styles.svLead}>{s.lead}</p>
                  <h3 id={`no-svc-${s.id}-title`} className={styles.svName}>
                    {s.title}
                  </h3>
                  <p className={styles.svBody}>{s.body}</p>
                </div>
                <div className={styles.svScene}>
                  <NoDotScene kind={s.scene} active={!pinned || i === active} />
                </div>
              </article>
            ))}
          </div>

          <ol className={styles.svTabs} aria-label="Services">
            {SERVICES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={styles.svTab}
                  aria-current={i === active ? "step" : undefined}
                  data-done={i < active ? "" : undefined}
                  onClick={() => goTo(i)}
                >
                  <span className={styles.svTabBar} aria-hidden="true" />
                  <span className={styles.svTabNum}>{indexLabel(i)}</span>
                  <span className={styles.svTabName}>{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
