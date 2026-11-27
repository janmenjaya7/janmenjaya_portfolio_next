"use client";
import { useEffect, useState } from "react";
import styles from "../_styles/rail.module.css";

export type RailSection = { id: string; label: string; index: string };

type Props = { sections: readonly RailSection[] };

/*
  Desktop replacement for the browser scrollbar (the native one is hidden only on wide, mouse-driven screens):
  - right edge: a column of dots that fills from the bottom as you read (driven by --no-progress, set by
    NoScrollFx), an amber leading dot, and one tick per section; each tick is a button that jumps there.
  - left edge: the current chapter, written vertically ("(02) What I do").
  Scrolling itself is untouched: wheel, keyboard, trackpad and scrollbar-less devices all work as normal.
*/
export default function NoScrollRail({ sections }: Props) {
  const [current, setCurrent] = useState<string | null>(null);
  const [ticks, setTicks] = useState<Record<string, number>>({});

  // which chapter is under the middle of the screen
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    // above the first chapter (the hero) there is no current chapter
    const onScroll = () => {
      if (els[0].getBoundingClientRect().top > window.innerHeight * 0.5) setCurrent(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [sections]);

  // tick positions = where each section starts, as a share of the scrollable height (re-measured on resize,
  // and once fonts/images have settled the layout)
  useEffect(() => {
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const next: Record<string, number> = {};
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        next[s.id] = Math.min(1, Math.max(0, top / max));
      }
      setTicks(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    const t = window.setTimeout(measure, 1500);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [sections]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    let behavior: ScrollBehavior = "smooth";
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) behavior = "auto";
    } catch {
      /* keep smooth */
    }
    el.scrollIntoView({ behavior, block: "start" });
  };

  const cur = sections.find((s) => s.id === current) ?? null;

  return (
    <>
      <nav className={styles.rlRail} aria-label="Page sections">
        <span className={styles.rlTrack} aria-hidden="true">
          <span className={styles.rlFill} />
          <span className={styles.rlHead} />
        </span>
        <ol className={styles.rlTicks}>
          {sections.map((s) =>
            ticks[s.id] === undefined ? null : (
              <li key={s.id} style={{ top: `${(ticks[s.id] * 100).toFixed(2)}%` }}>
                <button
                  type="button"
                  className={styles.rlTick}
                  aria-label={`Go to ${s.label}`}
                  aria-current={current === s.id ? "location" : undefined}
                  onClick={() => go(s.id)}
                >
                  <span className={styles.rlTickLabel} aria-hidden="true">
                    {s.label}
                  </span>
                </button>
              </li>
            ),
          )}
        </ol>
      </nav>

      <p className={styles.rlChapter} aria-hidden="true" data-on={cur ? "" : undefined}>
        <span className={styles.rlChapterDot} />
        <span key={cur?.id ?? "none"} className={styles.rlChapterText}>
          {cur ? `(${cur.index}) ${cur.label}` : ""}
        </span>
      </p>
    </>
  );
}
