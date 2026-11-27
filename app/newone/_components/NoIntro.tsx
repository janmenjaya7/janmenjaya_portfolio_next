import Link from "next/link";
import NoParticleRing from "./NoParticleRing";
import NoChoiceCard from "./NoChoiceCard";
import tokens from "../_styles/tokens.module.css";
import styles from "../_styles/intro.module.css";

type Props = {
  name: string;
  role: string;
  emailHref: string | null;
  email: string;
  linkedinHref: string | null;
};

/* /newone — the entry screen: one question, two ways in. */
export default function NoIntro({ name, role, emailHref, email, linkedinHref }: Props) {
  return (
    <main id="no-main" className={styles.noIntro}>
      <NoParticleRing />

      <header className={styles.noIntroTop}>
        <Link href="/newone" className={styles.noIntroLogo} aria-label={`${name} — home`}>
          JB<span className={styles.noIntroLogoDot}>.</span>
        </Link>
        <span className={styles.noIntroLocale}>Pune · IN</span>
      </header>

      <section className={styles.noIntroCenter} aria-labelledby="no-intro-title">
        <p className={tokens.noOverline}>
          {name} · {role}
        </p>
        <h1 id="no-intro-title" className={`${tokens.noDisplay} ${styles.noIntroTitle}`}>
          How would you like to explore my work?
        </h1>
        <nav className={styles.noChoices} aria-label="Choose a view">
          <NoChoiceCard index="01" title="The site" hint="A calm, focused tour — two minutes" href="/newone?v=site" />
          <NoChoiceCard index="02" title="The classic" hint="The full original portfolio" href="/" />
        </nav>
      </section>

      {(emailHref || linkedinHref) && (
        <footer className={styles.noIntroFoot}>
          {emailHref ? (
            <a href={emailHref} className={styles.noIntroFootLink}>
              {email}
            </a>
          ) : null}
          {emailHref && linkedinHref ? <span aria-hidden="true">·</span> : null}
          {linkedinHref ? (
            <a href={linkedinHref} target="_blank" rel="noopener noreferrer" className={styles.noIntroFootLink}>
              LinkedIn
            </a>
          ) : null}
        </footer>
      )}
    </main>
  );
}
