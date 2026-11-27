# Journey story: production kit

The site already contains the whole story engine: scroll-driven playback, narration, subtitles, music, controls, a mobile layout, a reduced-motion version and the fallbacks.

What it does **not** contain is the media. The 3D frames, the voice and the music have to be made in external tools. Until real assets are built, the story section is not rendered at all, so the live site never shows placeholders.

This document covers what to make, how to export it and the one command that publishes it.

**Preview the story before the renders exist:**

```bash
npm run journey:preview    # labelled test frames, quiet test tones, subtitles from the real narration text
npm run dev                # scroll past the hero
npm run journey:clean      # remove the preview before committing
```

A preview only shows in development. Production builds ignore it, so test frames can never reach the live site.

---

## 1. What you need to produce

| Asset | Count | Format | Required? |
| --- | --- | --- | --- |
| Image sequence per scene | 6 folders, **48–72 frames each** | PNG, JPG or WebP, **16:9**, ideally 1920×1080 | **Yes.** All six are needed, or the story stays hidden. |
| Narration per scene | 6 files | MP3 (recommended), M4A, OGG or WAV | Optional. Without it the story runs silent, with captions. |
| Subtitles per scene | 6 files | WebVTT (`.vtt`) or SRT (`.srt`) | Optional. Recommended whenever narration exists. |
| Background music | 1 loopable file | MP3 (recommended) | Optional |
| Poster | 1 image | WebP, PNG or JPG, 16:9 | Optional. Defaults to the first frame of scene 1. |

**Frame budget.** The pipeline writes each frame at 1600×900 for desktop (about 60–100 KB) and 800×450 for mobile (about 20–30 KB). Visitors only download the frames near where they are scrolling.

At 60 frames per scene, a visitor who scrolls the entire story downloads roughly:
- about **30 MB on desktop**
- about **9 MB on mobile**

Do not go above about 72 frames per scene.

---

## 2. Character reference sheet

Generate this first, then attach it to every scene prompt so the character stays consistent. Use your own photo as the reference (for example `public/newone/janmenjaya-portrait.webp`).

> Stylised 3D animated character reference sheet based on the attached photo: the same person, with the same face shape, hair, skin tone and features as the reference, and a friendly, confident expression. Modern premium 3D animation style (soft subsurface skin, stylised proportions, not photoreal, not cartoonish). Outfit: dark navy hoodie over a plain tee, dark trousers, white sneakers. Turnaround: front, three-quarter, side, back, plus three expressions (curious, focused, proud). Neutral grey background, even studio lighting, consistent proportions across all views. No text, no logos, no watermark.

---

## 3. Scenes (image-to-video prompts)

Render each scene as **one continuous shot** with the camera moving slowly and smoothly. Each shot is long enough for its narration line to be spoken at a natural pace:

| Scene | Clip length | Narration needs |
| --- | --- | --- |
| 01 `dream` | 6 s | ~5.5 s |
| 02 `beginning` | 8 s | ~7 s |
| 03 `learning` | 10 s | ~8.5 s |
| 04 `projects` | 10 s | ~8 s |
| 05 `experience` | 10 s | ~8 s |
| 06 `future` | 12 s (or two linked shots) | ~10.5 s |

If your tool can't make clips this long (some stop at 8 s), use its longest option or extend the clip. On the site the voice is a separate audio file, so a slightly shorter clip still works.

- **Use:** 16:9, 24 fps, no cuts, no on-screen text.
- **Keep the character near the centre of the frame.** On tall phone screens the site crops the sides around each scene's focal point, which is set in `app/components/site/story/journeyConfig.ts`.
- **Colour:** a palette that sits well on the site's near-black ink (`#0b0e13`) with warm gold accents (`#d9b46a`).

Attach the character sheet to each prompt and paste the whole block. The timed beats follow the narration line; treat them as a guide, since video tools don't hit exact seconds.

### 01 `dream` (6 s)

```text
6-second continuous shot, 16:9, stylised premium 3D animation, same character as the attached reference sheet (same face, hair, navy hoodie). No cuts, no text.
Night. The character sits by a bedroom window, looking up at a sky full of soft glowing stars. A laptop glows faintly on the desk beside them.
0–3 s: slow push-in from behind the character's shoulder towards the window; a few stars twinkle.
3–6 s: the camera settles; the character tilts their head slightly, curious, and the laptop glow gets a little warmer.
Mood: calm, wondering. Light: cool blue moonlight with warm lamp light. Smooth, slow camera; character centred.
```

### 02 `beginning` (8 s)

```text
8-second continuous shot, 16:9, stylised premium 3D animation, same character as the attached reference sheet. No cuts, no text.
A dark room. The character opens the laptop for the first time.
0–3 s: the lid opens; warm screen light spreads across their face.
3–6 s: lines of code appear on the screen and their glow reflects in the character's eyes; they lean in with a small excited smile.
6–8 s: slow orbit finishes in front of the character, who starts typing.
Mood: curious, excited. Light: warm screen glow in a dark room. Smooth, slow orbit from the side to the front; character centred.
```

### 03 `learning` (10 s)

```text
10-second continuous shot, 16:9, stylised premium 3D animation, same character as the attached reference sheet. No cuts, no text, symbols are icons only (no readable words).
The character studies at a desk, surrounded by floating translucent tech symbols that drift past one after another:
0–2 s: HTML and CSS symbols glow and float by.
2–5 s: a JavaScript symbol appears; the character focuses, taking notes.
5–8 s: the React atom spins up beside them, then the Next.js symbol.
8–10 s: the character sits back with a confident nod as all the symbols orbit gently around them.
Camera: slow sideways dolly across the whole shot. Mood: focused, growing confidence, a montage feel in one continuous shot. Warm desk light with soft blue holographic glow.
```

### 04 `projects` (10 s)

```text
10-second continuous shot, 16:9, stylised premium 3D animation, same character as the attached reference sheet. No cuts, no readable text.
The character stands in front of a large holographic interface and builds web layouts with hand gestures.
0–3 s: the character raises a hand and a desktop website frame forms in the air.
3–6 s: with a swipe, matching tablet and phone frames appear and the layout reflows to fit each one.
6–10 s: all three frames snap neatly into place side by side and glow softly; the character steps back, satisfied.
Camera: slow crane up across the whole shot. Mood: creative, satisfying. Light: dark space with gold and soft cyan holographic glow.
```

### 05 `experience` (10 s)

```text
10-second continuous shot, 16:9, stylised premium 3D animation, same character as the attached reference sheet. No cuts, no readable text.
A modern office or studio at golden hour, warm sunlight through large windows.
0–3 s: the character works with two teammates at a big screen, pointing at a dashboard of charts.
3–7 s: the character turns and presents the dashboard to a small team; they listen and nod.
7–10 s: a teammate gives a friendly approving gesture; the character smiles, confident and relaxed.
Camera: slow tracking shot moving alongside the group. Mood: professional, warm, confident. Teammates are simple stylised background characters; the main character stays centred.
```

### 06 `future` (12 s)

```text
12-second continuous shot, 16:9, stylised premium 3D animation, same character as the attached reference sheet. No cuts, no text.
Sunrise over a city.
0–4 s: the character walks out onto a rooftop terrace as the sun rises over the skyline.
4–7 s: they stop at the edge and look out over the city, warm gold light on their face.
7–12 s: they turn to the camera with a calm, confident smile while the camera slowly pulls back. In this last part, keep the centre of the frame calm and fairly dark (soft sky, no busy detail), leaving space for a title card.
Mood: hopeful, cinematic. Light: warm gold sunrise. Slow, smooth pull-back.
```

**Scene 06:** the final card ("Janmenjaya Biswal · Frontend Developer …") fades in over the second half of this scene, centred, which is why the last part of the prompt keeps the centre calm.

**If your tool stops at 8 s:** use 8 s for scenes 03–06 and drop the last beat of each prompt. For scene 06 you can instead make two 6 s clips (0–6 s and 6–12 s), starting the second from the last frame of the first so they join seamlessly.

---

## 4. Narration

Record or generate one file per scene with the same voice throughout. The text below is the copy in `journeyConfig.ts`; if you change one, change the other.

Spoken lengths assume a natural pace of about 4 syllables per second, plus a short breath at each end. Each fits inside its scene's clip length (see section 3).

| File | Script | Spoken length | Clip |
| --- | --- | --- | --- |
| `narration-scene-01` | Every journey starts with a dream, and every dream begins with curiosity. | ~5.5 s | 6 s |
| `narration-scene-02` | My curiosity for technology grew into a passion for building things that make a difference. | ~7 s | 8 s |
| `narration-scene-03` | From HTML and CSS to JavaScript, React, and Next.js, every step has helped me grow as a developer. | ~8.5 s | 10 s |
| `narration-scene-04` | I turn ideas into responsive, user-friendly digital experiences through clean design and meaningful code. | ~8 s | 10 s |
| `narration-scene-05` | Every project, every challenge, and every experience gives me another opportunity to learn and improve. | ~8 s | 10 s |
| `narration-scene-06` | I'm Janmenjaya Biswal, a frontend developer passionate about creating modern web experiences. And my journey is just getting started. | ~10.5 s | 12 s |

**Prompt for an AI voice or a voice artist** (paste one line at a time):

> Read this line in a warm, calm, confident voice, like talking to a friend, not an announcer. Natural pace with natural pauses at the commas, not rushed. Leave a short breath before and after. Line: "[paste the script here]"

**Voice settings**
- Warm, calm and confident, conversational rather than announcer-like.
- Natural pace (about 140–150 words per minute) with natural pauses. Never speed up a take to make it fit; make the clip longer instead.
- Each recording should be no longer than its scene's clip (6–12 s), with about 0.3 s of silence at the start and end.
- Normalise to about −16 LUFS and export MP3 at 128 kbps mono.
- If you use an AI voice, use your own cloned voice or a stock voice you are licensed to use.

**Playback behaviour** (already built in)
- Nothing plays until the visitor presses **Enable sound**.
- Each scene's narration starts after the visitor settles on that scene, and plays at normal speed.
- A scene is never narrated twice when scrolling back and forth.
- A new narration fades the previous one out first, so two voices never overlap.

## 5. Subtitles

Write one file per scene, with timings relative to the start of that scene's narration. Split each line at a natural pause, with two cues per scene (three for scene 06), and keep each cue to two short lines or fewer.

```
WEBVTT

00:00:00.300 --> 00:00:02.600
Every journey starts with a dream,

00:00:02.600 --> 00:00:05.400
and every dream begins with curiosity.
```

When narration is off, the site shows each scene's short caption from `journeyConfig.ts` instead.

## 6. Background music

- **Mood:** ambient and cinematic: soft piano or felt keys over a warm pad, light strings rising gently in scene 06.
- **Constraints:** no vocals, no strong beat, nothing that fights the voice.
- **File:** 60–120 s, loops seamlessly, normalised to about −20 LUFS, MP3 at 128 kbps stereo.
- **Levels on the site:** 16% volume, dipping to 7% under narration.
- **Licence:** use a track you own or that is licensed for website use. Keep the licence on file.

---

## 7. Exporting frames from your rendered videos

Most AI and 3D tools export MP4. Turn each clip into numbered frames with any of these:

- **ffmpeg** (not installed on this machine yet; install it with `winget install Gyan.FFmpeg`):
  ```
  ffmpeg -i dream.mp4 -vf "fps=10,scale=1920:-1" journey-src/dream/frame%03d.png
  ```
  Pick the fps so each scene stays within 48–72 frames (about 64 ÷ clip length):

  | Clip length | fps | Frames |
  | --- | --- | --- |
  | 6 s | `fps=10` | 60 |
  | 8 s | `fps=8` | 64 |
  | 10 s | `fps=6` | 60 |
  | 12 s | `fps=5` | 60 |

  Scrolling still looks smooth, because the site plays frames by scroll position, not by time.
- **DaVinci Resolve** (free): Deliver → Custom → Format "PNG", Render "Individual clips" … or "Single clip" as an image sequence.
- **Blender:** set the Output Properties file format to PNG and render the animation.

Frame file names can be anything; they are sorted naturally, so `frame2` comes before `frame10`.

## 8. Folder layout and publishing

`journey-src/` is listed in `.gitignore`, so the large source files are never committed.

```
journey-src/
  dream/  beginning/  learning/  projects/  experience/  future/   ← frames
  audio/      narration-scene-01.mp3 … narration-scene-06.mp3, background-music.mp3
  subtitles/  scene-01.vtt … scene-06.vtt   (or .srt)
  poster.webp                               (optional)
```

Then run:

```
npm run journey:build          # or: npm run journey:build -- --src D:/renders/journey
npm run build                  # check the production build
```

`journey:build`:
- checks every scene (each needs at least 2 frames and warns about mixed sizes)
- writes optimised WebP frames, audio, WebVTT subtitles and the poster to `public/journey/`
- regenerates `app/components/site/story/journeyManifest.generated.ts`

The story section then appears after the hero. Commit `public/journey/` and the generated manifest together.

To take the story off the site again:

```
npm run journey:clean
```

## 9. Checklist before publishing

- [ ] The character looks the same in all six scenes.
- [ ] Every scene is one continuous shot with no cuts or text, and the character is near the centre.
- [ ] Each scene has 48–72 frames, all at the same 16:9 size.
- [ ] The narration matches `journeyConfig.ts` and the subtitles match the narration timing.
- [ ] Licences for the music and the voice are on file.
- [ ] `npm run journey:build` and `npm run build` both succeed.
- [ ] Scroll the story on a phone and on a desktop, and test it with sound on.
