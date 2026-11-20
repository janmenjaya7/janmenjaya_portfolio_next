import type { Metadata } from "next";
import styles from "./_styles/admin.module.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // data-adm-root: tooltips portal here so they inherit the admin theme variables
  return (
    <div className={styles.admRoot} data-adm-root="">
      {children}
    </div>
  );
}
