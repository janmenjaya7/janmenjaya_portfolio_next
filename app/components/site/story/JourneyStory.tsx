"use client";
/*
  The cinematic journey story (after the hero). Tiny gate: when the generated manifest is missing or incomplete (no
  real frames yet) nothing is rendered. The stage itself (canvas player, audio engine, controls) is its own lazily
  loaded chunk, so the page doesn't download any story code until real assets exist.
  (A dynamic import from a Server Component isn't code-split in this Next.js version, hence a Client Component here.)
*/
import dynamic from "next/dynamic";
import { storyVisible } from "../../../lib/story";
import { JOURNEY_MANIFEST } from "./journeyManifest.generated";

const JourneyStage = dynamic(() => import("./JourneyStage"));

export default function JourneyStory() {
  if (!JOURNEY_MANIFEST || !storyVisible(JOURNEY_MANIFEST, process.env.NODE_ENV)) return null;
  return <JourneyStage manifest={JOURNEY_MANIFEST} />;
}
