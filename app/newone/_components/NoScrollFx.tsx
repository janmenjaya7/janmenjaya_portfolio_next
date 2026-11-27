"use client";
import { useEffect } from "react";

type Props = { rootId: string };

/*
  One lightweight driver for every scroll effect on /newone:
  - reveals: adds [data-shown] to [data-no-reveal] elements as they enter the viewport
  - progress: --no-progress (0–1) for the top progress bar
  - hero parallax: --no-hero (0–1) while the hero scrolls away
  - header: [data-scrolled] once the page has moved
  All of it is CSS-driven, so nothing re-renders while scrolling.
*/
export default function NoScrollFx({ rootId }: Props) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-shown", "");
            reveal.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    root.querySelectorAll("[data-no-reveal]").forEach((el) => reveal.observe(el));

    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const y = window.scrollY;
      root.style.setProperty("--no-progress", Math.min(1, y / max).toFixed(4));
      root.style.setProperty("--no-hero", Math.min(1, y / Math.max(1, window.innerHeight)).toFixed(4));
      // footer reveal: 0 when the footer's top reaches the bottom of the screen, 1 at the very end of the page
      const foot = root.querySelector("footer");
      if (foot) {
        const top = foot.getBoundingClientRect().top;
        const span = Math.max(1, Math.min(foot.offsetHeight, window.innerHeight));
        root.style.setProperty("--no-foot", Math.min(1, Math.max(0, (window.innerHeight - top) / span)).toFixed(4));
      }
      root.toggleAttribute("data-scrolled", y > 24);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      reveal.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.removeAttribute("data-scrolled");
    };
  }, [rootId]);

  return null;
}
