import type { ReactNode } from "react";
import styles from "../../styles/site/macbook.module.css";

type Props = {
  /** What appears on the screen (a screenshot, a cover, anything). */
  children: ReactNode;
  /** Address shown in the browser bar on the screen. */
  url?: string;
  className?: string;
};

/* A MacBook-style laptop drawn in CSS: bezel, camera notch, screen with a browser bar, aluminium base. */
export default function MacBook({ children, url, className = "" }: Props) {
  return (
    <div className={`${styles.mb} ${className}`.trim()}>
      <div className={styles.mbLid}>
        <span className={styles.mbCam} aria-hidden="true" />
        <div className={styles.mbScreen}>
          <div className={styles.mbBar} aria-hidden="true">
            <span className={styles.mbDots}>
              <i />
              <i />
              <i />
            </span>
            {url ? <span className={styles.mbUrl}>{url}</span> : null}
          </div>
          <div className={styles.mbView}>{children}</div>
          <span className={styles.mbGlare} aria-hidden="true" />
        </div>
      </div>
      <div className={styles.mbBase} aria-hidden="true">
        <span className={styles.mbNotch} />
      </div>
      <span className={styles.mbShadow} aria-hidden="true" />
    </div>
  );
}
