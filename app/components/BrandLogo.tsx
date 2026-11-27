import Image from "next/image";
import styles from "../styles/brand.module.css";

type Props = {
  /** rendered size in CSS pixels (square) */
  size?: number;
  className?: string;
};

/* The JK monogram (navy, royal-blue enamel, gold, peacock feather) in a rounded tile with a softly glowing gold edge.
   Two layers: the monogram, and the peacock feather on top so it can float gently (still for reduced motion).
   Together they look exactly like the original logo. Decorative next to visible text, so the alt is empty. */
export default function BrandLogo({ size = 52, className }: Props) {
  const res = size > 80 ? 320 : 160;
  return (
    <span className={`${styles.brLogo}${className ? ` ${className}` : ""}`} style={{ width: size, height: size }} aria-hidden="true">
      <Image src={`/brand/jk-monogram-base-${res}.webp`} alt="" width={size} height={size} className={styles.brLogoImg} priority unoptimized />
      <Image
        src={`/brand/jk-feather-${res}.webp`}
        alt=""
        width={size}
        height={size}
        className={`${styles.brLogoImg} ${styles.brFeather}`}
        priority
        unoptimized
      />
    </span>
  );
}
