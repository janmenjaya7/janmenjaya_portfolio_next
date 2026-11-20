import styles from "../_styles/admin.module.css";
import sk from "../_styles/skeleton.module.css";

type BoneProps = { w?: number | string; h?: number | string; shape?: "rect" | "circle" | "pill"; className?: string };

function Bone({ w = "100%", h = 14, shape = "rect", className = "" }: BoneProps) {
  const shapeCls = shape === "circle" ? sk.askCircle : shape === "pill" ? sk.askPill : "";
  return <span aria-hidden="true" className={`${sk.askBone} ${shapeCls} ${className}`.trim()} style={{ width: w, height: h }} />;
}

/* Dashboard placeholder: metric tiles + storage card */
export function OverviewSkeleton() {
  return (
    <div className={styles.admOverview} role="status" aria-label="Loading dashboard">
      <section className={styles.admCard}>
        <Bone w={120} h={22} />
        <div className={sk.askMetrics} style={{ marginTop: "1.75rem" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={sk.askCol}>
              <Bone w={64} h={64} shape="circle" />
              <Bone w={90} h={16} />
              <Bone w={70} h={48} />
              <Bone w={96} h={24} shape="pill" />
            </div>
          ))}
        </div>
      </section>
      <section className={styles.admCard}>
        <Bone w={110} h={22} />
        <Bone h={52} className={sk.askWide} />
        <div className={sk.askRow} style={{ justifyContent: "space-between", marginTop: "1rem" }}>
          <div className={sk.askCol}>
            <Bone w={80} h={12} />
            <Bone w={180} h={18} />
          </div>
          <Bone w={160} h={42} />
        </div>
      </section>
    </div>
  );
}

/* Editor placeholder: header, field grid and save bar inside the editor card */
export function EditorSkeleton() {
  return (
    <section className={`${styles.admCard} ${styles.admEditorCard}`} role="status" aria-label="Loading editor">
      <div className={styles.admSectionHead}>
        <Bone w={42} h={42} shape="circle" />
        <div className={sk.askCol} style={{ flex: 1 }}>
          <Bone w={140} h={18} />
          <Bone w="min(360px, 70%)" h={12} />
        </div>
      </div>
      <div className={styles.admSectionBody}>
        <div className={sk.askFields}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={sk.askCol}>
              <Bone w={90} h={12} />
              <Bone h={44} />
            </div>
          ))}
          <div className={`${sk.askCol} ${sk.askWide}`}>
            <Bone w={110} h={12} />
            <Bone h={96} />
          </div>
        </div>
      </div>
      <div className={styles.admSaveBar} style={{ margin: "0 0.75rem 0.75rem" }}>
        <Bone w={150} h={14} />
        <div className={sk.askRow}>
          <Bone w={100} h={42} />
          <Bone w={140} h={42} />
        </div>
      </div>
    </section>
  );
}

/* Whole admin page (first load): sidebar + dashboard */
export function AdminPageSkeleton() {
  return (
    <div className={styles.admLayout}>
      <aside className={styles.admSidebar}>
        <div className={sk.askRow}>
          <Bone w={52} h={52} />
          <Bone w={70} h={16} />
        </div>
        <div className={sk.askCol} style={{ flex: 1, gap: "0.9rem", marginTop: "0.5rem" }}>
          <Bone h={44} />
          <Bone w="70%" h={20} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={sk.askRow} style={{ paddingLeft: "1.5rem" }}>
              <Bone w={32} h={32} />
              <Bone w="55%" h={14} />
            </div>
          ))}
        </div>
        <Bone h={112} />
      </aside>
      <main className={styles.admMain}>
        <Bone w="min(340px, 70%)" h={40} className={sk.askWide} />
        <div style={{ height: "1.75rem" }} />
        <OverviewSkeleton />
      </main>
    </div>
  );
}

/* Login card placeholder */
export function LoginSkeleton() {
  return (
    <div className={sk.askLoginPage} role="status" aria-label="Loading login">
      <div className={sk.askLoginCard}>
        <Bone w={56} h={56} shape="circle" />
        <Bone w={190} h={30} />
        <Bone w="85%" h={14} />
        <Bone w={60} h={12} />
        <Bone h={48} />
        <Bone h={50} />
      </div>
    </div>
  );
}
