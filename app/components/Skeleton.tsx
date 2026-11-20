import styles from "../styles/skeleton.module.css";

type BoneProps = {
  w?: number | string;
  h?: number | string;
  shape?: "rect" | "circle" | "pill";
  className?: string;
};

/* One shimmering placeholder shape */
export function Bone({ w = "100%", h = 14, shape = "rect", className = "" }: BoneProps) {
  const shapeCls = shape === "circle" ? styles.skCircle : shape === "pill" ? styles.skPill : "";
  return (
    <span
      aria-hidden="true"
      className={`${styles.skBlock} ${shapeCls} ${className}`.trim()}
      style={{ width: w, height: h }}
    />
  );
}

/* Full-page placeholder mirroring the navbar + hero layout */
export default function SiteSkeleton() {
  return (
    <div className={styles.skPage} role="status" aria-live="polite" aria-label="Loading portfolio">
      <div className={styles.skNav}>
        <Bone w={52} h={22} />
        <div className={styles.skNavLinks}>
          {[56, 44, 76, 60, 58].map((w, i) => (
            <Bone key={i} w={w} h={12} className={styles.skHideMobile} />
          ))}
          <Bone w={112} h={40} shape="pill" />
        </div>
      </div>

      <div className={styles.skHero}>
        <div className={styles.skLeft}>
          <Bone w="min(460px, 80vw)" h={64} />
          <Bone w="min(300px, 60vw)" h={64} />
          <Bone w={240} h={18} />
          <Bone w="min(520px, 85vw)" h={14} />
          <Bone w="min(480px, 80vw)" h={14} />
          <Bone w="min(400px, 70vw)" h={14} />
          <div className={styles.skRow} style={{ marginTop: "0.75rem" }}>
            <Bone w={170} h={54} shape="pill" />
            <Bone w={170} h={54} shape="pill" />
          </div>
          <div className={styles.skRow} style={{ marginTop: "0.75rem" }}>
            {[0, 1, 2, 3].map((i) => (
              <Bone key={i} w={70} h={40} />
            ))}
          </div>
        </div>
        <div className={styles.skVisual}>
          <Bone w="clamp(150px, 22vw, 280px)" h="clamp(150px, 22vw, 280px)" shape="circle" />
        </div>
      </div>
    </div>
  );
}
