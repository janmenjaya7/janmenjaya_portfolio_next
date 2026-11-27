import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import styles from "../_styles/intro.module.css";

type Props = {
  index: string;
  title: string;
  hint: string;
  href: string;
};

/* Numbered choice card: small marker, bold short title, lighter supporting line, arrow cue. */
export default function NoChoiceCard({ index, title, hint, href }: Props) {
  return (
    <Link href={href} className={styles.noChoice}>
      <span className={styles.noChoiceIndex}>{index}</span>
      <span className={styles.noChoiceText}>
        <span className={styles.noChoiceTitle}>{title}</span>
        <span className={styles.noChoiceHint}>{hint}</span>
      </span>
      <ArrowDownRight className={styles.noChoiceArrow} size={18} strokeWidth={1.6} aria-hidden="true" />
    </Link>
  );
}
