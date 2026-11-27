import { CHAPTER, resumeChapters, type ResumeSheet } from "../../../lib/journey";
import { toRoman } from "../../../lib/intro";
import { hostOf } from "../../../lib/display-utils";
import styles from "../../../styles/site/intro.module.css";

type Props = { sheet: ResumeSheet; resumeHref: string | null };

/* One numbered editorial section. `data-ci-section` lets the timeline settle its ink as the roll passes it. */
function Section({ n, label, children, className = "" }: { n: number; label: string; children: React.ReactNode; className?: string }) {
  const num = toRoman(n);
  return (
    <section className={`${styles.ciSection} ${className}`.trim()} data-ci-section="" data-ci-label={label} aria-label={label}>
      <h3 className={styles.ciHead}>
        <span className={styles.ciHeadNum} aria-hidden="true">
          {num}
        </span>
        <span className={styles.ciHeadRule} aria-hidden="true" />
        {label}
      </h3>
      {children}
    </section>
  );
}

const Entry = ({ e }: { e: { title: string; place: string; meta: string } }) => (
  <li className={styles.ciEntry}>
    <span className={styles.ciEntryTitle}>{e.title}</span>
    {e.place ? <span className={styles.ciEntryPlace}>{e.place}</span> : null}
    {e.meta ? <span className={styles.ciEntryMeta}>{e.meta}</span> : null}
  </li>
);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "JB";

/* The resume printed on the paper. Real text (selectable, searchable) — never a flattened image. */
export default function ResumeContent({ sheet, resumeHref }: Props) {
  const name = sheet.name || "Janmenjaya Biswal";
  const lead = sheet.skills[0]?.items.slice(0, 3) ?? [];
  const credentials = [...sheet.education, ...sheet.certifications, ...sheet.recognition];
  const { email, linkedin, github, site } = sheet.contact;
  const chapters = resumeChapters(sheet, !!resumeHref);
  const num = (label: string) => chapters.indexOf(label) + 1; // same numbering as the chapter rail
  return (
    <div className={styles.ciDoc}>
      {/* the letterhead: the only band open while the document is rolled up */}
      <header className={styles.ciMast} data-ci-mast="">
        <span className={styles.ciMastOrn} aria-hidden="true">
          ❦
        </span>
        <span>Curriculum Vitæ</span>
        <span className={styles.ciMastDot} aria-hidden="true" />
        <span className={styles.ciMastPlace}>{sheet.location.split(",")[0]?.trim() || "India"}</span>
        <span className={styles.ciMastOrn} aria-hidden="true">
          ❦
        </span>
      </header>

      <Section n={num(CHAPTER.intro)} label={CHAPTER.intro} className={styles.ciIntro}>
        <p className={styles.ciName}>{name}</p>
        <p className={styles.ciRole}>
          {sheet.role || "Frontend Developer"}
          {lead.length ? <span className={styles.ciRoleStack}>{lead.join(" · ")}</span> : null}
        </p>
        {sheet.summary ? <p className={styles.ciLede}>{sheet.summary}</p> : null}
      </Section>

      {num(CHAPTER.skills) ? (
        <Section n={num(CHAPTER.skills)} label={CHAPTER.skills}>
          <div className={styles.ciSkills}>
            {sheet.skills.map((g) => (
              <div key={g.group} className={styles.ciSkillGroup}>
                <p className={styles.ciKicker}>{g.group}</p>
                <ul className={styles.ciSkillList}>
                  {g.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {num(CHAPTER.roles) ? (
        <Section n={num(CHAPTER.roles)} label={CHAPTER.roles}>
          <ol className={styles.ciRoles}>
            {sheet.roles.map((r) => (
              <li key={`${r.company}-${r.title}`} className={styles.ciRoleItem}>
                <div className={styles.ciRoleTop}>
                  <p className={styles.ciRoleTitle}>
                    {r.title} <span className={styles.ciRoleAt}>at</span> {r.company}
                  </p>
                  <p className={styles.ciRoleWhen}>{[r.date, r.location].filter(Boolean).join(" · ")}</p>
                </div>
                {r.points.length ? (
                  <ul className={styles.ciPoints}>
                    {r.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : null}
                {r.products.length ? <p className={styles.ciProducts}>Products: {r.products.join(", ")}</p> : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {num(CHAPTER.work) ? (
        <Section n={num(CHAPTER.work)} label={CHAPTER.work}>
          <ul className={styles.ciWork}>
            {sheet.projects.map((p) => (
              <li key={p.title} className={styles.ciWorkItem}>
                <p className={styles.ciWorkTitle}>{p.title}</p>
                <p className={styles.ciWorkNote}>{p.note}</p>
                {p.desc ? <p className={styles.ciWorkDesc}>{p.desc}</p> : null}
                {p.stack.length ? <p className={styles.ciWorkStack}>{p.stack.join(" / ")}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {num(CHAPTER.credentials) ? (
        <Section n={num(CHAPTER.credentials)} label={CHAPTER.credentials}>
          <ul className={styles.ciEntries}>
            {credentials.map((e) => (
              <Entry key={`${e.title}-${e.place}`} e={e} />
            ))}
          </ul>
        </Section>
      ) : null}

      {num(CHAPTER.contact) ? (
        <Section n={num(CHAPTER.contact)} label={CHAPTER.contact} className={styles.ciContact}>
          <ul className={styles.ciContactList}>
            {email ? (
              <li>
                <span className={styles.ciKicker}>Email</span>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            ) : null}
            {linkedin ? (
              <li>
                <span className={styles.ciKicker}>LinkedIn</span>
                <a href={linkedin} target="_blank" rel="noopener noreferrer">
                  {hostOf(linkedin)}/in/…
                </a>
              </li>
            ) : null}
            {github ? (
              <li>
                <span className={styles.ciKicker}>GitHub</span>
                <a href={github} target="_blank" rel="noopener noreferrer">
                  {hostOf(github)}/{github.replace(/\/+$/, "").split("/").pop()}
                </a>
              </li>
            ) : null}
            {site ? (
              <li>
                <span className={styles.ciKicker}>Web</span>
                <a href={site}>{hostOf(site)}</a>
              </li>
            ) : null}
          </ul>
        </Section>
      ) : null}

      {/* the sign-off: the peacock quill writes the signature, then the wax seal is pressed (intro timeline) */}
      <footer className={styles.ciSignoff} data-ci-signoff="">
        <p className={styles.ciSign}>Every line of code is a part of my journey.</p>
        <div className={styles.ciSignRow}>
          <div className={styles.ciSignBlock}>
            <span className={styles.ciSignNote}>Yours, in code —</span>
            <span className={styles.ciSignature} data-ci-signature="">
              {name}
            </span>
            <span className={styles.ciSignLine} aria-hidden="true" />
            <span className={styles.ciSignMeta}>
              {[sheet.role, sheet.location.split(",")[0]?.trim()].filter(Boolean).join(" · ")}
            </span>
          </div>
          <span className={styles.ciSeal} data-ci-seal="" aria-hidden="true">
            <svg viewBox="0 0 100 100" focusable="false">
              <path
                className={styles.ciSealWax}
                d="M50 4c7 0 9 5 15 6s11-2 15 3 1 10 4 15 9 7 9 14-6 8-7 14 4 11 0 16-10 3-15 6-6 10-13 11-10-4-16-4-11 5-16 1-2-11-6-15-10-5-11-12 4-10 4-16-6-9-3-15 9-5 13-9 4-11 11-13 9 2 13 0z"
              />
              <circle cx="50" cy="50" r="31" className={styles.ciSealRing} />
              <circle cx="50" cy="50" r="26" className={styles.ciSealRing2} />
              <text x="50" y="58" textAnchor="middle" className={styles.ciSealText}>
                {initials(name)}
              </text>
            </svg>
          </span>
        </div>
      </footer>
    </div>
  );
}
