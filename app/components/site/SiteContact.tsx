"use client";
import { motion } from "motion/react";
import { EASE_OUT as EASE } from "../motion/MotionKit";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import ContactForm from "../ContactForm";
import Atmosphere from "./Atmosphere";
import FooterWordmark from "./FooterWordmark";
import BrandLogo from "../BrandLogo";
import { usePortfolio } from "../PortfolioProvider";
import { safeUrl } from "../../lib/display-utils";
import { INTRO_REPLAY_EVENT } from "../../lib/intro";
import theme from "../../styles/site/theme.module.css";
import styles from "../../styles/site/contact.module.css";


/* ══════════════ CONTACT ══════════════ */
export function SiteContact() {
  const DATA = usePortfolio();
  const email = DATA.email?.trim() || "";
  const phone = DATA.phone?.trim() || "";
  const linkedin = safeUrl(DATA.linkedin);
  const github = safeUrl(DATA.github);
  const location = DATA.location?.trim() || "";

  const lines = [
    email ? { label: "Email", value: email, href: `mailto:${email}` } : null,
    phone ? { label: "Phone", value: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}` } : null,
    location ? { label: "Based in", value: location, href: null } : null,
    linkedin ? { label: "LinkedIn", value: "Connect with me", href: linkedin } : null,
    github ? { label: "GitHub", value: "See my code", href: github } : null,
  ].filter((l): l is { label: string; value: string; href: string | null } => l !== null);

  return (
    <section id="contact" className={`${theme.jbInk} ${theme.jbSection} ${styles.ctSection}`} aria-labelledby="jb-contact-title">
      <Atmosphere />
      <div className={`${theme.jbWrap} ${styles.ctInner}`}>
        <div className={styles.ctIntro}>
          <p className={theme.jbEyebrow}>Contact</p>
          <motion.h2
            id="jb-contact-title"
            className={`${theme.jbTitle} ${styles.ctTitle}`}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            Let&apos;s build something <span className={theme.jbSerif}>worth using.</span>
          </motion.h2>
          <p className={styles.ctLead}>
            Open to frontend roles, freelance work and good conversations. I read every message and usually reply within a day.
          </p>
          <ul className={styles.ctLines}>
            {lines.map((l) => (
              <li key={l.label} className={styles.ctLine}>
                <span className={styles.ctLabel}>{l.label}</span>
                {l.href ? (
                  <a
                    href={l.href}
                    className={styles.ctValue}
                    {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {l.value}
                    <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                ) : (
                  <span className={styles.ctValue}>{l.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          className={styles.ctForm}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        >
          <ContactForm />
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════ FOOTER ══════════════ */
export function SiteFooter() {
  const DATA = usePortfolio();
  const linkedin = safeUrl(DATA.linkedin);
  const github = safeUrl(DATA.github);
  const email = DATA.email?.trim();
  const first = DATA.name?.trim().split(/\s+/)[0] || "Janmenjaya";

  return (
    <footer className={`${theme.jbInk} ${styles.ftRoot}`}>
      <div className={theme.jbWrap}>
        <FooterWordmark text={first} />
        <div className={styles.ftRow}>
          <span className={styles.ftCopy} suppressHydrationWarning>
            <BrandLogo size={36} className={styles.ftLogo} />
            <span>
              © {new Date().getFullYear()} {DATA.name || "Janmenjaya Biswal"}
            </span>
          </span>
          <nav className={styles.ftLinks} aria-label="Footer">
            {github ? (
              <a href={github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            ) : null}
            {linkedin ? (
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            ) : null}
            {email ? <a href={`mailto:${email}`}>Email</a> : null}
            {/* the alternative design (/newone), offered quietly in the footer only */}
            <a href="/newone" className={styles.ftNewLook}>
              New look <span className={styles.ftNewTag}>Beta</span>
            </a>
            <button type="button" className={styles.ftReplay} onClick={() => window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))}>
              Replay intro
            </button>
          </nav>
          <a href="#hero" className={styles.ftTop}>
            Back to top <ArrowUp size={14} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
