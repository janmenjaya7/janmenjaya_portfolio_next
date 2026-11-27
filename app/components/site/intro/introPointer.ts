/*
  Pointer layer for the intro (desktop mice/trackpads only): a gold ring cursor that reacts to what it is over,
  gentle parallax on the name and clouds, and a slight tilt of the paper towards the pointer.
  One rAF loop that sleeps when everything has settled; writes transforms directly (no React, no GSAP —
  these elements are never animated by the timeline, so there is no transform conflict).
  Golden mist drifts off the pointer on a canvas (physics in lib/intro, drawn only while puffs are alive).
*/
import { moteAlpha, spawnMotes, stepMotes, type Mote } from "../../../lib/intro";
const HOT = "a[href], button, [data-ci-hot]";

export function canUseFancyPointer(): boolean {
  try {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function createIntroPointer(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>("[data-ci-stage]");
  const cursor = root.querySelector<HTMLElement>("[data-ci-cursor]");
  const ring = root.querySelector<HTMLElement>("[data-ci-cursor-ring]");
  const dot = root.querySelector<HTMLElement>("[data-ci-cursor-dot]");
  if (!stage || !cursor || !ring || !dot) return () => {};

  // parallax layers: [element, x px, y px] at full deflection (pointer at the edge of the screen)
  const spec: Array<[string, number, number]> = [
    ["[data-ci-id-inner]", -14, -9],
    ["[data-ci-far-inner]", 10, 6],
    ["[data-ci-mid-inner]", 22, 12],
  ];
  const layers: Array<[HTMLElement, number, number]> = [];
  for (const [sel, x, y] of spec) {
    const el = root.querySelector<HTMLElement>(sel);
    if (el) layers.push([el, x, y]);
  }
  const tilt = root.querySelector<HTMLElement>("[data-ci-tilt]");

  /* golden mist canvas */
  const canvas = root.querySelector<HTMLCanvasElement>("[data-ci-dust]");
  const ctx = canvas?.getContext("2d") ?? null;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let motes: Mote[] = [];
  let lastT = 0;
  let lastPt: { x: number; y: number } | null = null;
  // one soft warm-gold puff, drawn once and stamped (much cheaper than a gradient per puff per frame)
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const sg = sprite.getContext("2d");
  if (sg) {
    const g = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255, 222, 150, 1)");
    g.addColorStop(0.35, "rgba(232, 182, 96, 0.55)");
    g.addColorStop(1, "rgba(212, 160, 80, 0)");
    sg.fillStyle = g;
    sg.fillRect(0, 0, 64, 64);
  }
  const sizeCanvas = () => {
    if (!canvas) return;
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
  };
  sizeCanvas();
  const ro = new ResizeObserver(sizeCanvas);
  ro.observe(stage);

  const drawMist = (now: number) => {
    if (!canvas || !ctx) return false;
    const dt = lastT ? (now - lastT) / 1000 : 0.016;
    lastT = now;
    motes = stepMotes(motes, dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
    for (const m of motes) {
      ctx.globalAlpha = moteAlpha(m);
      ctx.drawImage(sprite, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
    ctx.globalAlpha = 1;
    if (!motes.length) lastT = 0;
    return motes.length > 0;
  };

  let tx = 0, ty = 0; // pointer target (px)
  let rx = 0, ry = 0; // ring (lagging)
  let dx = 0, dy = 0; // dot (snappy)
  let nx = 0, ny = 0; // normalised pointer −1…1 (target)
  let px = 0, py = 0; // normalised (eased)
  let frame = 0;
  let inside = false;

  root.setAttribute("data-cursor", ""); // CSS hides the native cursor inside the stage only while this runs

  const loop = (now: number) => {
    frame = 0;
    rx += (tx - rx) * 0.2;
    ry += (ty - ry) * 0.2;
    dx += (tx - dx) * 0.55;
    dy += (ty - dy) * 0.55;
    px += (nx - px) * 0.08;
    py += (ny - py) * 0.08;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    dot.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    for (const [el, x, y] of layers) el.style.transform = `translate3d(${(px * x).toFixed(2)}px, ${(py * y).toFixed(2)}px, 0)`;
    if (tilt) tilt.style.transform = `perspective(1400px) rotateY(${(px * 3).toFixed(3)}deg) rotateX(${(-py * 2).toFixed(3)}deg)`;
    const misty = drawMist(now);
    const busy = misty || Math.abs(tx - rx) + Math.abs(ty - ry) + Math.abs(nx - px) * 50 + Math.abs(ny - py) * 50 > 0.3;
    if (busy) frame = requestAnimationFrame(loop);
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(loop);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    tx = e.clientX;
    ty = e.clientY;
    if (!inside) {
      // first move: jump there instead of flying in from the corner
      inside = true;
      rx = dx = tx;
      ry = dy = ty;
      cursor.setAttribute("data-on", "");
    }
    nx = (e.clientX / window.innerWidth) * 2 - 1;
    ny = (e.clientY / window.innerHeight) * 2 - 1;
    const t = e.target instanceof Element ? e.target : null;
    const state = t?.closest(HOT) ? "hot" : t?.closest("[data-ci-sheet]") ? "read" : "";
    if (cursor.dataset.state !== state) cursor.dataset.state = state;
    // stage coordinates (the stage is the sticky viewport, so client coords match)
    const pt = { x: e.clientX, y: e.clientY };
    if (lastPt) motes.push(...spawnMotes(lastPt, pt, state === "hot"));
    lastPt = pt;
    wake();
  };
  const onLeave = () => {
    inside = false;
    lastPt = null;
    cursor.removeAttribute("data-on");
    nx = ny = 0;
    wake();
  };
  const onDown = () => cursor.setAttribute("data-down", "");
  const onUp = () => cursor.removeAttribute("data-down");

  stage.addEventListener("pointermove", onMove, { passive: true });
  stage.addEventListener("pointerleave", onLeave);
  stage.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    motes = [];
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerleave", onLeave);
    stage.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    root.removeAttribute("data-cursor");
    cursor.removeAttribute("data-on");
    for (const [el] of layers) el.style.transform = "";
    if (tilt) tilt.style.transform = "";
  };
}
