import type { Metadata } from "next";
import styles from "./_styles/admin.module.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.admRoot}>{children}</div>;
}
