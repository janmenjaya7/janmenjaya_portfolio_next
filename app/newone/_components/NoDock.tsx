import Link from "next/link";
import { Code2, RotateCcw } from "lucide-react";
import styles from "../_styles/dock.module.css";

type Props = {
  githubHref: string | null;
};

/* Floating bottom dock: switch between the new site, the classic site and the intro. */
export default function NoDock({ githubHref }: Props) {
  return (
    <nav className={styles.noDock} aria-label="Switch view">
      {githubHref ? (
        <a
          href={githubHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.noDockIcon}
          aria-label="GitHub profile"
          title="GitHub"
        >
          <Code2 size={17} strokeWidth={1.7} aria-hidden="true" />
        </a>
      ) : null}

      <span className={styles.noDockSep} aria-hidden="true" />

      <span className={styles.noDockSegment}>
        <span className={`${styles.noDockItem} ${styles.noDockItemActive}`} aria-current="page">
          Site
        </span>
        <Link href="/" className={styles.noDockItem}>
          Classic
        </Link>
      </span>

      <span className={styles.noDockSep} aria-hidden="true" />

      <Link href="/newone" className={styles.noDockIcon} aria-label="Back to the intro" title="Intro">
        <RotateCcw size={16} strokeWidth={1.7} aria-hidden="true" />
      </Link>
    </nav>
  );
}
