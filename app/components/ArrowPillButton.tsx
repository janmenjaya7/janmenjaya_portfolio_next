import { ArrowUpRight } from "lucide-react";
import styles from "../styles/arrowPill.module.css";

type CommonProps = {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "sm";
  className?: string;
};

type LinkProps = CommonProps & { href: string; external?: boolean };
type ButtonProps = CommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

/* Pill link/button with a circular arrow badge. Hover: the badge fills the pill,
   the arrow flies out and back in, and a light shine sweeps across. */
export default function ArrowPillButton(props: LinkProps | ButtonProps) {
  const { children, variant = "primary", size = "md", className = "" } = props;
  const cls = [
    styles.apbRoot,
    variant === "ghost" ? styles.apbGhost : styles.apbPrimary,
    size === "sm" ? styles.apbSm : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const iconSize = size === "sm" ? 15 : 18;

  const inner = (
    <>
      <span className={styles.apbFill} aria-hidden="true" />
      <span className={styles.apbShine} aria-hidden="true" />
      <span className={styles.apbIcon} aria-hidden="true">
        <ArrowUpRight size={iconSize} strokeWidth={2.25} className={styles.apbArrowOut} />
        <ArrowUpRight size={iconSize} strokeWidth={2.25} className={styles.apbArrowIn} />
      </span>
      <span className={styles.apbLabel}>{children}</span>
    </>
  );

  if (props.href !== undefined) {
    return (
      <a
        href={props.href}
        className={cls}
        {...(props.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type={props.type ?? "button"} className={cls} disabled={props.disabled} onClick={props.onClick}>
      {inner}
    </button>
  );
}
