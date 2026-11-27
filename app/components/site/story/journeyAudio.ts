/*
  Narration + background music engine for the journey story (plain TypeScript, no React — the hook only mirrors its state).
  - nothing plays until the visitor turns sound on (browser autoplay rules)
  - one narration per scene, started only after the scene has held for a moment; a narrated scene never repeats on
    small scrolls; the previous narration fades out first, so two voices never overlap
  - narration plays at normal speed (never stretched to the scroll); music loops quietly and dips under the voice
  - everything pauses when the story leaves the screen or the tab is hidden, and resumes when it comes back
  - subtitles follow the narration's real playback time (WebVTT), not the scroll position
*/
import { cueAt, narrationFor, parseVtt, type Cue, type StoryManifest } from "../../../lib/story";

export type AudioState = { soundOn: boolean; paused: boolean; speaking: number | null; cue: string | null };

const MUSIC_VOLUME = 0.16;
const MUSIC_UNDER_VOICE = 0.07;
const SETTLE_MS = 450; // a scene must hold this long before its narration starts (fast scrolling stays quiet)
const FADE_MS = 320;
const BASE = "/journey/audio/";

function fade(el: HTMLAudioElement, to: number, ms = FADE_MS): Promise<void> {
  return new Promise((resolve) => {
    const from = el.volume;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      el.volume = Math.min(1, Math.max(0, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export class JourneyAudioEngine {
  private voice: HTMLAudioElement | null = null;
  private music: HTMLAudioElement | null = null;
  private playing: number | null = null;
  private narrated = new Set<number>();
  private cues = new Map<number, Cue[]>();
  private where = { scene: 0, inView: false };
  private settle = 0;
  private raf = 0;
  private state: AudioState = { soundOn: false, paused: false, speaking: null, cue: null };
  private destroyed = true;
  private emit: (s: AudioState) => void = () => {};

  /** no side effects here (safe during server render); audio elements are created only when sound is used */
  constructor(private manifest: StoryManifest) {}

  /** start listening (called from an effect); can be called again after destroy() — e.g. React Strict Mode */
  attach(emit: (s: AudioState) => void) {
    this.emit = emit;
    this.destroyed = false;
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  /** the scene the engine last heard about */
  get scene(): number {
    return this.where.scene;
  }

  get hasAudio(): boolean {
    return !!this.manifest.music || this.manifest.scenes.some((s) => s.narration);
  }

  private set(patch: Partial<AudioState>) {
    const next = { ...this.state, ...patch };
    if (next.soundOn === this.state.soundOn && next.paused === this.state.paused && next.speaking === this.state.speaking && next.cue === this.state.cue) return;
    this.state = next;
    if (!this.destroyed) this.emit(next);
  }

  private get active(): boolean {
    return this.state.soundOn && !this.state.paused && this.where.inView;
  }

  private async loadCues(s: number) {
    const file = this.manifest.scenes[s]?.subtitles;
    if (!file || this.cues.has(s)) return;
    this.cues.set(s, []);
    try {
      const res = await fetch(`/journey/subtitles/${file}`);
      if (res.ok) this.cues.set(s, parseVtt(await res.text()));
    } catch {
      /* a missing/broken file just means no subtitles for this scene */
    }
  }

  private tick = () => {
    this.raf = 0;
    const el = this.voice;
    if (!el || this.playing === null) return;
    this.set({ cue: cueAt(this.cues.get(this.playing) ?? [], el.currentTime)?.text ?? null });
    if (!el.paused) this.raf = requestAnimationFrame(this.tick);
  };

  private async stopVoice() {
    const el = this.voice;
    this.playing = null;
    this.set({ speaking: null, cue: null });
    cancelAnimationFrame(this.raf);
    if (el && !el.paused) {
      await fade(el, 0);
      el.pause();
    }
    if (this.music && this.active) void fade(this.music, MUSIC_VOLUME, 600);
  }

  private async startVoice(s: number) {
    await this.stopVoice(); // never two voices at once
    const file = this.manifest.scenes[s]?.narration;
    if (!file || !this.state.soundOn || this.destroyed) return;
    void this.loadCues(s);
    const el = this.voice ?? new Audio();
    this.voice = el;
    el.preload = "auto";
    el.src = `${BASE}${file}`;
    el.volume = 1;
    el.playbackRate = 1; // never stretched to match the scroll
    el.onended = () => {
      if (this.playing !== s) return;
      this.playing = null;
      this.set({ speaking: null, cue: null });
      if (this.music && this.active) void fade(this.music, MUSIC_VOLUME, 800);
    };
    el.onerror = () => {
      if (this.playing !== s) return;
      this.playing = null;
      this.set({ speaking: null, cue: null });
    };
    this.narrated.add(s); // scrolling back to this scene won't repeat it
    this.playing = s;
    this.set({ speaking: s });
    if (this.music) void fade(this.music, MUSIC_UNDER_VOICE, 400);
    try {
      await el.play();
      this.raf = requestAnimationFrame(this.tick);
    } catch {
      // blocked or failed: stay silent, no error for the visitor
      if (this.playing === s) {
        this.playing = null;
        this.set({ speaking: null });
      }
    }
  }

  private async syncMusic() {
    if (!this.manifest.music) return;
    if (this.active) {
      if (!this.music) {
        this.music = new Audio(`${BASE}${this.manifest.music}`);
        this.music.loop = true;
        this.music.volume = 0;
      }
      const el = this.music;
      if (el.paused) {
        try {
          await el.play();
        } catch {
          return;
        }
      }
      void fade(el, this.playing !== null ? MUSIC_UNDER_VOICE : MUSIC_VOLUME, 900);
    } else if (this.music && !this.music.paused) {
      const el = this.music;
      await fade(el, 0, 500);
      if (!this.active) el.pause();
    }
  }

  private decide() {
    window.clearTimeout(this.settle);
    const { scene, inView } = this.where;
    const action = narrationFor({
      scene,
      soundOn: this.state.soundOn && !this.state.paused,
      inView,
      narrated: this.narrated,
      playing: this.playing,
      hasAudio: (i) => !!this.manifest.scenes[i]?.narration,
    });
    if (action.type === "stop") void this.stopVoice();
    if (action.type === "start") this.settle = window.setTimeout(() => void this.startVoice(action.scene), SETTLE_MS);
  }

  /** where the visitor is: the active scene and whether the story is on screen */
  update(scene: number, inView: boolean) {
    if (scene === this.where.scene && inView === this.where.inView) return;
    this.where = { scene, inView };
    if (inView) void this.loadCues(scene);
    this.decide();
    void this.syncMusic();
  }

  setSound(on: boolean) {
    if (on) this.narrated.delete(this.where.scene); // "narrate from here": the current scene gets its narration
    this.set({ soundOn: on, paused: false });
    if (!on) void this.stopVoice();
    this.decide();
    void this.syncMusic();
  }

  togglePause() {
    const paused = !this.state.paused;
    this.set({ paused });
    const el = this.voice;
    if (paused) {
      el?.pause();
      cancelAnimationFrame(this.raf);
    } else if (el && this.playing !== null && el.paused && !el.ended) {
      void el.play().then(() => (this.raf = requestAnimationFrame(this.tick))).catch(() => {});
    } else {
      this.decide();
    }
    void this.syncMusic();
  }

  /** forget which scenes were narrated (Replay story) */
  reset() {
    this.narrated.clear();
    void this.stopVoice();
  }

  private onVisibility = () => {
    if (document.hidden) {
      this.voice?.pause();
      this.music?.pause();
    } else if (this.active) {
      if (this.voice && this.playing !== null && !this.voice.ended) void this.voice.play().catch(() => {});
      void this.syncMusic();
    }
  };

  destroy() {
    this.destroyed = true;
    this.playing = null;
    this.narrated.clear();
    this.where = { scene: 0, inView: false };
    this.state = { soundOn: false, paused: false, speaking: null, cue: null };
    window.clearTimeout(this.settle);
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVisibility);
    for (const el of [this.voice, this.music]) {
      if (!el) continue;
      el.pause();
      el.onended = null;
      el.onerror = null;
      el.removeAttribute("src");
      el.load();
    }
    this.voice = this.music = null;
  }
}
