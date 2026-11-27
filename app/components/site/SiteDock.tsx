"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from "react";
import { motion, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { BriefcaseBusiness, House, LayoutGrid, Send, UserRound, type LucideIcon } from "lucide-react";
import theme from "../../styles/site/theme.module.css";
import styles from "../../styles/site/dock.module.css";

type Item = { id: string; label: string; icon: LucideIcon };

/* section tabs live in the glass pill; the call to action sits in its own solid pill */
const NAV: Item[] = [
  { id: "hero", label: "Home", icon: House },
  { id: "about", label: "About", icon: UserRound },
  { id: "experience", label: "Experience", icon: BriefcaseBusiness },
  { id: "projects", label: "Projects", icon: LayoutGrid },
];
const CTA: Item = { id: "contact", label: "Let's talk", icon: Send };
const IDS = [...NAV, CTA].map((i) => i.id);

const REVEAL_AT = 0.6; // share of the hero scrolled past before the dock slides in
const DIR_STEP = 6; // px of travel before a scroll counts as "down" or "up"
const END_ZONE = 48; // px from the page end where the dock always shows its labels

type Box = { x: number; w: number };
type Tone = "dark" | "light";

/*
  Floating Liquid Glass dock.
  - hidden over the hero (it has its own CTAs), slides in once the visitor is past 60% of it
  - collapses to icons while scrolling down, expands on scroll up / hover / keyboard focus / page end
  - glass tone follows the section behind it: dark glass over ink sections, frosted light over paper ones
  - one glass lens slides between section tabs (spring + slight liquid stretch); "Let's talk" is a solid CTA
  - scroll-spy: the last dock section whose top passed the middle of the screen; click-scrolls lock it
*/
export default function SiteDock() {
  const reduce = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const scrollingTo = useRef<string | null>(null);
  const [active, setActive] = useState<string>("hero");
  const [hover, setHover] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [keyboardIn, setKeyboardIn] = useState(false);
  const [tone, setTone] = useState<Tone>("dark");

  // hover deliberately does NOT expand: re-laying out the dock would slide the tab out from under
  // the pointer mid-click. Collapsed tabs show a tooltip instead; keyboard focus can expand safely.
  const expanded = !collapsed || keyboardIn;

  /* ── measure every tab relative to the dock ── */
  // layout offsets (not getBoundingClientRect): they ignore transforms, so the reveal slide/scale
  // or a hover lift can't skew the lens position
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const next: Record<string, Box> = {};
    for (const id of IDS) {
      const el = itemRefs.current[id];
      if (!el) continue;
      let x = 0;
      for (let n: HTMLElement | null = el; n && n !== wrap; n = n.offsetParent as HTMLElement | null) x += n.offsetLeft;
      next[id] = { x, w: el.offsetWidth };
    }
    setBoxes(next);
  }, []);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // tabs change width while labels collapse/expand, so watch them as well as the wrapper
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    Object.values(itemRefs.current).forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  /* ── springs: the active lens and the hover highlight ── */
  const spring = reduce ? { stiffness: 1000, damping: 100 } : { stiffness: 420, damping: 34, mass: 0.7 };
  const lensX = useSpring(0, spring);
  const lensW = useSpring(0, spring);
  const hoverX = useSpring(0, { stiffness: 600, damping: 40 });
  const hoverW = useSpring(0, { stiffness: 600, damping: 40 });

  // liquid feel: the faster the lens travels, the more it stretches wide and thins out
  const speed = useVelocity(lensX);
  const stretchX = useTransform(speed, [-2400, 0, 2400], [1.14, 1, 1.14]);
  const stretchY = useTransform(speed, [-2400, 0, 2400], [0.82, 1, 0.82]);

  // a new tab springs; the same tab changing size (collapse, resize) stays glued to it
  const lensFor = useRef<string | null>(null);
  useEffect(() => {
    const b = boxes[active];
    if (!b) return;
    if (lensFor.current === null || lensFor.current === active) {
      lensX.jump(b.x);
      lensW.jump(b.w);
    } else {
      lensX.set(b.x);
      lensW.set(b.w);
    }
    lensFor.current = active;
  }, [active, boxes, lensX, lensW]);

  const hoverFor = useRef<string | null>(null);
  useEffect(() => {
    const b = hover ? boxes[hover] : null;
    if (!b) return;
    if (hoverW.get() === 0 || hoverFor.current === hover) {
      hoverX.jump(b.x);
      hoverW.jump(b.w);
    } else {
      hoverX.set(b.x);
      hoverW.set(b.w);
    }
    hoverFor.current = hover;
  }, [hover, boxes, hoverX, hoverW]);

  /* ── scroll spy: the last dock section whose top has passed the middle of the screen ── */
  useEffect(() => {
    // document order (matches IDS); sections between them (journey, skills) keep the previous tab
    const els = IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    // the observer is only a cheap trigger; the answer comes from geometry, so a jump that skips
    // sections (hash link, reload mid-page, "View my work") still lands on the right tab
    const current = () => {
      const mid = window.innerHeight * 0.5;
      let id = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= mid) id = el.id;
      return id;
    };
    const io = new IntersectionObserver(
      () => {
        const id = current();
        if (scrollingTo.current) {
          // ignore sections we pass on the way; release the lock once we arrive
          if (id === scrollingTo.current) scrollingTo.current = null;
          return;
        }
        setActive(id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    // watch every section, not only the dock's: a jump between two in-between sections
    // (e.g. Skills → Journey) must still wake the spy up
    new Set<Element>([...els, ...document.querySelectorAll("section[id]")]).forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ── visibility, collapse direction and glass tone (one rAF-throttled scroll handler) ── */
  useEffect(() => {
    const paperSel = `.${CSS.escape(theme.jbPaper)}`;
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const hero = document.getElementById("hero");
      const heroH = hero?.offsetHeight ?? 0;
      // the cinematic intro may sit above the hero: measure from where the hero actually starts
      const heroTop = hero ? hero.getBoundingClientRect().top + y : 0;
      setVisible(!hero || y > heroTop + heroH * REVEAL_AT);

      // labels stay until the visitor is past the hero, so the tabs are read at least once
      const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - END_ZONE;
      const d = y - lastY;
      if (y <= heroTop + heroH || atEnd) {
        setCollapsed(false);
        lastY = y;
      } else if (Math.abs(d) >= DIR_STEP) {
        // a click-scroll is the visitor's own navigation: don't collapse under their pointer/finger
        if (!scrollingTo.current) setCollapsed(d > 0);
        lastY = y;
      }

      // tone: what kind of section sits behind the middle of the dock
      const dock = navRef.current;
      if (dock) {
        const r = dock.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const light = [...document.querySelectorAll<HTMLElement>(paperSel)].some((el) => {
          const b = el.getBoundingClientRect();
          return b.top <= mid && b.bottom >= mid;
        });
        setTone(light ? "light" : "dark");
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  /* ── click: smooth-scroll and hold the active tab until we land ── */
  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return; // let the browser follow the plain #hash link
    e.preventDefault();
    setActive(id);
    scrollingTo.current = id;
    const top = target.getBoundingClientRect().top + window.scrollY; // "hero" is not always 0: the intro may sit above it
    // "instant", not "auto": auto would follow the page's CSS smooth-scroll even with reduced motion on
    window.scrollTo({ top, behavior: reduce ? "instant" : "smooth" });
    history.replaceState(null, "", id === "hero" ? window.location.pathname : `#${id}`);
    // safety net: release the lock even if the target never crosses the middle band (e.g. page end)
    const release = () => {
      scrollingTo.current = null;
      window.removeEventListener("scrollend", release);
    };
    window.addEventListener("scrollend", release, { once: true });
    window.setTimeout(release, 1400);
  };

  /* ── pointer-tracked reflection on the glass ── */
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap || e.pointerType === "touch") return;
    // each glass body gets coordinates relative to itself, so the reflection sits under the pointer
    wrap.querySelectorAll<HTMLElement>("ul").forEach((pill) => {
      const r = pill.getBoundingClientRect();
      pill.style.setProperty("--gx", `${e.clientX - r.left}px`);
      pill.style.setProperty("--gy", `${e.clientY - r.top}px`);
    });
  };

  const clearReflection = () => {
    wrapRef.current?.querySelectorAll<HTMLElement>("ul").forEach((pill) => {
      pill.style.removeProperty("--gx");
      pill.style.removeProperty("--gy");
    });
  };

  // keyboard users get the labels back; a mouse click's focus doesn't pin the dock open
  const onFocusIn = (e: FocusEvent<HTMLElement>) => setKeyboardIn(e.target.matches(":focus-visible"));
  const onFocusOut = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeyboardIn(false);
  };

  const ready = Object.keys(boxes).length > 0;
  const onTab = active !== CTA.id; // the solid CTA shows its own active state, the lens bows out

  const renderItem = ({ id, label, icon: Icon }: Item, isCta: boolean) => {
    const isActive = active === id;
    return (
      <li key={id} className={styles.dockLi}>
        <a
          ref={(el) => {
            itemRefs.current[id] = el;
          }}
          href={`#${id}`}
          className={`${styles.dockItem} ${isCta ? styles.dockCta : ""} ${isActive ? styles.dockItemActive : ""}`}
          aria-current={isActive ? "true" : undefined}
          onClick={(e) => go(e, id)}
          onPointerEnter={(e) => e.pointerType !== "touch" && setHover(id)}
          onFocus={() => setHover(id)}
          onBlur={() => setHover(null)}
        >
          <span className={styles.dockIconWrap}>
            <Icon className={styles.dockIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
            {isCta && <span className={styles.dockLive} aria-hidden="true" />}
          </span>
          <span className={styles.dockLabel}>{label}</span>
          {/* collapsed-state tooltip; aria-hidden because the label above already names the link */}
          {!isCta && (
            <span className={styles.dockTip} aria-hidden="true">
              {label}
            </span>
          )}
        </a>
      </li>
    );
  };

  return (
    <nav
      ref={navRef}
      className={styles.dock}
      aria-label="Sections"
      data-visible={visible ? "" : undefined}
      data-collapsed={expanded ? undefined : ""}
      data-tone={tone}
      inert={!visible}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    >
      <div
        ref={wrapRef}
        className={styles.dockWrap}
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          setHover(null);
          clearReflection();
        }}
      >
        {/* hover highlight (independent of the active lens; the CTA has its own hover) */}
        <motion.span
          aria-hidden="true"
          className={styles.dockHover}
          style={{ x: hoverX, width: hoverW }}
          animate={{ opacity: hover && hover !== active && hover !== CTA.id ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
        {/* the one active glass lens */}
        <motion.span
          aria-hidden="true"
          className={styles.dockLens}
          style={{ x: lensX, width: lensW, scaleX: reduce ? 1 : stretchX, scaleY: reduce ? 1 : stretchY }}
          animate={{ opacity: ready && onTab ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.25 }}
        />

        <ul className={`${styles.dockGroup} ${styles.dockNav}`}>{NAV.map((item) => renderItem(item, false))}</ul>
        <ul className={`${styles.dockGroup} ${styles.dockGroupSolo}`}>{renderItem(CTA, true)}</ul>
      </div>
    </nav>
  );
}
