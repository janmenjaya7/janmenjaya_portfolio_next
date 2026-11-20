import { ArrowUpRight } from "lucide-react";
import styles from "../styles/arrowPill.module.css";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  external?: boolean;
  className?: string;
};

/* Pill link with a circular arrow badge; on hover the badge expands to fill the pill. */
export default function ArrowPillButton({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
}: Props) {
  const variantCls = variant === "ghost" ? styles.apbGhost : styles.apbPrimary;

  return (
    <a
      href={href}
      className={`${styles.apbRoot} ${variantCls} ${className}`.trim()}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className={styles.apbFill} aria-hidden="true" />
      <span className={styles.apbIcon} aria-hidden="true">
        <ArrowUpRight size={18} strokeWidth={2.25} />
      </span>
      <span className={styles.apbLabel}>{children}</span>
    </a>
  );
}
