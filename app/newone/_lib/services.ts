/* "What I do" on /newone: the four kinds of work, each with its own dot-matrix scene.
   Copy is grounded in the portfolio's real stack (React, Next.js, TypeScript, REST APIs, MUI/Bootstrap);
   edit here to change the wording. Pure module (no imports) so it can be unit-tested. */

export type SceneKind = "ui" | "pulse" | "network" | "curve";

export type Service = {
  id: string;
  title: string;
  lead: string;
  body: string;
  scene: SceneKind;
};

export const SERVICES: readonly Service[] = [
  {
    id: "frontend",
    title: "Frontend",
    lead: "From the first screen to the last state.",
    body: "Responsive React and Next.js interfaces (course players, dashboards, storefronts) built to match the design on every screen size.",
    scene: "ui",
  },
  {
    id: "performance",
    title: "Performance",
    lead: "Fast on real phones, not just on my laptop.",
    body: "Code-splitting, optimised images and lean bundles, checked against Core Web Vitals so pages load quickly and stay smooth.",
    scene: "pulse",
  },
  {
    id: "integrations",
    title: "Integrations",
    lead: "The parts that talk to everything else.",
    body: "REST APIs, auth, payments and video wired into the UI, with loading, empty and error states handled instead of left blank.",
    scene: "network",
  },
  {
    id: "systems",
    title: "Design systems",
    lead: "Built once, reused everywhere.",
    body: "Reusable components and design tokens in TypeScript, so new screens ship faster and the product stays consistent.",
    scene: "curve",
  },
];

/** Which service is active for a 0–1 progress through the pinned section, and how far into it (0–1). */
export function activeService(progress: number, count: number): { index: number; local: number } {
  const n = Math.max(1, Math.floor(count));
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const scaled = p * n;
  const index = Math.min(n - 1, Math.floor(scaled));
  return { index, local: Math.min(1, scaled - index) };
}
