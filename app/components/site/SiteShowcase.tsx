"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT as EASE } from "../motion/MotionKit";
import { ArrowUpRight, CloudOff, LockKeyhole } from "lucide-react";
import { usePortfolio } from "../PortfolioProvider";
import MacBook from "./MacBook";
import { hostOf } from "../../lib/display-utils";
import { resolveProject, type ShowcaseProject } from "../../lib/journey";
import { shotSlug, shotUrl, type ShotIndex } from "../../lib/shot-validation";
import theme from "../../styles/site/theme.module.css";
import styles from "../../styles/site/showcase.module.css";


/* What a project shows on the laptop screen: a real screenshot (tall ones scroll on hover) or an honest cover. */
function Screen({ p, index }: { p: ShowcaseProject; index: number }) {
  if (p.image) {
    return (
      <div className={`${styles.scShot} ${p.tall ? styles.scShotTall : ""}`}>
        <Image
          src={p.image}
          alt={p.imageAlt}
          fill
          sizes="(max-width: 900px) 92vw, 62vw"
          className={styles.scImg}
          // screenshots uploaded in /admin are served (already compressed) by our own API with a ?v= cache key
          unoptimized={p.image.startsWith("/api/")}
        />
        {p.tall ? <span className={styles.scHint}>Hover to scroll</span> : null}
      </div>
    );
  }
  return (
    <div className={`${styles.scCover} ${styles[`scCover${index % 3}`]}`}>
      <span className={styles.scCoverKind}>{p.offline ? "Was live in production" : p.live ? "Live in production" : "Personal project"}</span>
      <span className={`${theme.jbSerif} ${styles.scCoverTitle}`}>{p.title}</span>
      <span className={styles.scCoverStack}>{p.stack.join(" · ")}</span>
    </div>
  );
}

/*
  Projects as a tabbed showcase: choose a project and it opens on the MacBook screen,
  with its details alongside. Proper ARIA tabs with arrow-key support.
*/
export function SiteProjects({ shots = {} }: { shots?: ShotIndex }) {
  const DATA = usePortfolio();
  const projects = (Array.isArray(DATA.projects) ? DATA.projects : [])
    .map((raw) => {
      const slug = shotSlug(raw?.title);
      const meta = slug ? shots[slug] : undefined;
      return resolveProject(raw, slug && meta ? shotUrl(slug, meta) : null);
    })
    .filter((p): p is ShowcaseProject => p !== null);
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const uid = useId();

  if (projects.length === 0) {
    return (
      <section id="projects" className={`${theme.jbPaper} ${theme.jbSection}`}>
        <div className={theme.jbWrap}>
          <p className={styles.scEmpty}>New projects are on the way.</p>
        </div>
      </section>
    );
  }

  const current = Math.min(active, projects.length - 1);
  const p = projects[current];

  const select = (i: number, focus = false) => {
    const next = (i + projects.length) % projects.length;
    setActive(next);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select(i + 1, true); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select(i - 1, true); }
    else if (e.key === "Home") { e.preventDefault(); select(0, true); }
    else if (e.key === "End") { e.preventDefault(); select(projects.length - 1, true); }
  };

  return (
    <section id="projects" className={`${theme.jbPaper} ${theme.jbSection}`} aria-labelledby="jb-projects-title">
      <div className={theme.jbWrap}>
        <div className={theme.jbSectionHead}>
          <div>
            <p className={theme.jbEyebrow}>Selected work</p>
            <motion.h2
              id="jb-projects-title"
              className={theme.jbTitle}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              Things I&apos;ve <span className={theme.jbSerif}>built.</span>
            </motion.h2>
          </div>
          <p className={theme.jbLead}>Pick a project to open it on the screen — production platforms first, then personal builds.</p>
        </div>

        <div className={styles.sc}>
          {/* project tabs */}
          <div className={styles.scTabs} role="tablist" aria-label="Projects" aria-orientation="vertical">
            {projects.map((proj, i) => {
              const selected = i === current;
              return (
                <button
                  key={`${proj.title}-${i}`}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`${uid}-panel-${i}`}
                  tabIndex={selected ? 0 : -1}
                  className={`${styles.scTab} ${selected ? styles.scTabOn : ""}`}
                  onClick={() => select(i)}
                  onKeyDown={(e) => onKey(e, i)}
                >
                  <span className={`${theme.jbSerif} ${styles.scTabNum}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.scTabText}>
                    <span className={styles.scTabTitle}>{proj.title}</span>
                    <span className={styles.scTabMeta}>
                      <span className={proj.live ? styles.scDotLive : styles.scDot} aria-hidden="true" />
                      {proj.internal ? "Internal tool" : proj.offline ? "Site offline" : proj.live ? "Live" : "Personal"}
                      {proj.stack[0] ? ` · ${proj.stack.slice(0, 2).join(", ")}` : ""}
                    </span>
                  </span>
                  {selected ? <motion.span layoutId={`${uid}-tab-marker`} className={styles.scTabMarker} transition={{ type: "spring", stiffness: 380, damping: 34 }} /> : null}
                </button>
              );
            })}
          </div>

          {/* device + details */}
          <div className={styles.scStage}>
            <motion.div
              className={styles.scDevice}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 1, ease: EASE }}
            >
              <MacBook url={p.site ? hostOf(p.site) : (p.displayHost ?? (p.repo ? hostOf(p.repo) : p.title))}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={current}
                    className={styles.scScreen}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <Screen p={p} index={current} />
                  </motion.div>
                </AnimatePresence>
              </MacBook>
            </motion.div>

            {/* every panel stays in the page (for search engines and screen readers); only the active one is shown */}
            {projects.map((proj, i) => (
              <div
                key={`${proj.title}-panel-${i}`}
                id={`${uid}-panel-${i}`}
                role="tabpanel"
                aria-labelledby={`${uid}-tab-${i}`}
                hidden={i !== current}
                className={styles.scPanel}
              >
                <div className={styles.scPanelMain}>
                  <h3 className={styles.scTitle}>{proj.title}</h3>
                  {proj.desc ? <p className={styles.scDesc}>{proj.desc}</p> : null}
                </div>
                <dl className={styles.scFacts}>
                  <div>
                    <dt>My role</dt>
                    <dd>{proj.contribution}</dd>
                  </div>
                  {proj.stack.length > 0 ? (
                    <div>
                      <dt>Built with</dt>
                      <dd>{proj.stack.join(", ")}</dd>
                    </div>
                  ) : null}
                </dl>
                {proj.internal ? (
                  // sign-in-only tool: say so plainly and offer a walkthrough instead of a dead-end login link
                  <div className={styles.scInternal}>
                    <span className={styles.scInternalBadge}>
                      <LockKeyhole size={15} strokeWidth={1.9} aria-hidden="true" />
                      Internal tool · sign-in required
                    </span>
                    <p className={styles.scInternalText}>Built for the IFAS team, so there&apos;s no public demo. I&apos;m happy to walk you through it on a call.</p>
                    <a href="#contact" className={`${theme.jbBtn} ${theme.jbBtnLine} ${styles.scInternalCta}`}>
                      Ask for a walkthrough <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                    </a>
                  </div>
                ) : proj.offline ? (
                  // was live in production, but the site is unreachable now: be honest, no dead link
                  <div className={styles.scInternal}>
                    <span className={`${styles.scInternalBadge} ${styles.scOfflineBadge}`}>
                      <CloudOff size={15} strokeWidth={1.9} aria-hidden="true" />
                      Site currently offline
                    </span>
                    <p className={styles.scInternalText}>This platform ran in production, but its site isn&apos;t online right now. I&apos;m happy to walk you through what I built.</p>
                    <a href="#contact" className={`${theme.jbBtn} ${theme.jbBtnLine} ${styles.scInternalCta}`}>
                      Ask for a walkthrough <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                    </a>
                  </div>
                ) : proj.site || proj.repo ? (
                  <p className={styles.scLinks}>
                    {proj.site ? (
                      <a href={proj.site} target="_blank" rel="noopener noreferrer" className={`${theme.jbBtn} ${theme.jbBtnSolid}`}>
                        Visit live site <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                      </a>
                    ) : null}
                    {proj.repo ? (
                      <a href={proj.repo} target="_blank" rel="noopener noreferrer" className={`${theme.jbBtn} ${theme.jbBtnLine}`}>
                        View code <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                      </a>
                    ) : null}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* a natural moment to start a conversation, right after the work */}
        <a href="#contact" className={styles.scCta}>
          <span>Have a project like these in mind?</span>
          <span className={styles.scCtaGo}>
            Let&apos;s talk <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </a>
      </div>
    </section>
  );
}
