import type { ResumeSheet } from "../../../lib/journey";
import ResumeContent from "./ResumeContent";
import ResumeRoller, { ResumeRod } from "./ResumeRoller";
import PeacockQuill from "./PeacockQuill";
import styles from "../../../styles/site/intro.module.css";

/*
  The paper assembly, nested so each transform has one owner:
  scene (perspective) → rise (GSAP: entrance, tilt, exit) → tilt (pointer) → follow (camera keeps the roll on screen)
  → sheet (clipped to the unrolled length) + curl shadow + roll + quill.
*/
export default function ResumeScroll({ sheet, resumeHref }: { sheet: ResumeSheet; resumeHref: string | null }) {
  return (
    <div className={styles.ciScene} data-ci-scene="">
      <div className={styles.ciRise} data-ci-rise="">
        <div className={styles.ciTilt} data-ci-tilt="">
          <div className={styles.ciFollow} data-ci-follow="">
            <span className={styles.ciShadow} data-ci-shadow="" aria-hidden="true" />
            <article className={styles.ciSheet} data-ci-sheet="" aria-labelledby="ci-resume-title">
              <h2 id="ci-resume-title" className={styles.ciSr}>
                Resume of {sheet.name || "Janmenjaya Biswal"}
              </h2>
              <span className={styles.ciPaperTex} aria-hidden="true" />
              <span className={styles.ciWatermark} aria-hidden="true" />
              <ResumeContent sheet={sheet} resumeHref={resumeHref} />
              <span className={styles.ciBurn} aria-hidden="true" />
              <span className={styles.ciWarm} data-ci-warm="" aria-hidden="true" />
              <span className={styles.ciSheen} data-ci-sheen="" aria-hidden="true" />
            </article>
            <ResumeRod />
            <span className={styles.ciCurl} data-ci-curl="" aria-hidden="true" />
            <ResumeRoller />
            <PeacockQuill />
          </div>
        </div>
      </div>
    </div>
  );
}
