"use client";
import { ArrowUp } from "lucide-react";
import ArrowPillButton from "./ArrowPillButton";
import { usePortfolio } from "./PortfolioProvider";
import styles from "../styles/footer.module.css";

export default function Footer() {
  const DATA = usePortfolio();
  const year = new Date().getFullYear();
  const watermark = DATA.name.trim().split(/\s+/)[0] || "JB";

  const socials = [
    { label: "LinkedIn", href: DATA.linkedin },
    { label: "GitHub", href: DATA.github },
    { label: "Email", href: DATA.email ? `mailto:${DATA.email}` : "" },
  ].filter((s) => s.href);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className={styles.ftRoot}>
      <div className={styles.ftGlow} aria-hidden="true" />

      <div className={styles.ftInner}>
        {/* ── CTA ── */}
        <div className={styles.ftCta}>
          <div>
            <p className={`${styles.ftEyebrow} font-mono-custom`}>
              <span className="live-dot" /> Available for new projects
            </p>
            <h2 className={`${styles.ftHeadline} font-syne`}>
              Have an idea? <br />
              <span className={styles.ftHeadlineAccent}>
                Let&apos;s build it together.
              </span>
            </h2>
          </div>
          {DATA.email && (
            <ArrowPillButton href={`mailto:${DATA.email}`}>
              Start a project
            </ArrowPillButton>
          )}
        </div>

        {/* ── Columns ── */}
        <div className={styles.ftGrid}>
          <div className={styles.ftBrand}>
            <a href="#hero" className={`${styles.ftLogo} font-syne`}>
              JB<span className={styles.ftLogoDot}>.</span>
            </a>
            <p className={styles.ftTagline}>
              {`${DATA.role} crafting fast, accessible and delightful web experiences with React & Next.js.`}
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <h3 className={`${styles.ftColTitle} font-mono-custom`}>
              Navigate
            </h3>
            <ul className={styles.ftList}>
              {DATA.navLinks.map((l) => (
                <li key={l}>
                  <a href={`#${l.toLowerCase()}`} className={styles.ftLink}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className={`${styles.ftColTitle} font-mono-custom`}>
              Connect
            </h3>
            <ul className={styles.ftList}>
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className={styles.ftLink}
                    {...(s.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {s.label}
                    <span className={styles.ftLinkArrow} aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={`${styles.ftColTitle} font-mono-custom`}>
              Based in
            </h3>
            <p className={styles.ftText}>{DATA.location || "India"}</p>
            {DATA.email && (
              <a href={`mailto:${DATA.email}`} className={styles.ftMail}>
                {DATA.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Watermark name: outlined letters with a travelling glow ── */}
      <div className={`${styles.ftGiant} font-syne`} aria-hidden="true">
        {Array.from(watermark).map((ch, i) => (
          <span
            key={i}
            className={styles.ftGiantLetter}
            style={{ "--i": i } as React.CSSProperties}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.ftBottom}>
        <span className="font-mono-custom" suppressHydrationWarning>
          © {year} {DATA.name}. All rights reserved.
        </span>
        <span className={`${styles.ftBuilt} font-mono-custom`}>
          Built with Next.js
        </span>
        <button
          type="button"
          onClick={scrollToTop}
          className={styles.ftTop}
          aria-label="Back to top"
        >
          <ArrowUp size={16} strokeWidth={2.25} />
        </button>
      </div>
    </footer>
  );
}
