import styles from "../../../styles/site/intro.module.css";

/* Archimedean spiral for the roll's end faces: the wound layers of parchment. Computed once, identical on server and client. */
const SPIRAL = (() => {
  const turns = 5;
  const steps = turns * 36;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / 36) * Math.PI * 2;
    const r = 6 + (i / steps) * 41;
    d += `${i ? "L" : "M"}${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`;
  }
  return d;
})();

const Cap = ({ side }: { side: "l" | "r" }) => (
  <span className={`${styles.ciCap} ${side === "l" ? styles.ciCapL : styles.ciCapR}`}>
    <svg viewBox="0 0 100 100" className={styles.ciCapSpiral} aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="48" className={styles.ciCapDisc} />
      <path d={SPIRAL} className={styles.ciCapLine} />
      <circle cx="50" cy="50" r="5" className={styles.ciCapCore} />
    </svg>
  </span>
);

/* Jute twine tied round the rolled document with a bow — it slips off as the visitor starts to scroll. */
const Twine = () => (
  <span className={styles.ciTwine} data-ci-twine="">
    <svg viewBox="0 0 90 110" focusable="false">
      {/* two wraps round the roll */}
      <path className={styles.ciTwineShade} d="M33 22c-2 10-2 22 0 34M55 22c2 10 2 22 0 34" />
      <path className={styles.ciTwineCord} d="M33 22c-2 10-2 22 0 34M55 22c2 10 2 22 0 34" />
      {/* bow: two loops and the knot */}
      <path className={styles.ciTwineShade} d="M44 40c-9-12-26-12-24-2s16 8 24 2zM44 40c9-12 26-12 24-2s-16 8-24 2z" />
      <path className={styles.ciTwineCord} d="M44 40c-9-12-26-12-24-2s16 8 24 2zM44 40c9-12 26-12 24-2s-16 8-24 2z" />
      {/* loose ends */}
      <path className={styles.ciTwineCord} d="M43 42c-4 10-10 19-17 28M45 42c3 11 8 21 12 31" />
      <ellipse cx="44" cy="40.5" rx="4.2" ry="3.4" className={styles.ciTwineKnot} />
    </svg>
  </span>
);

/* Peacock-head end of the bansuri (faces outwards; drawn for the left end, mirrored in CSS for the right). */
export const PeacockFinial = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 46 40" className={`${styles.ciPeacock} ${className}`.trim()} focusable="false" aria-hidden="true">
    {/* collar where it joins the flute */}
    <rect x="38" y="18" width="8" height="16" rx="2" fill="url(#ci-gold-v)" className={styles.ciFinialEdge} />
    <rect x="34.5" y="19.5" width="4" height="13" rx="1.5" fill="url(#ci-gold-v)" className={styles.ciFinialEdge} />
    {/* neck sweeping up to the head */}
    <path d="M35 21C27 21 22 19 19 14.5C17.5 12 16 10.5 13.5 10.5L13 16.5C15.5 16.5 16.8 18 18 20.5C21 27 27 31 35 31Z" fill="url(#ci-peacock)" className={styles.ciFinialEdge} />
    <path d="M33 24C27 24 23 22 20.5 18.5" className={styles.ciPeacockScales} />
    {/* head, beak, eye */}
    <ellipse cx="12.5" cy="12.5" rx="5.4" ry="4.8" fill="url(#ci-peacock)" className={styles.ciFinialEdge} />
    <path d="M7.6 11.6L1.5 13.6L7.8 14.6Z" fill="url(#ci-gold-v)" className={styles.ciFinialEdge} />
    <circle cx="11.2" cy="11.4" r="1.25" fill="#fff4d0" />
    <circle cx="11" cy="11.4" r="0.6" fill="#0b1630" />
    {/* crest: three plumes with gold tips */}
    <path d="M13 7.8L12 2.5M14.2 7.9L15.6 2.2M15.3 8.4L18.6 3.4" className={styles.ciPeacockCrest} />
    <circle cx="12" cy="2.4" r="1.25" fill="#e8c46a" />
    <circle cx="15.6" cy="2.1" r="1.25" fill="#e8c46a" />
    <circle cx="18.7" cy="3.3" r="1.25" fill="#e8c46a" />
  </svg>
);

/* Mouth end of the bansuri: gold cap and a silk cord with a tassel that sways. */
export const FluteTip = ({ className = "" }: { className?: string }) => (
  <span className={`${styles.ciFluteTip} ${className}`.trim()} aria-hidden="true">
    <svg viewBox="0 0 24 40" focusable="false">
      <rect x="0" y="18" width="7" height="16" rx="2" fill="url(#ci-gold-v)" className={styles.ciFinialEdge} />
      <rect x="7" y="19.5" width="9" height="13" rx="2" fill="url(#ci-gold-v)" className={styles.ciFinialEdge} />
      <ellipse cx="17.5" cy="26" rx="3.2" ry="5" fill="url(#ci-gold-v)" className={styles.ciFinialEdge} />
      <circle cx="20.6" cy="26" r="1.6" fill="url(#ci-gold-v)" />
    </svg>
    <span className={styles.ciTassel}>
      <svg viewBox="0 0 16 46" focusable="false">
        <path d="M8 0C8 6 8 10 8 14" className={styles.ciTasselCord} />
        <circle cx="8" cy="16" r="3.4" className={styles.ciTasselKnot} />
        <path d="M8 19L4 42M8 19L6 44M8 19L8 45M8 19L10 44M8 19L12 42" className={styles.ciTasselFringe} />
        <rect x="4.5" y="21" width="7" height="2.4" rx="1" className={styles.ciTasselBand} />
      </svg>
    </span>
  </span>
);

/* gradient defs shared by every gold piece (rendered once, inside the rod) */
const GoldDefs = () => (
  <svg width="0" height="0" className={styles.ciSvgDefs} focusable="false" aria-hidden="true">
    <defs>
      <linearGradient id="ci-gold-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a2f06" />
        <stop offset="0.2" stopColor="#c99a3c" />
        <stop offset="0.36" stopColor="#fbe6a2" />
        <stop offset="0.52" stopColor="#d9ab4f" />
        <stop offset="0.78" stopColor="#8f6420" />
        <stop offset="1" stopColor="#3d2604" />
      </linearGradient>
      <linearGradient id="ci-peacock" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2a64c4" />
        <stop offset="0.5" stopColor="#123a86" />
        <stop offset="1" stopColor="#0e6c72" />
      </linearGradient>
    </defs>
  </svg>
);

/*
  The parchment roll. It starts right under the letterhead (tied with twine), travels down as the document
  unrolls and turns exactly as far as the paper it releases (angle = distance ÷ radius), thinning on the way.
  A short gold axle shows at each end (kept tight so the roll takes no extra room beside the paper).
  Position, diameter and angle are written by the intro timeline as CSS variables — no React renders.
*/
export default function ResumeRoller() {
  return (
    <div className={styles.ciRoll} data-ci-roll="" aria-hidden="true">
      <span className={styles.ciRollShadow} />
      <span className={styles.ciAxle} data-ci-axle="" />
      <span className={styles.ciRollFace} />
      <Cap side="l" />
      <Cap side="r" />
      <Twine />
    </div>
  );
}

const HOLES = [16, 57, 62.5, 68, 74, 79.5, 85]; // blow hole + six finger holes (% along the flute)
const BINDINGS = [7, 27, 47, 93]; // silk thread wraps

/* The bansuri the sheet hangs from: engraved old gold, finger holes, silk bindings, a peacock head and a tassel. */
export function ResumeRod() {
  return (
    <span className={styles.ciRod} data-ci-rod="" aria-hidden="true">
      <GoldDefs />
      <span className={styles.ciRodBody}>
        {BINDINGS.map((at) => (
          <span key={`b${at}`} className={styles.ciBind} style={{ left: `${at}%` }} />
        ))}
        {HOLES.map((at, i) => (
          <span key={`h${at}`} className={`${styles.ciHole} ${i === 0 ? styles.ciHoleBlow : ""}`} style={{ left: `${at}%` }} />
        ))}
      </span>
      <PeacockFinial className={styles.ciEndL} />
      <FluteTip className={styles.ciEndR} />
    </span>
  );
}
