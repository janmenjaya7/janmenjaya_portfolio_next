"use client";
/* Bottom-centre subtitle line: the narration cue while the voice plays, otherwise the scene's short caption. */
import styles from "../../../styles/site/story.module.css";

type Props = { cue: string | null; caption: string; speaking: boolean };

export default function JourneySubtitles({ cue, caption, speaking }: Props) {
  // while narrating, show only real cues (an empty gap between cues stays empty rather than flashing the caption)
  const text = speaking ? cue : caption;
  if (!text || !text.trim()) return null;
  return (
    <p className={styles.sySub} key={text} data-sy-sub={speaking ? "cue" : "caption"}>
      {text}
    </p>
  );
}
