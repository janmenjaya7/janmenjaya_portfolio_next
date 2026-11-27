import styles from "../../../styles/site/intro.module.css";

/*
  Layered night clouds. Textures are generated SVG noise (no image downloads), rasterised once by the browser
  and then only translated, so the per-frame cost is compositing. Phones/tablets drop the far layer (CSS).
  Each bank has three owners: outer (scroll timeline) → inner (pointer parallax) → ::before (slow CSS drift).
*/
export function CloudAtmosphere() {
  return (
    <div className={styles.ciAtmo} aria-hidden="true">
      <span className={styles.ciBase} data-ci-base="" />
      <span className={`${styles.ciCloud} ${styles.ciCloudFar}`} data-ci-far="">
        <span className={styles.ciCloudInner} data-ci-far-inner="" />
      </span>
      <span className={`${styles.ciCloud} ${styles.ciCloudMid}`} data-ci-mid="">
        <span className={styles.ciCloudInner} data-ci-mid-inner="" />
      </span>
      <span className={styles.ciRays} data-ci-rays="" />
      <span className={styles.ciFog} data-ci-fog="" />
      <span className={`${styles.ciFog} ${styles.ciFog2}`} data-ci-fog2="" />
      {/* warm golden mist lying along the bottom of the scene */}
      <span className={styles.ciGoldFog} data-ci-goldfog="" />
    </div>
  );
}

/* Foreground banks that gather over the document and then part onto the hero. */
export function CloudCurtain() {
  return (
    <div className={styles.ciCurtain} aria-hidden="true">
      <span className={`${styles.ciCurtainBank} ${styles.ciCurtainL}`} data-ci-fore-l="" />
      <span className={`${styles.ciCurtainBank} ${styles.ciCurtainR}`} data-ci-fore-r="" />
    </div>
  );
}

export function FilmGrain() {
  return <span className={styles.ciGrain} data-ci-grain="" aria-hidden="true" />;
}
