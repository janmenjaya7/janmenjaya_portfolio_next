import Image from "next/image";
import { ArrowDownRight } from "lucide-react";
import NoPillButton from "./NoPillButton";
import NoLocalTime from "./NoLocalTime";
import NoDotField from "./NoDotField";
import NoDotPortrait from "./NoDotPortrait";
import { PORTRAIT } from "../../lib/portrait";
import styles from "../_styles/hero.module.css";

type Props = {
  name: string;
  city: string;
  contactHref: string;
};

/* Site view hero: cut-out portrait centre stage, clock on the left, statement on the right. */
export default function NoHero({ name, city, contactHref }: Props) {
  return (
    <section className={styles.noHero} aria-labelledby="no-hero-title">
      <NoDotField />
      <div className={styles.noHeroSide}>
        <NoLocalTime city={city} />
      </div>

      <div className={styles.noHeroStage}>
        <NoDotPortrait src={PORTRAIT.src} />
        <Image
          src={PORTRAIT.src}
          alt={`Portrait of ${name}`}
          width={PORTRAIT.width}
          height={PORTRAIT.height}
          sizes="(max-width: 900px) 80vw, 40vw"
          fetchPriority="high"
          loading="eager"
          className={styles.noHeroPortrait}
        />
      </div>

      <div className={styles.noHeroCopy}>
        <ArrowDownRight className={styles.noHeroCue} size={26} strokeWidth={1.4} aria-hidden="true" />
        <h1 id="no-hero-title" className={styles.noHeroTitle}>
          Interfaces that feel effortless.
        </h1>
        <p className={styles.noHeroLead}>
          I build fast, scalable React &amp; Next.js products — from learning platforms used by 50,000+ learners to
          the dashboards that run them.
        </p>
        <div className={styles.noHeroActions}>
          <NoPillButton href={contactHref} variant="accent">
            Let&apos;s talk
          </NoPillButton>
          <NoPillButton href="#work" variant="tertiary" icon={<ArrowDownRight size={15} strokeWidth={1.8} />}>
            See the work
          </NoPillButton>
        </div>
      </div>
    </section>
  );
}
