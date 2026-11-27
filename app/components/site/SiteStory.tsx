"use client";
import { motion } from "motion/react";
import { reveal } from "../motion/MotionKit";
import { ArrowUpRight } from "lucide-react";
import { usePortfolio } from "../PortfolioProvider";
import { cleanList, prioritiseBullets, safeUrl, splitFigures, stripLeadingEmoji } from "../../lib/display-utils";
import BrandMark from "./BrandMark";
import theme from "../../styles/site/theme.module.css";
import styles from "../../styles/site/editorial.module.css";


/* a bullet with its figures emphasised ("50,000+", "~30%") */
const Outcome = ({ text }: { text: string }) => (
  <>
    {splitFigures(text).map((part, i) =>
      part.figure ? (
        <strong key={i} className={styles.exFig}>
          {part.text}
        </strong>
      ) : (
        part.text
      ),
    )}
  </>
);

/* ══════════════ ABOUT ══════════════ */
export function SiteAbout() {
  const DATA = usePortfolio();
  const [lead, ...rest] = cleanList(DATA.about?.paragraphs);
  const facts = cleanList(DATA.about?.chips).map(stripLeadingEmoji).filter(Boolean);
  const highlights = (Array.isArray(DATA.about?.cards) ? DATA.about.cards : []).filter((c) => c?.title?.trim()).slice(0, 4);

  return (
    <section id="about" className={`${theme.jbPaper} ${theme.jbSection} ${styles.abSection}`} aria-labelledby="jb-about-title">
      <div className={theme.jbWrap}>
        <div className={styles.abGrid}>
          <div className={styles.abAside}>
            <p className={theme.jbEyebrow}>About</p>
            <motion.h2 id="jb-about-title" className={`${theme.jbTitle} ${styles.abTitle}`} {...reveal()}>
              More than just <span className={theme.jbSerif}>writing code.</span>
            </motion.h2>
            {facts.length > 0 ? (
              <motion.ul className={styles.abFacts} aria-label="Quick facts" {...reveal(0.15)}>
                {facts.map((f, i) => (
                  <li key={`${i}-${f}`}>{f}</li>
                ))}
              </motion.ul>
            ) : null}
            {/* the intro's line, carried into the site: fills the column and ties the two worlds together */}
            <motion.figure className={styles.abQuote} {...reveal(0.22)}>
              <BrandMark size={18} className={styles.abQuoteMark} />
              <blockquote className={`${theme.jbSerif} ${styles.abQuoteText}`}>Every line of code is a part of my journey.</blockquote>
              <figcaption className={styles.abQuoteBy}>— {DATA.name?.trim() || "Janmenjaya Biswal"}</figcaption>
            </motion.figure>
          </div>

          <div className={styles.abBody}>
            {lead ? (
              <motion.p className={styles.abLead} {...reveal(0.05)}>
                {lead}
              </motion.p>
            ) : null}
            <div className={styles.abCols}>
              {rest.map((p, i) => (
                <motion.p key={i} className={styles.abText} {...reveal(0.1 + i * 0.06)}>
                  {p}
                </motion.p>
              ))}
            </div>

            {highlights.length > 0 ? (
              <ol className={styles.abHighlights}>
                {highlights.map((c, i) => (
                  <motion.li key={`${i}-${c.title}`} className={styles.abHighlight} {...reveal(0.08 * i)}>
                    <span className={`${theme.jbSerif} ${styles.abHighlightNum}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.abHighlightTitle}>{c.title}</span>
                    {c.desc ? <span className={styles.abHighlightDesc}>{c.desc}</span> : null}
                  </motion.li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════ EXPERIENCE ══════════════ */
export function SiteExperience() {
  const DATA = usePortfolio();
  const jobs = (Array.isArray(DATA.experience) ? DATA.experience : []).filter((j) => j?.title?.trim() && j?.company?.trim());

  return (
    <section id="experience" className={`${theme.jbPaper} ${theme.jbSection} ${styles.exSection}`} aria-labelledby="jb-exp-title">
      <div className={theme.jbWrap}>
        <div className={theme.jbSectionHead}>
          <div>
            <p className={theme.jbEyebrow}>Experience</p>
            <motion.h2 id="jb-exp-title" className={theme.jbTitle} {...reveal()}>
              Where I&apos;ve <span className={theme.jbSerif}>shipped.</span>
            </motion.h2>
          </div>
          <p className={theme.jbLead}>The teams I&apos;ve worked with, what I was responsible for, and what reached production.</p>
        </div>

        {jobs.length === 0 ? (
          <p className={styles.exEmpty}>Experience details are being updated.</p>
        ) : (
          <ol className={styles.exList}>
            {jobs.map((job, i) => {
              // outcomes first (lines with a figure), the rest one click away — nothing reworded or dropped
              const bullets = prioritiseBullets(job.bullets, 3);
              const tech = cleanList(job.tech);
              const products = (Array.isArray(job.products) ? job.products : [])
                .map((p) => ({ name: p?.name?.trim() || "", href: safeUrl(p?.url) }))
                .filter((p) => p.name);
              return (
                <motion.li key={`${job.company}-${i}`} className={styles.exItem} {...reveal(0.05)}>
                  <div className={styles.exWhen}>
                    <span className={`${theme.jbSerif} ${styles.exDate}`}>{job.date?.trim() || "—"}</span>
                    {job.current ? (
                      <span className={styles.exNow}>
                        <span className={styles.exNowDot} aria-hidden="true" /> Current
                      </span>
                    ) : null}
                  </div>

                  <div className={styles.exMain}>
                    <h3 className={styles.exCompany}>{job.company}</h3>
                    <p className={styles.exRole}>
                      {job.title}
                      {job.location?.trim() ? <span> · {job.location}</span> : null}
                    </p>

                    {bullets.lead.length > 0 ? (
                      <ul className={styles.exPoints}>
                        {bullets.lead.map((b, bi) => (
                          <li key={bi}>
                            <Outcome text={b} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {bullets.more.length > 0 ? (
                      <details className={styles.exMore}>
                        <summary className={styles.exMoreToggle}>
                          <span className={styles.exMoreOpen}>Show {bullets.more.length} more</span>
                          <span className={styles.exMoreClose}>Show less</span>
                        </summary>
                        <ul className={`${styles.exPoints} ${styles.exPointsMore}`}>
                          {bullets.more.map((b, bi) => (
                            <li key={bi}>
                              <Outcome text={b} />
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>

                  <div className={styles.exSide}>
                    {tech.length > 0 ? (
                      <div>
                        <p className={styles.exSideLabel}>Technologies</p>
                        <ul className={styles.exTags}>
                          {tech.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {products.length > 0 ? (
                      <div>
                        <p className={styles.exSideLabel}>Shipped</p>
                        <ul className={styles.exProducts}>
                          {products.map((p) => (
                            <li key={p.name}>
                              {p.href ? (
                                <a href={p.href} target="_blank" rel="noopener noreferrer">
                                  {p.name}
                                  <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
                                </a>
                              ) : (
                                p.name
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
