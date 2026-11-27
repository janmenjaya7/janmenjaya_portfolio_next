import { createElement, Fragment, type CSSProperties } from "react";
import fx from "../_styles/fx.module.css";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  id?: string;
  /** Words to tint in the muted colour, matched exactly. */
  muted?: string[];
  delayMs?: number;
};

/* Headline whose words slide up out of a mask when it scrolls into view. Screen readers get the plain text. */
export default function NoSplitText({ text, as = "h2", className = "", id, muted = [], delayMs = 0 }: Props) {
  const words = text.split(/\s+/).filter(Boolean);
  const mutedSet = new Set(muted);

  return createElement(
    as,
    {
      id,
      className: `${fx.noSplit} ${className}`.trim(),
      "data-no-reveal": "",
      "aria-label": text,
      style: { "--no-d": `${delayMs}ms` } as CSSProperties,
    },
    words.map((w, i) => (
      // the space must sit between the clipped word boxes: inside an inline-block it collapses away
      <Fragment key={`${i}-${w}`}>
        <span className={fx.noSplitWord} aria-hidden="true">
          <span
            className={`${fx.noSplitInner} ${mutedSet.has(w.replace(/[.,!?]$/, "")) ? fx.noSplitMuted : ""}`}
            style={{ "--i": i } as CSSProperties}
          >
            {w}
          </span>
        </span>
        {i < words.length - 1 ? " " : null}
      </Fragment>
    )),
  );
}
