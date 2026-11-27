/* The six-scene story: words and framing only (UI lives in the components, assets in the generated manifest). */
import type { SceneId } from "../../../lib/story";

export type SceneConfig = {
  id: SceneId;
  number: string;
  /** short label for the progress indicator */
  label: string;
  /** scene title shown subtly on screen */
  title: string;
  /** the full narration (what the recording says) */
  narration: string;
  /** the short on-screen line used when narration isn't playing (sound off / no recording yet) */
  caption: string;
  /** where the character is in the frame (0–1), kept in view when the canvas crops for tall screens */
  focal: { x: number; y: number };
};

export const SCENES: SceneConfig[] = [
  {
    id: "dream",
    number: "01",
    label: "Dream",
    title: "The Dream",
    narration: "Every journey starts with a dream, and every dream begins with curiosity.",
    caption: "Every journey starts with a dream.",
    focal: { x: 0.5, y: 0.45 },
  },
  {
    id: "beginning",
    number: "02",
    label: "Beginning",
    title: "The Beginning",
    narration: "My curiosity for technology grew into a passion for building things that make a difference.",
    caption: "My curiosity for technology became a passion for building.",
    focal: { x: 0.5, y: 0.45 },
  },
  {
    id: "learning",
    number: "03",
    label: "Learning",
    title: "Learning and Growth",
    narration: "From HTML and CSS to JavaScript, React, and Next.js, every step has helped me grow as a developer.",
    caption: "Learning. Building. Improving. Growing.",
    focal: { x: 0.5, y: 0.45 },
  },
  {
    id: "projects",
    number: "04",
    label: "Projects",
    title: "Building Projects",
    narration: "I turn ideas into responsive, user-friendly digital experiences through clean design and meaningful code.",
    caption: "Turning ideas into meaningful digital experiences.",
    focal: { x: 0.5, y: 0.45 },
  },
  {
    id: "experience",
    number: "05",
    label: "Experience",
    title: "Professional Journey",
    narration: "Every project, every challenge, and every experience gives me another opportunity to learn and improve.",
    caption: "Every challenge is another opportunity to grow.",
    focal: { x: 0.5, y: 0.45 },
  },
  {
    id: "future",
    number: "06",
    label: "Future",
    title: "The Next Chapter",
    narration:
      "I'm Janmenjaya Biswal, a frontend developer passionate about creating modern web experiences. And my journey is just getting started.",
    caption: "My journey is just getting started.",
    focal: { x: 0.5, y: 0.45 },
  },
];

/** The closing card over the last frames of scene 6. */
export const FINAL_CARD = {
  name: "Janmenjaya Biswal",
  role: "Frontend Developer",
  stack: "React.js | Next.js | JavaScript",
  line: "Building experiences. Creating possibilities.",
};

/** Pinned scroll length per scene, in screen heights (the whole story ≈ 6 × this). */
export const SCREENS_PER_SCENE = { desktop: 0.8, mobile: 0.7 };
