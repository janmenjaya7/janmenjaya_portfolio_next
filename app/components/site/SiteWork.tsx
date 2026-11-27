"use client";
import { motion } from "motion/react";
import { reveal } from "../motion/MotionKit";
import { usePortfolio } from "../PortfolioProvider";
import { skillExtras, skillGroups } from "../../lib/display-utils";
import theme from "../../styles/site/theme.module.css";
import styles from "../../styles/site/work.module.css";


/* A line under each known group (groups come from /admin; unknown names simply show no note). */
const GROUP_NOTES: Record<string, string> = {
  frontend: "The core of what I build every day.",
  "styling & ui": "Interfaces that look right on every screen.",
  "tools & devops": "What turns a design into a dependable product.",
};

/* ══════════════ SKILLS ══════════════ */
export function SiteSkills() {
  const DATA = usePortfolio();
  // the same skills /admin edits and the résumé prints — nothing hard-coded here
  const groups = skillGroups(DATA.skills);
  const extra = skillExtras(DATA.techPills, groups);

  return (
    <section id="skills" className={`${theme.jbInk} ${theme.jbSection} ${styles.skSection}`} aria-labelledby="jb-skills-title">
      <div className={theme.jbWrap}>
        <div className={theme.jbSectionHead}>
          <div>
            <p className={theme.jbEyebrow}>Skills</p>
            <motion.h2 id="jb-skills-title" className={theme.jbTitle} {...reveal()}>
              Tools I <span className={theme.jbSerif}>build with.</span>
            </motion.h2>
          </div>
          <p className={theme.jbLead}>
            No made-up percentages — just the stack I reach for, and the practices that keep it maintainable.
          </p>
        </div>

        {groups.length ? (
          <div className={styles.skGroups}>
            {groups.map((g, gi) => (
              <div key={g.name} className={styles.skGroup}>
                <div className={styles.skGroupHead}>
                  <span className={`${theme.jbSerif} ${styles.skGroupNum}`}>{String(gi + 1).padStart(2, "0")}</span>
                  <h3 className={styles.skGroupName}>{g.name}</h3>
                  {GROUP_NOTES[g.name.toLowerCase()] ? <p className={styles.skGroupNote}>{GROUP_NOTES[g.name.toLowerCase()]}</p> : null}
                </div>
                <ul className={styles.skList}>
                  {g.items.map((item, i) => (
                    <motion.li key={item.name} className={styles.skItem} {...reveal(0.04 * i)}>
                      <span className={styles.skItemName}>{item.name}</span>
                      {item.level ? <span className={styles.skItemLevel}>{item.level}</span> : null}
                    </motion.li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.skEmpty}>The skills list is being updated.</p>
        )}

        {extra.length > 0 ? (
          <motion.p className={styles.skExtra} {...reveal(0.1)}>
            <span>Also comfortable with</span> {extra.join(" · ")}
          </motion.p>
        ) : null}
      </div>
    </section>
  );
}
