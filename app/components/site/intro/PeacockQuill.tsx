import styles from "../../../styles/site/intro.module.css";

/*
  Mor pankh — a peacock-feather quill. Drawn upright with the nib at (30, 260); the intro timeline places the
  nib on the signature line and tilts it (transform-origin = nib). Barbs are generated once (deterministic,
  identical on server and client): longer towards the eye, angled upwards, alternating bronze / green / teal.
*/
const BARBS = (() => {
  const out: Array<{ d: string; c: number }> = [];
  for (let y = 58; y <= 226; y += 3.2) {
    const t = (y - 58) / (226 - 58); // 0 at the eye, 1 near the nib
    const len = 25 - t * 19;
    const lift = 9 + t * 4;
    const sx = 31.6 - t * 1.4; // shaft drifts slightly left towards the nib
    for (const dir of [-1, 1]) {
      const ex = sx + dir * len;
      const ey = y - lift;
      out.push({ d: `M${sx.toFixed(1)} ${y.toFixed(1)}Q${(sx + dir * len * 0.55).toFixed(1)} ${(y - lift * 0.25).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, c: Math.round(y) % 3 });
    }
  }
  return out;
})();

/* wisps above the eye */
const WISPS = Array.from({ length: 9 }, (_, i) => {
  const a = -60 + i * 15;
  const r = (a * Math.PI) / 180;
  const x = 32 + Math.sin(r) * 26;
  const y = 22 - Math.cos(r) * 20;
  return `M32 24Q${(32 + Math.sin(r) * 12).toFixed(1)} ${(24 - Math.cos(r) * 14).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
});

const BARB_CLASS = [styles.ciBarbA, styles.ciBarbB, styles.ciBarbC];

export default function PeacockQuill() {
  return (
    <span className={styles.ciQuill} data-ci-quill="" aria-hidden="true">
      <span className={styles.ciQuillBody} data-ci-quill-body="">
        <svg viewBox="0 0 64 264" focusable="false">
          <defs>
            <linearGradient id="ci-quill-shaft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e9dcc0" />
              <stop offset="0.7" stopColor="#c8b08a" />
              <stop offset="1" stopColor="#8a6a43" />
            </linearGradient>
            <radialGradient id="ci-quill-sheen" cx="0.38" cy="0.32" r="0.7">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {WISPS.map((d, i) => (
            <path key={`w${i}`} d={d} className={styles.ciWisp} />
          ))}
          {BARBS.map((b, i) => (
            <path key={i} d={b.d} className={BARB_CLASS[b.c]} />
          ))}
          {/* the eye */}
          <ellipse cx="32" cy="46" rx="22" ry="29" className={styles.ciEye1} />
          <ellipse cx="32" cy="48" rx="17" ry="23" className={styles.ciEye2} />
          <ellipse cx="32" cy="50" rx="13" ry="18" className={styles.ciEye3} />
          <ellipse cx="32" cy="52" rx="9" ry="12.5" className={styles.ciEye4} />
          <ellipse cx="32" cy="55" rx="5.2" ry="7.6" className={styles.ciEye5} />
          <ellipse cx="32" cy="46" rx="22" ry="29" fill="url(#ci-quill-sheen)" />
          {/* shaft + nib */}
          <path d="M30 258C30.6 200 32.6 120 32 14" className={styles.ciShaft} stroke="url(#ci-quill-shaft)" />
          <path d="M27.2 236L30 262L32.8 236Q30 231 27.2 236Z" className={styles.ciNib} />
          <path d="M30 244V260" className={styles.ciNibSlit} />
        </svg>
      </span>
    </span>
  );
}
