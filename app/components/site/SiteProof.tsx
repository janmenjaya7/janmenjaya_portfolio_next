"use client";
import { motion } from "motion/react";
import { usePortfolio } from "../PortfolioProvider";
import { CountUp } from "../motion/MotionKit";
import theme from "../../styles/site/theme.module.css";
import styles from "../../styles/site/proof.module.css";

/* A quiet band of real numbers right after the hero — the fastest proof for a recruiter skimming the page. */
export default function SiteProof() {
  const DATA = usePortfolio();
  const stats = (Array.isArray(DATA.stats) ? DATA.stats : [])
    .map((s) => ({ num: typeof s?.num === "string" ? s.num.trim() : "", label: typeof s?.label === "string" ? s.label.trim() : "" }))
    .filter((s) => s.num && s.label)
    .slice(0, 4);

  if (stats.length === 0) return null;

  return (
    <section className={`${theme.jbInk} ${styles.pf}`} aria-label="At a glance">
      <dl className={`${theme.jbWrap} ${styles.pfGrid}`} style={{ ["--cols" as string]: stats.length }}>
        {stats.map((s, i) => (
          <motion.div
            key={`${s.num}-${s.label}`}
            className={styles.pfItem}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
          >
            <dt className={styles.pfLabel}>{s.label}</dt>
            <dd className={styles.pfNum}>
              <CountUp value={s.num} />
            </dd>
          </motion.div>
        ))}
      </dl>
    </section>
  );
}
