"use client";
import { useSyncExternalStore } from "react";
import { formatClock } from "../_lib/newone-utils";
import styles from "../_styles/hero.module.css";

const TIME_ZONE = "Asia/Kolkata";

/* A minute-ticking clock store. The server snapshot is null so the first paint never mismatches. */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
}
const getSnapshot = () => formatClock(new Date(), TIME_ZONE);
const getServerSnapshot = () => null;

type Props = { city: string };

export default function NoLocalTime({ city }: Props) {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className={styles.noClock}>
      <span className={styles.noClockOrb} aria-hidden="true">
        <span className={styles.noClockOrbCore} />
      </span>
      <span className={styles.noClockText}>
        <span className={styles.noClockCity}>
          {city}
          <time className={styles.noClockTime} suppressHydrationWarning>
            {time ?? "--:--"}
          </time>
        </span>
        <span className={styles.noClockSub}>IST · working with teams worldwide</span>
      </span>
    </div>
  );
}
