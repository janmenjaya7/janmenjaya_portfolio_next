/*
  The intro's one scroll-scrubbed GSAP timeline. Everything — the name leaving, the twine slipping off, the unroll,
  the peacock quill signing, the wax seal, the clouds parting — is a function of ScrollTrigger progress, so
  scrolling back reverses it exactly. No React state is touched per frame; dispose() reverts everything.
*/
import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import { PHASE, currentSection, paperFrame, quillPoint, railFill, sectionReveal, toRoman, unrollForOpen, type PaperMetrics } from "../../../lib/intro";

type Hooks = {
  /** the clouds are opening onto the hero: let its entrance play */
  onHeroCue: () => void;
  /** the visitor reached the end: remember it for this browsing session */
  onComplete: () => void;
};

const span = ([a, b]: readonly [number, number]) => b - a;

export type IntroControls = {
  /** after a programmatic jump (Skip): apply the new scroll position now, without the scrub's catch-up animation */
  settle: () => void;
  /** scroll to where chapter `i` is being read (rail numerals, the "scroll to discover" seal) */
  goToChapter: (i: number) => void;
  /** revert every tween, listener and inline style */
  dispose: () => void;
};

const NOOP: IntroControls = { settle: () => {}, goToChapter: () => {}, dispose: () => {} };

/* sign phase, as shares of the whole scroll */
const SIGN = {
  quillIn: 0.7,
  write: [0.712, 0.79] as const,
  quillOut: 0.79,
  seal: 0.796,
};

/** position of `el` inside `ancestor` (sum of offsets; ignores transforms) */
function offsetIn(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== ancestor) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

export function createIntroTimeline(root: HTMLElement, gsap: typeof Gsap, ScrollTrigger: typeof ScrollTriggerType, hooks: Hooks): IntroControls {
  const q = (sel: string) => root.querySelector<HTMLElement>(`[data-ci-${sel}]`);
  const stage = q("stage");
  const rise = q("rise");
  const follow = q("follow");
  const sheet = q("sheet");
  const mast = q("mast");
  const roll = q("roll");
  const curl = q("curl");
  const shadow = q("shadow");
  if (!stage || !rise || !follow || !sheet || !mast || !roll || !curl || !shadow) return NOOP;

  const sections = [...root.querySelectorAll<HTMLElement>("[data-ci-section]")];
  const marks = [...root.querySelectorAll<HTMLElement>("[data-ci-mark]")];
  const count = q("count");
  const label = q("label");
  const bar = q("bar");
  const signature = q("signature");
  const quill = q("quill");
  const quillBody = q("quill-body");
  const seal = q("seal");
  const twine = q("twine");

  const m: PaperMetrics = { height: 0, openAtStart: 0, viewport: 0, sheetTop: 0, followLine: 0.76, rollFrom: 54, rollTo: 28 };
  let tops: number[] = [];
  let chapterAt: number[] = []; // whole-scroll progress (0–1) where each chapter is being read
  let sigBox = { x: 0, y: 0, w: 0, h: 0 };
  let riseFrom = 0;
  let small = false;
  let shown = -1;
  let unroll = 0;
  let writing = 0;

  /* where a chapter is "being read": its heading ~30% down the screen (and past the counter's threshold) */
  const chapterProgress = (i: number) => {
    const top = tops[i] ?? 0;
    const target = Math.max(top + 100, top + (m.followLine - 0.3) * m.viewport);
    return PHASE.unroll[0] + unrollForOpen(Math.min(m.height, target), m) * span(PHASE.unroll);
  };

  // layout reads only (offsets ignore transforms), done before each ScrollTrigger refresh
  const measure = () => {
    small = window.innerWidth < 640;
    m.viewport = stage.clientHeight || window.innerHeight;
    m.height = sheet.offsetHeight;
    m.openAtStart = mast.offsetTop + mast.offsetHeight;
    m.sheetTop = rise.offsetTop;
    m.followLine = small ? 0.8 : 0.76;
    m.rollFrom = small ? 40 : 54;
    m.rollTo = small ? 22 : 28;
    tops = sections.map((s) => s.offsetTop);
    chapterAt = tops.map((_, i) => chapterProgress(i)); // chapter I too: land where the introduction is readable
    // the dots stay evenly spaced (set in the markup); railFill maps scroll progress onto them
    if (signature) {
      const o = offsetIn(signature, sheet);
      sigBox = { x: o.x, y: o.y, w: signature.offsetWidth, h: signature.offsetHeight };
    }
    // first frame: the rolled paper peeks in under the name, at --ci-roll-at of the screen (CSS: lower on short screens)
    const rollAt = parseFloat(getComputedStyle(root).getPropertyValue("--ci-roll-at")) || 0.8;
    riseFrom = Math.max(0, m.viewport * rollAt - (m.sheetTop + m.openAtStart));
    render();
    renderSign();
  };

  const render = () => {
    const f = paperFrame(unroll, m);
    sheet.style.clipPath = `inset(0 0 ${f.hidden.toFixed(1)}px 0)`;
    follow.style.transform = `translate3d(0, ${f.follow.toFixed(1)}px, 0)`;
    shadow.style.transform = `scaleY(${m.height ? (f.open / m.height).toFixed(4) : 0})`;
    curl.style.transform = `translate3d(0, ${f.open.toFixed(1)}px, 0)`;
    roll.style.setProperty("--ci-y", `${f.open.toFixed(1)}px`);
    roll.style.setProperty("--ci-roll", `${f.roll.toFixed(1)}px`);
    roll.style.setProperty("--ci-angle", `${f.angle.toFixed(1)}deg`);
    roll.style.setProperty("--ci-travel", `${(f.open - m.openAtStart).toFixed(1)}px`);

    sections.forEach((el, i) => {
      const top = tops[i] ?? 0;
      // the last section may sit closer than `span` to the end: it still finishes fully settled
      const r = sectionReveal(f.open, top, Math.min(110, Math.max(1, m.height - top)));
      el.style.opacity = r >= 1 ? "1" : (0.1 + 0.9 * r).toFixed(3); // explicit 1: the stylesheet's pre-JS value is 0.1
      el.style.transform = r >= 1 ? "" : `translate3d(0, ${((1 - r) * 10).toFixed(1)}px, 0)`;
      // still rolled up = not visible: keep its links out of the Tab order until the paper reveals them
      const hidden = r < 0.5;
      if (el.inert !== hidden) el.inert = hidden;
    });

    const idx = currentSection(f.open, tops);
    if (idx !== shown && sections[idx]) {
      shown = idx;
      if (count) count.textContent = toRoman(idx + 1);
      if (label) label.textContent = sections[idx].dataset.ciLabel ?? "";
      marks.forEach((el, i) => {
        el.toggleAttribute("data-active", i === idx);
        el.toggleAttribute("data-passed", i <= idx);
        if (i === idx) el.setAttribute("aria-current", "step");
        else el.removeAttribute("aria-current");
      });
    }
  };

  /* the peacock quill: nib on the signature's writing point; ink revealed up to the nib */
  const renderSign = () => {
    if (signature) signature.style.clipPath = `inset(0 ${((1 - writing) * 100).toFixed(2)}% 0 0)`;
    if (!quill) return;
    const pt = quillPoint(writing, sigBox);
    const tilt = 26 + Math.sin(writing * Math.PI * 9) * 4;
    quill.style.transform = `translate3d(${(pt.x - 30).toFixed(1)}px, ${(pt.y - 262).toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${small ? 0.8 : 1.18})`;
  };

  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.addEventListener("refreshInit", measure);
  measure();

  let cued = false;
  let completed = false;
  const ctx = gsap.context(() => {
    const proxy = { u: 0 };
    const pen = { s: 0 };
    const blur = (px: number) => (small ? "none" : `blur(${px}px)`);
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // the fill reaches each evenly spaced dot exactly as its chapter is read (CSS: scaleY on the rail, scaleX on phones)
          bar?.style.setProperty("--ci-p", railFill(self.progress, chapterAt).toFixed(4));
          if (!cued && self.progress >= PHASE.reveal[0] + 0.02) {
            cued = true;
            hooks.onHeroCue();
          }
          if (!completed && self.progress >= 0.98) {
            completed = true;
            hooks.onComplete();
          }
        },
      },
    });

    /* 1 · rise: the name lifts away, the twine slips off, the rolled document comes up out of the clouds */
    tl.to("[data-ci-identity]", { yPercent: -22, autoAlpha: 0, filter: () => blur(10), duration: 0.1, ease: "power1.in" }, 0);
    if (twine) tl.to(twine, { y: 70, rotation: 14, autoAlpha: 0, duration: 0.07, ease: "power2.in" }, 0.03);
    tl.fromTo(
      rise,
      { y: () => riseFrom, rotationX: 24, scale: 0.94 },
      { y: 0, rotationX: 8, scale: 1, duration: span(PHASE.rise), ease: "power2.out" },
      0,
    );

    /* 2 · unroll: one proxy drives roll position, rotation, diameter, clip, camera and ink */
    tl.to(proxy, { u: 1, duration: span(PHASE.unroll), onUpdate: () => ((unroll = proxy.u), render()) }, PHASE.unroll[0]);
    tl.to(rise, { rotationX: 1.5, duration: span(PHASE.unroll) }, PHASE.unroll[0]);

    /* ambient depth: clouds drift at different speeds for the whole scene */
    tl.to("[data-ci-far]", { yPercent: -6, xPercent: -3, duration: 1 }, 0);
    tl.to("[data-ci-mid]", { yPercent: -14, xPercent: 4, duration: 0.88 }, 0);

    /* 3 · the old-school ending: warm light, the mor pankh quill signs, the wax seal is pressed */
    tl.to("[data-ci-warm]", { autoAlpha: 1, duration: span(PHASE.sign) }, PHASE.sign[0]);
    tl.to("[data-ci-rays]", { autoAlpha: 1, scale: 1.08, duration: span(PHASE.sign) }, PHASE.sign[0]);
    if (quillBody) {
      tl.fromTo(quillBody, { x: 190, y: -150, rotation: 16, autoAlpha: 0 }, { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 0.014, ease: "power2.out" }, SIGN.quillIn);
      tl.to(quillBody, { x: 150, y: -180, rotation: -14, autoAlpha: 0, duration: 0.014, ease: "power2.in" }, SIGN.quillOut);
    }
    tl.to(pen, { s: 1, duration: span(SIGN.write), onUpdate: () => ((writing = pen.s), renderSign()) }, SIGN.write[0]);
    if (seal) tl.fromTo(seal, { scale: 1.9, rotation: -30, autoAlpha: 0 }, { scale: 1, rotation: -9, autoAlpha: 1, duration: 0.016, ease: "power4.in" }, SIGN.seal);
    tl.fromTo("[data-ci-sheen]", { xPercent: -120, autoAlpha: 0 }, { xPercent: 120, autoAlpha: 1, duration: 0.05, ease: "sine.inOut" }, SIGN.seal + 0.012);
    tl.to("[data-ci-sheen]", { autoAlpha: 0, duration: 0.01 }, PHASE.sign[1]);

    /* 4 · clouds gather over the paper, the paper falls out of focus, then the banks part onto the hero */
    const [r0] = PHASE.reveal;
    tl.to("[data-ci-mid]", { scale: 1.1, duration: 0.06 }, r0 - 0.04);
    tl.fromTo("[data-ci-fore-l]", { xPercent: -100, autoAlpha: 1 }, { xPercent: -6, duration: 0.07, ease: "power1.out" }, r0 - 0.03);
    tl.fromTo("[data-ci-fore-r]", { xPercent: 100, autoAlpha: 1 }, { xPercent: 6, duration: 0.07, ease: "power1.out" }, r0 - 0.03);
    tl.to(rise, { scale: 0.82, rotationX: -10, y: () => -m.viewport * 0.08, autoAlpha: 0, filter: () => blur(10), duration: 0.12, ease: "power2.in" }, r0 + 0.01);
    tl.to("[data-ci-fore-l]", { xPercent: -118, scale: 1.2, duration: 0.1, ease: "power2.in" }, r0 + 0.06);
    tl.to("[data-ci-fore-r]", { xPercent: 118, scale: 1.2, duration: 0.1, ease: "power2.in" }, r0 + 0.06);
    tl.to(["[data-ci-far]", "[data-ci-mid]", "[data-ci-fog]", "[data-ci-fog2]", "[data-ci-goldfog]", "[data-ci-rays]"], { autoAlpha: 0, scale: 1.25, duration: 0.1 }, r0 + 0.05);
    tl.to("[data-ci-base]", { autoAlpha: 0, duration: 0.1, ease: "power1.in" }, r0 + 0.06);
    tl.to(["[data-ci-grain]", "[data-ci-chrome]"], { autoAlpha: 0, duration: 0.05 }, r0 + 0.08);
    // fully gone at the end: nothing left on top of the hero to catch clicks or focus
    tl.to(stage, { autoAlpha: 0, duration: 0.01 }, 0.99);
    tl.set({}, {}, 1); // pin the total to exactly 1 so PHASE shares map 1:1 to scroll progress
  }, root);

  const trigger = () => ScrollTrigger.getAll().find((t) => t.trigger === root);

  // the page may load already past the intro (a #hash link or restored scroll)
  const st = trigger();
  if (st && st.progress >= PHASE.reveal[0]) {
    cued = true;
    hooks.onHeroCue();
  }

  // late layout changes (web fonts, admin content) change the paper's height: re-measure via a refresh
  let pending = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(pending);
    pending = window.setTimeout(() => ScrollTrigger.refresh(), 120);
  });
  ro.observe(sheet);
  document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

  const settle = () => {
    ScrollTrigger.update(); // read the new scroll position synchronously
    trigger()?.getTween()?.progress(1); // finish the scrub's smoothing tween instead of animating to it
  };

  const goToChapter = (i: number) => {
    const t = trigger();
    const at = chapterAt[i];
    if (!t || at === undefined) return;
    let smooth = true;
    try {
      smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: Math.round(t.start + at * (t.end - t.start)), behavior: smooth ? "smooth" : "instant" });
  };

  const dispose = () => {
    window.clearTimeout(pending);
    ro.disconnect();
    ScrollTrigger.removeEventListener("refreshInit", measure);
    ctx.revert();
    for (const el of [sheet, follow, shadow, curl, roll, signature, quill, ...sections]) el?.removeAttribute("style");
    for (const el of sections) el.inert = false;
  };

  return { settle, goToChapter, dispose };
}
