import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../_styles/button.module.css";

type Variant = "primary" | "secondary" | "accent" | "tertiary";

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  /** Small trailing icon, e.g. an arrow. */
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
};

const VARIANT: Record<Variant, string> = {
  primary: styles.noBtnPrimary,
  secondary: styles.noBtnSecondary,
  accent: styles.noBtnAccent,
  tertiary: styles.noBtnTertiary,
};

/** Pill button / link following the /newone spec. External and mailto links open safely. */
export default function NoPillButton({ href, children, variant = "primary", icon, className = "", ariaLabel }: Props) {
  const cls = `${styles.noBtn} ${VARIANT[variant]} ${className}`.trim();
  const content = (
    <>
      <span className={styles.noBtnLabel}>{children}</span>
      {icon ? <span className={styles.noBtnIcon} aria-hidden="true">{icon}</span> : null}
    </>
  );

  const isExternal = /^https?:\/\//i.test(href);
  const isMail = href.startsWith("mailto:");

  if (isExternal || isMail) {
    return (
      <a
        href={href}
        className={cls}
        aria-label={ariaLabel}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}
