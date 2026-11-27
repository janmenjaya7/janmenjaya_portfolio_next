import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioData } from "../../data";
import { resolveProject, type ShowcaseProject } from "../../lib/journey";
import { displayDomain, indexLabel, splitDeck } from "../_lib/newone-utils";
import NoSplitText from "./NoSplitText";
import tokens from "../_styles/tokens.module.css";
import fx from "../_styles/fx.module.css";
import styles from "../_styles/work.module.css";

type Props = { data: PortfolioData; index: string };

/* One status line, honest about internal tools and sites that are offline now. */
function statusOf(p: ShowcaseProject): { label: string; tone: "live" | "muted" } {
  if (p.internal) return { label: "Internal tool", tone: "live" };
  if (p.offline) return { label: "Site offline", tone: "muted" };
  if (p.live) return { label: "Live", tone: "live" };
  return { label: p.contribution, tone: "muted" };
}

function ProjectLink({ p, className }: { p: ShowcaseProject; className: string }) {
  const href = p.site ?? p.repo;
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {p.site ? displayDomain(p.site) : "View code"}
      <ArrowUpRight size={16} strokeWidth={1.7} aria-hidden="true" />
    </a>
  );
}

/*
  Selected work as a deck: each project with a screenshot is a large card that pins and stacks over the one
  before it (CSS sticky; older cards shrink back where scroll-driven animations are supported). The screenshot
  is shown as a halftone (dotted, duotone) and turns to full colour on hover/focus. The remaining projects
  follow as a compact index. Links only for public sites/repos: internal tools and offline sites say so instead.
*/
export default function NoWorkDeck({ data, index }: Props) {
  const all = (Array.isArray(data.projects) ? data.projects : []).map((p) => resolveProject(p)).filter((p): p is ShowcaseProject => p !== null);
  const { deck, more } = splitDeck(all, 5);

  return (
    <section id="work" className={styles.wkRoot} aria-labelledby="no-work-title">
      <div className={styles.wkHead}>
        <p className={`${tokens.noOverline} ${fx.noReveal}`} data-no-reveal="">
          <span className={styles.wkIndex}>{index}</span> — Selected work
        </p>
        <NoSplitText id="no-work-title" className={styles.wkTitle} text="Products in production" />
      </div>

      {all.length === 0 ? (
        <p className={`${tokens.noBodyMd} ${tokens.noMuted} ${styles.wkEmpty}`}>New case studies are on the way — check back soon.</p>
      ) : null}

      {deck.length > 0 ? (
        <ol className={styles.wkDeck} style={{ "--wk-count": deck.length } as React.CSSProperties}>
          {deck.map((p, i) => {
            const st = statusOf(p);
            return (
              <li key={`${p.title}-${i}`} className={styles.wkCard} style={{ "--wk-i": i } as React.CSSProperties}>
                <article className={styles.wkInner} aria-labelledby={`no-wk-${i}`}>
                  {p.image ? (
                    <div className={styles.wkShot}>
                      <Image
                        src={p.image}
                        alt={p.imageAlt}
                        fill
                        sizes="(max-width: 900px) 100vw, 1200px"
                        className={`${styles.wkImg} ${p.tall ? styles.wkImgTall : ""}`.trim()}
                      />
                      <span className={styles.wkHalftone} aria-hidden="true" />
                    </div>
                  ) : null}
                  <div className={styles.wkMeta}>
                    <span className={styles.wkCount}>
                      {indexLabel(i)} / {indexLabel(deck.length - 1)}
                    </span>
                    <span className={styles.wkStatus} data-tone={st.tone}>
                      <span className={styles.wkDot} aria-hidden="true" />
                      {st.label}
                    </span>
                  </div>
                  <div className={styles.wkBody}>
                    <h3 id={`no-wk-${i}`} className={styles.wkName}>
                      {p.title}
                    </h3>
                    <div className={styles.wkSide}>
                      {p.desc ? <p className={styles.wkDesc}>{p.desc}</p> : null}
                      {p.stack.length > 0 ? (
                        <ul className={styles.wkStack} aria-label="Built with">
                          {p.stack.slice(0, 5).map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      ) : null}
                      <ProjectLink p={p} className={styles.wkLink} />
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      ) : null}

      {more.length > 0 ? (
        <div className={styles.wkMore}>
          <p className={tokens.noOverline}>More work</p>
          <ul className={styles.wkList}>
            {more.map((p, i) => {
              const st = statusOf(p);
              return (
                <li key={`${p.title}-${i}`} className={`${styles.wkRow} ${fx.noReveal}`} data-no-reveal="">
                  <span className={styles.wkRowName}>{p.title}</span>
                  <span className={styles.wkRowStack}>{p.stack.slice(0, 3).join(" · ")}</span>
                  <span className={styles.wkStatus} data-tone={st.tone}>
                    <span className={styles.wkDot} aria-hidden="true" />
                    {st.label}
                  </span>
                  <ProjectLink p={p} className={styles.wkRowLink} />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
