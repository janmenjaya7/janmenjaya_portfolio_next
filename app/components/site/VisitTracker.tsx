"use client";
/*
  Cookie-free visit tracking for the admin "Visitors" dashboard. Renders nothing.
  Records: landing page, referring site, screen width, language, sections reached, clicks on links/buttons (their
  visible label and link), and visible time on the page. Never records what is typed into forms.
  Skipped for visitors who ask not to be tracked (Do Not Track / Global Privacy Control) and for automated browsers.
  Batches are sent at most every 15s, plus once when the tab is hidden or closed (sendBeacon).
*/
import { useEffect } from "react";

type Ev = { at: number; type: "section" | "click"; label: string; href?: string };

const FLUSH_MS = 15_000;
const HEARTBEAT_MS = 60_000;

function optedOut(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.doNotTrack === "1" || n.globalPrivacyControl === true || n.webdriver === true;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

const labelOf = (el: Element): string => {
  const own = el.getAttribute("data-track") || el.getAttribute("aria-label") || (el as HTMLElement).innerText || el.getAttribute("title") || "";
  return own.replace(/\s+/g, " ").trim().slice(0, 80) || "(icon)";
};

const sectionName = (s: Element): string => {
  const raw = s.getAttribute("aria-label") || s.id || s.querySelector("h1,h2")?.textContent || "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 60);
};

export default function VisitTracker() {
  useEffect(() => {
    if (optedOut()) return;
    const sid = newId();
    const queue: Ev[] = [];
    const params = new URLSearchParams(location.search);
    let first: Record<string, unknown> | null = {
      path: location.pathname,
      ref: document.referrer,
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      viewport: window.innerWidth,
      lang: navigator.language,
    };
    // visible time only (a background tab isn't "reading")
    let visibleMs = 0;
    let visibleSince = document.visibilityState === "visible" ? performance.now() : 0;
    const elapsed = () => Math.round(visibleMs + (visibleSince ? performance.now() - visibleSince : 0));
    let lastSent = 0;

    const send = (beacon: boolean) => {
      const body = JSON.stringify({ sid, first: first ?? undefined, events: queue.splice(0, 40), durationMs: elapsed() });
      first = null;
      lastSent = performance.now();
      try {
        if (beacon && navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
        void fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      } catch {
        /* analytics must never break the page */
      }
    };

    // sections: counted when they cross the middle of the screen (works for very tall pinned sections too)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const label = sectionName(e.target);
          if (label) queue.push({ at: elapsed(), type: "section", label });
          io.unobserve(e.target);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll("main section, footer").forEach((s) => io.observe(s));

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a, button, summary, [role='button']");
      if (!el) return;
      const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? undefined : undefined;
      queue.push({ at: elapsed(), type: "click", label: labelOf(el), ...(href ? { href } : {}) });
      if (queue.length >= 20) send(false);
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (visibleSince) visibleMs += performance.now() - visibleSince;
        visibleSince = 0;
        send(true);
      } else {
        visibleSince = performance.now();
      }
    };
    const onHide = () => send(true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    // periodic flush while reading; a light heartbeat keeps "live now" and the duration current
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const since = performance.now() - lastSent;
      if ((queue.length && since >= FLUSH_MS) || since >= HEARTBEAT_MS) send(false);
    }, 5_000);

    send(false); // the visit itself

    return () => {
      window.clearInterval(timer);
      io.disconnect();
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  return null;
}
