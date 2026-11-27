"use client";
/* Story controls: sound, subtitles, pause and replay. Sound is off until the visitor asks for it (autoplay rules). */
import { Pause, Play, RotateCcw, Subtitles, Volume2, VolumeX } from "lucide-react";
import styles from "../../../styles/site/story.module.css";

type Props = {
  hasAudio: boolean;
  soundOn: boolean;
  paused: boolean;
  subtitlesOn: boolean;
  onSound: (on: boolean) => void;
  onSubtitles: (on: boolean) => void;
  onPause: () => void;
  onReplay: () => void;
};

export default function JourneyControls({ hasAudio, soundOn, paused, subtitlesOn, onSound, onSubtitles, onPause, onReplay }: Props) {
  return (
    <div className={styles.syControls} role="group" aria-label="Story controls">
      {hasAudio && !soundOn && (
        <button type="button" className={`${styles.syBtn} ${styles.syBtnPrompt}`} onClick={() => onSound(true)}>
          <Volume2 aria-hidden="true" size={16} />
          <span className={styles.syPromptLong}>Enable sound to hear my story</span>
          <span className={styles.syPromptShort}>Hear my story</span>
        </button>
      )}
      {hasAudio && soundOn && (
        <>
          <button type="button" className={styles.syBtn} onClick={() => onSound(false)} aria-label="Turn sound off" title="Sound off">
            <VolumeX aria-hidden="true" size={16} />
          </button>
          <button type="button" className={styles.syBtn} onClick={onPause} aria-pressed={paused} aria-label={paused ? "Resume narration" : "Pause narration"} title={paused ? "Resume" : "Pause"}>
            {paused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
          </button>
        </>
      )}
      <button
        type="button"
        className={`${styles.syBtn} ${subtitlesOn ? styles.syBtnOn : ""}`}
        onClick={() => onSubtitles(!subtitlesOn)}
        aria-pressed={subtitlesOn}
        aria-label="Subtitles"
        title={subtitlesOn ? "Hide subtitles" : "Show subtitles"}
      >
        <Subtitles aria-hidden="true" size={16} />
      </button>
      <button type="button" className={styles.syBtn} onClick={onReplay} aria-label="Replay story" title="Replay story">
        <RotateCcw aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
