import type { CSSProperties } from "react";
import type { PortfolioData } from "../../data";
import { ArrowUpRight } from "lucide-react";
import NoMagnet from "./NoMagnet";
import NoSplitText from "./NoSplitText";
import NoCountUp from "./NoCountUp";
import { firstYear } from "../../lib/journey";
import tokens from "../_styles/tokens.module.css";
import fx from "../_styles/fx.module.css";
import styles from "../_styles/sections.module.css";
import finale from "../_styles/finale.module.css";

type Links = {
  emailHref: string | null;
  email: string;
  linkedinHref: string | null;
  githubHref: string | null;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const delay = (ms: number) => ({ "--no-d": `${ms}ms` }) as CSSProperties;

function Overline({ index, label }: { index: string; label: string }) {
  return (
    <p className={`${tokens.noOverline} ${fx.noReveal}`} data-no-reveal="">
      <span className={styles.noSecIndex}>{index}</span> — {label}
    </p>
  );
}

/* ── About ── */
export function NoAbout({ data }: { data: PortfolioData }) {
  const summary = str(data.summary);
  const stats = (Array.isArray(data.stats) ? data.stats : [])
    .map((s) => ({ num: str(s?.num), label: str(s?.label) }))
    .filter((s) => s.num && s.label)
    .slice(0, 4);

  return (
    <div className={styles.noPaperBand}>
    <section id="about" className={styles.noSection} aria-labelledby="no-about-title">
      <div className={styles.noSecHead}>
        <Overline index="01" label="About" />
        <NoSplitText
          id="no-about-title"
          className={styles.noStatement}
          text="I turn complex products into calm, fast interfaces people enjoy using every day."
          muted={["calm", "fast", "interfaces"]}
        />
      </div>

      <div className={styles.noAboutGrid} data-no-reveal="">
        <span className={`${fx.noDrawLine} ${styles.noAboutRule}`} aria-hidden="true" />
        {summary ? (
          <p className={`${tokens.noBodyLg} ${styles.noAboutText} ${fx.noReveal}`} data-no-reveal="" style={delay(150)}>
            {summary}
          </p>
        ) : null}
        {stats.length > 0 ? (
          <dl className={styles.noStats}>
            {stats.map((s, i) => (
              <div
                key={`${s.num}-${s.label}`}
                className={`${styles.noStat} ${fx.noReveal}`}
                data-no-reveal=""
                style={delay(200 + i * 90)}
              >
                <dt className={styles.noStatLabel}>{s.label}</dt>
                <dd className={styles.noStatNum}>
                  <NoCountUp value={s.num} />
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
    </div>
  );
}

/* ── Experience ──
   A timeline with giant years: each role's year pins on the left while its details scroll past
   (CSS sticky inside the role's own block). The current role reads "Now". */
export function NoExperience({ data, index = "04" }: { data: PortfolioData; index?: string }) {
  const roles = (Array.isArray(data.experience) ? data.experience : [])
    .map((r) => ({
      title: str(r?.title),
      company: str(r?.company),
      date: str(r?.date),
      location: str(r?.location),
      current: r?.current === true,
      bullets: (Array.isArray(r?.bullets) ? r.bullets : []).map(str).filter(Boolean).slice(0, 3),
    }))
    .filter((r) => r.title && r.company);

  if (roles.length === 0) return null;

  return (
    <section id="experience" className={styles.noSection} aria-labelledby="no-exp-title">
      <div className={styles.noSecHead}>
        <Overline index={index} label="Experience" />
        <NoSplitText id="no-exp-title" className={tokens.noHeadlineLg} text="Where I've been building" />
      </div>
      <ol className={styles.noTimeline}>
        {roles.map((r, i) => {
          const year = r.current ? "Now" : (firstYear(r.date)?.toString() ?? "");
          return (
            <li key={`${r.company}-${i}`} className={styles.noTlItem}>
              <span className={styles.noTlYear} aria-hidden={year ? undefined : true} data-now={r.current ? "" : undefined}>
                {year}
              </span>
              <div className={`${styles.noTlBody} ${fx.noReveal}`} data-no-reveal="">
                <p className={styles.noTlDate}>
                  {r.date || "—"}
                  {r.current ? (
                    <span className={styles.noChip}>
                      <span className={styles.noChipDot} aria-hidden="true" />
                      Current
                    </span>
                  ) : null}
                </p>
                <h3 className={styles.noTlTitle}>{r.title}</h3>
                <p className={styles.noTlCompany}>
                  {r.company}
                  {r.location ? ` · ${r.location}` : ""}
                </p>
                {r.bullets.length > 0 ? (
                  <ul className={styles.noTlPoints}>
                    {r.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ── Contact: the finale ──
   A big two-line sign-off, a round amber "Start a project" button that leans toward the pointer, and a quiet
   row of direct links. The button uses email when there is one, otherwise LinkedIn; with neither it's omitted. */
export function NoContact({ links }: { links: Links }) {
  const { emailHref, email, linkedinHref, githubHref } = links;
  const cta = emailHref ?? linkedinHref;
  const ctaExternal = !emailHref && !!linkedinHref;
  const direct = [
    emailHref ? { href: emailHref, label: email, hint: "Email", external: false } : null,
    linkedinHref ? { href: linkedinHref, label: "LinkedIn", hint: "Connect", external: true } : null,
    githubHref ? { href: githubHref, label: "GitHub", hint: "Code", external: true } : null,
  ].filter((x): x is { href: string; label: string; hint: string; external: boolean } => x !== null);

  return (
    <section id="contact" className={finale.fnRoot} aria-labelledby="no-contact-title">
      <Overline index="05" label="Contact" />
      <div className={finale.fnGrid}>
        <h2 id="no-contact-title" className={`${finale.fnTitle} ${fx.noReveal}`} data-no-reveal="">
          <span className={finale.fnLine}>Let&apos;s build</span>
          <span className={`${finale.fnLine} ${finale.fnAccent}`}>something great.</span>
        </h2>
        {cta ? (
          <div className={`${finale.fnCtaWrap} ${fx.noReveal}`} data-no-reveal="" style={delay(200)}>
            <NoMagnet>
              <a
                href={cta}
                className={finale.fnCta}
                {...(ctaExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span className={finale.fnCtaText}>Start a project</span>
                <ArrowUpRight className={finale.fnCtaArrow} size={28} strokeWidth={1.6} aria-hidden="true" />
              </a>
            </NoMagnet>
          </div>
        ) : null}
      </div>
      <p className={`${finale.fnLead} ${fx.noReveal}`} data-no-reveal="" style={delay(250)}>
        Open to frontend roles, freelance projects and collaborations. I usually reply within a day.
      </p>
      {direct.length > 0 ? (
        <ul className={`${finale.fnLinks} ${fx.noReveal}`} data-no-reveal="" style={delay(320)}>
          {direct.map((d) => (
            <li key={d.href}>
              <a
                href={d.href}
                className={finale.fnLink}
                {...(d.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span className={finale.fnLinkHint}>{d.hint}</span>
                <span className={finale.fnLinkLabel}>
                  {d.label}
                  <ArrowUpRight size={18} strokeWidth={1.6} aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/* ── Footer ──
   A quiet row (copyright, credit, back to top) and, at the very bottom, the name as a giant speckled
   marquee that bleeds off the page edge. The marquee is decorative (the name is already in the header and
   the row above), so it's hidden from screen readers. */
export function NoFooter({ name }: { name: string }) {
  const chunk = `${name} •`;
  return (
    <footer className={styles.noFooterWrap}>
      <div className={styles.noFooter}>
        <span>
          © {new Date().getFullYear()} {name}
        </span>
        <span className={styles.noFooterMid}>Designed &amp; built with Next.js</span>
        <a href="#no-main" className={styles.noFooterTop}>
          Back to top ↑
        </a>
      </div>
      <div className={styles.noBigName} aria-hidden="true">
        <div className={styles.noBigNameTrack}>
          {[0, 1].map((half) => (
            <span key={half} className={styles.noBigNameHalf}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={styles.noBigNameWord}>
                  {chunk}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
