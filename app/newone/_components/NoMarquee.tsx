import fx from "../_styles/fx.module.css";
import tokens from "../_styles/tokens.module.css";

type Props = { items: string[] };

/* Two counter-scrolling bands of tools. Decorative, so the visible copy is hidden from screen readers. */
export default function NoMarquee({ items }: Props) {
  const list = items.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim());
  if (list.length === 0) return null;
  const half = Math.ceil(list.length / 2);
  const rows = [list, [...list.slice(half), ...list.slice(0, half)]];

  return (
    <section className={fx.noMarquee} aria-label="Tools I work with">
      <p className={tokens.noSrOnly}>{list.join(", ")}</p>
      {rows.map((row, r) => (
        <div key={r} className={`${fx.noMarqueeRow} ${r === 1 ? fx.noMarqueeReverse : ""}`} aria-hidden="true">
          {[0, 1].map((copy) => (
            <span key={copy} className={fx.noMarqueeTrack}>
              {row.map((item, i) => (
                <span key={`${copy}-${i}`} className={fx.noMarqueeItem}>
                  {item}
                  <span className={fx.noMarqueeStar}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      ))}
    </section>
  );
}
