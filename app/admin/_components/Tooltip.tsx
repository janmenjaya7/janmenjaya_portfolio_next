"use client";
import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useState,
  type HTMLAttributes,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import styles from "../_styles/tooltip.module.css";

type Side = "top" | "bottom" | "left" | "right";
type Pos = { x: number; y: number; side: Side };

type Props = {
  title: string;
  text?: string;
  side?: Side;
  children: ReactElement<HTMLAttributes<HTMLElement>>;
};

const HOVER_DELAY = 280;
const EDGE = 140; // keep top/bottom tooltips this far from the viewport edges

function placeFor(el: HTMLElement, side: Side): Pos {
  const r = el.getBoundingClientRect();
  // The sidebar turns into a top bar on small screens; "right" would overflow there
  const s: Side = side === "right" && window.innerWidth < 900 ? "bottom" : side;
  const clampX = (x: number) => Math.min(Math.max(x, EDGE), window.innerWidth - EDGE);
  const xy =
    s === "right" ? { x: r.right + 12, y: r.top + r.height / 2 }
    : s === "left" ? { x: r.left - 12, y: r.top + r.height / 2 }
    : s === "bottom" ? { x: clampX(r.left + r.width / 2), y: r.bottom + 12 }
    : { x: clampX(r.left + r.width / 2), y: r.top - 12 };
  return { ...xy, side: s };
}

/* Custom tooltip: opens on mouse hover (after a short delay) or keyboard focus,
   closes on leave, click, blur, scroll, resize or Escape. Rendered in a portal
   inside the admin root so scrolling containers can't clip it. */
export default function Tooltip({ title, text, side = "top", children }: Props) {
  const id = useId();
  const [target, setTarget] = useState<{ el: HTMLElement; delay: number } | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);

  const hide = useCallback(() => {
    setTarget(null);
    setPos(null);
  }, []);

  const show = (el: HTMLElement, delay: number) => setTarget({ el, delay });

  // Open after the hover delay; leaving before it fires cancels via cleanup
  useEffect(() => {
    if (!target) return;
    const t = setTimeout(() => setPos(placeFor(target.el, side)), target.delay);
    return () => clearTimeout(t);
  }, [target, side]);

  useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("keydown", onKey);
    };
  }, [pos, hide]);

  const p = children.props;
  const trigger = cloneElement(children, {
    "aria-describedby": pos ? id : p["aria-describedby"],
    onPointerEnter: (e) => {
      p.onPointerEnter?.(e);
      if (e.pointerType === "mouse") show(e.currentTarget, HOVER_DELAY);
    },
    onPointerLeave: (e) => {
      p.onPointerLeave?.(e);
      hide();
    },
    onPointerDown: (e) => {
      p.onPointerDown?.(e);
      hide();
    },
    onFocus: (e) => {
      p.onFocus?.(e);
      if (e.currentTarget.matches(":focus-visible")) show(e.currentTarget, 0);
    },
    onBlur: (e) => {
      p.onBlur?.(e);
      hide();
    },
  });

  const root = pos ? document.querySelector("[data-adm-root]") : null;

  return (
    <>
      {trigger}
      {pos &&
        root &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className={`${styles.ttRoot} ${styles[`ttSide_${pos.side}`]}`}
            style={{ left: pos.x, top: pos.y }}
          >
            <span className={styles.ttTitle}>{title}</span>
            {text && <span className={styles.ttText}>{text}</span>}
          </div>,
          root,
        )}
    </>
  );
}
