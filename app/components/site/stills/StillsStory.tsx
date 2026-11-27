"use client";
/*
  "Story in stills" (after the hero): six chapter images revealed one after another as you scroll.
  Tiny gate — renders nothing until `npm run stills:build` has produced all six images; the stage is its own lazily
  loaded chunk. (Independent of the video story in ../story, which stays untouched for later use.)
*/
import dynamic from "next/dynamic";
import { stillsProblem } from "../../../lib/stills";
import { STILLS_MANIFEST } from "./stillsManifest.generated";

const StillsStage = dynamic(() => import("./StillsStage"));

export default function StillsStory() {
  if (!STILLS_MANIFEST || stillsProblem(STILLS_MANIFEST) !== null) return null;
  return <StillsStage manifest={STILLS_MANIFEST} />;
}
