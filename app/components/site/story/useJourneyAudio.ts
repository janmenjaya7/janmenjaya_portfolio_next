"use client";
/* Thin React wrapper around JourneyAudioEngine: one engine per manifest, attached while mounted, state mirrored. */
import { useEffect, useState } from "react";
import type { StoryManifest } from "../../../lib/story";
import { JourneyAudioEngine, type AudioState } from "./journeyAudio";

const SILENT: AudioState = { soundOn: false, paused: false, speaking: null, cue: null };

export function useJourneyAudio(manifest: StoryManifest): { engine: JourneyAudioEngine; state: AudioState } {
  // the constructor has no side effects, so creating it during render is safe (also on the server)
  const [engine] = useState(() => new JourneyAudioEngine(manifest));
  const [state, setState] = useState<AudioState>(SILENT);

  useEffect(() => {
    engine.attach(setState);
    return () => {
      engine.destroy();
      setState(SILENT);
    };
  }, [engine]);

  return { engine, state };
}
