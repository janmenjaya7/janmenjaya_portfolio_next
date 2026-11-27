# Story in stills: image kit

This is the "my story in six chapters" section that comes after the hero. One image per chapter is revealed as the visitor scrolls: each image zooms slowly, then dissolves into the next, with the chapter text alongside.

It is separate from the video story (`docs/journey-production-kit.md`, `app/components/site/story/`), which stays in place for later use.

## What's live now (option A)

The six images are cut from your character reference sheet:

| Chapter | Image |
| --- | --- |
| 01 The Dream | thinking, hand on chin |
| 02 The Beginning | focused on a laptop |
| 03 Learning and Growth | standing, three-quarter view |
| 04 Building Projects | standing, facing forward |
| 05 Professional Journey | raised fist, smiling |
| 06 The Next Chapter | big smiling portrait, followed by the name card |

The expression panels on the sheet are small (about 240 px wide), so they are enlarged and look slightly soft on big screens. Real scene images will look sharper.

## Upgrade: real scene images (option B)

Generate six **still images** in an AI image tool such as ChatGPT, Midjourney, Leonardo or Ideogram:
- Attach your character sheet as the reference in every prompt so your face stays consistent.
- Use a **portrait 4:5 or 3:4 format, about 1200×1500 px or larger**.
- Keep the scenes dark and moody so they blend with the site's near-black background. Use warm gold light as the accent.
- Don't include any text in the images.

| File | Prompt (attach the character sheet) |
| --- | --- |
| `scene-01` | The same person from the reference, sitting by a bedroom window at night, looking up at a sky full of soft glowing stars with a curious, hopeful smile. A laptop glows faintly on the desk. Cinematic, cool blue moonlight with warm lamp light, dark background, stylised 3D render. |
| `scene-02` | The same person opening a laptop in a dark room for the first time. Lines of code reflect on their face, with a focused and excited expression. Warm screen glow, dark surroundings, stylised 3D render. |
| `scene-03` | The same person at a desk surrounded by floating translucent symbols: HTML, CSS, JavaScript, the React atom and Next.js. They study with growing confidence. Soft blue and gold light, dark background, stylised 3D render. |
| `scene-04` | The same person standing in front of a large holographic interface, arranging responsive website layouts (desktop, tablet and phone frames) with hand gestures. Creative and satisfied. Dark studio, glowing UI light, stylised 3D render. |
| `scene-05` | The same person in a modern office at golden hour, presenting a dashboard on a big screen to a small team who are nodding. Confident and professional, with warm light, stylised 3D render. |
| `scene-06` | The same person on a rooftop at sunrise overlooking a city, turned towards the camera with a calm, confident smile. Hopeful and cinematic with a warm gold sunrise and a darker foreground, stylised 3D render. |

## Publishing new images

1. Save them as `story-stills-src/scene-01.png` to `scene-06.png` (`.jpg` and `.webp` also work), replacing the crops. This folder is ignored by git.
2. Optionally, update the screen-reader descriptions in `story-stills-src/alt.json`.
3. Run:

```bash
npm run stills:build    # optimises to WebP (large + small) and switches the section on
npm run build           # check the production build
```

Commit `public/story-stills/` and `app/components/site/stills/stillsManifest.generated.ts`.

You can replace just one or two images: drop the new files in and rebuild.

## Other commands

```bash
npm run stills:crop             # re-cut the crops from story-stills-src/character-sheet.png (keeps existing images)
npm run stills:crop -- --force  # re-cut and overwrite the scene images
npm run stills:clean            # remove the section from the site
```

The chapter titles and text come from `app/components/site/story/journeyConfig.ts`, the same wording as the video story.
