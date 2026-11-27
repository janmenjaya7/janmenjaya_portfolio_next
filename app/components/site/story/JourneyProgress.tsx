"use client";
/* 01 Dream … 06 Future — where you are in the story; each chapter is a button that scrolls to it. */
import { SCENES } from "./journeyConfig";
import styles from "../../../styles/site/story.module.css";

export default function JourneyProgress({ active, onJump }: { active: number; onJump: (scene: number) => void }) {
  return (
    <nav className={styles.syProgress} aria-label="Story chapters">
      <ol className={styles.syProgressList}>
        {SCENES.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={`${styles.syDot} ${i === active ? styles.syDotOn : ""} ${i < active ? styles.syDotPast : ""}`}
              onClick={() => onJump(i)}
              aria-current={i === active ? "step" : undefined}
            >
              <span className={styles.syDotNum}>{s.number}</span>
              <span className={styles.syDotLabel}>{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
