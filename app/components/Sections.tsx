"use client";
import { useEffect, useRef, useState } from "react";
import { DATA } from "../data";

/* ── REVEAL HOOK ── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transitionDelay = delay + "s";
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

/* ── SHARED UI ── */
function SectionLabel({ label }: { label: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal font-mono-custom mb-3"
      style={{ fontSize: "0.72rem", letterSpacing: "3px", color: "var(--cyan)" }}>
      {label}
    </div>
  );
}
function SectionHeading({ children }: { children: React.ReactNode }) {
  const ref = useReveal(0.06);
  return (
    <h2 ref={ref} className="reveal font-syne font-bold text-white mb-12"
      style={{ fontSize: "clamp(2rem,4vw,2.8rem)", lineHeight: 1.15 }}>
      {children}
    </h2>
  );
}
function Cyan({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--cyan-light)" }}>{children}</span>;
}

/* ══════════════════════════════
   ABOUT
══════════════════════════════ */
export function About() {
  const rText  = useReveal(0.1);
  const rCards = useReveal(0.2);
  return (
    <section id="about" className="relative z-10" style={{ padding: "7rem 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <SectionLabel label="// 01 — About" />
        <SectionHeading>Crafting Digital <Cyan>Experiences</Cyan></SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "4rem", alignItems: "start" }}>

          {/* Text column */}
          <div ref={rText} className="reveal">
            {DATA.about.paragraphs.map((p, i) => (
              <p key={i} style={{ color: "var(--text)", marginBottom: "1rem", lineHeight: 1.85, fontSize: "0.97rem" }}>{p}</p>
            ))}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" }}>
              {DATA.about.chips.map((c) => (
                <span key={c} style={{ padding: "0.3rem 0.85rem", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 999, fontSize: "0.78rem", color: "var(--text)" }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Cards column */}
          <div ref={rCards} className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {DATA.about.cards.map((c) => (
              <div key={c.title} className="glow-card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.6rem" }}>{c.icon}</div>
                <h3 className="font-syne" style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--white)", marginBottom: "0.4rem" }}>{c.title}</h3>
                <p style={{ fontSize: "0.77rem", lineHeight: 1.6, color: "var(--muted)" }}>{c.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════
   SKILLS
══════════════════════════════ */
export function Skills() {
  const rClusters = useReveal(0.1);
  const rPills    = useReveal(0.2);
  return (
    <section id="skills" className="relative z-10" style={{ padding: "7rem 0", background: "var(--bg2)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <SectionLabel label="// 02 — Skills" />
        <SectionHeading>Tech <Cyan>Arsenal</Cyan></SectionHeading>

        <div ref={rClusters} className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
          {DATA.skills.map((cluster) => (
            <SkillCluster key={cluster.cluster} cluster={cluster} />
          ))}
        </div>

        <div ref={rPills} className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {DATA.techPills.map((p) => (
            <TechPill key={p} label={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TechPill({ label }: { label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <span
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "0.35rem 0.9rem", borderRadius: 999, fontSize: "0.78rem", cursor: "default",
        background: hov ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)",
        border: hov ? "1px solid var(--blue)" : "1px solid rgba(59,130,246,0.2)",
        color: hov ? "var(--white)" : "var(--blue-pale)",
        transition: "all 0.2s",
      }}
    >{label}</span>
  );
}

function SkillCluster({ cluster }: { cluster: typeof DATA.skills[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setAnimated(true), 100); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="glow-card" style={{ padding: "1.5rem" }}>
      <div className="font-mono-custom" style={{ fontSize: "0.68rem", letterSpacing: "3px", textTransform: "uppercase", color: "var(--cyan)", marginBottom: "1.25rem" }}>
        {cluster.cluster}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        {cluster.items.map((item) => (
          <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text)" }}>{item.name}</span>
            <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  // background: "linear-gradient(90deg, var(--blue), var(--cyan-light))",
                   background: `
      repeating-linear-gradient(
        90deg,
        var(--cyan-light) 0px,
        var(--cyan-light) 8px,
        transparent 14px,
        transparent 14px
      )
    `,
                  width: animated ? item.level + "%" : "0%",
                  transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════
   EXPERIENCE
══════════════════════════════ */
export function Experience() {
  const r1 = useReveal(0.1);
  return (
    <section id="experience" className="relative z-10" style={{ padding: "7rem 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <SectionLabel label="// 03 — Experience" />
        <SectionHeading>Work <Cyan>Timeline</Cyan></SectionHeading>

        <div style={{ position: "relative", paddingLeft: "2rem" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom, var(--blue), transparent)" }} />

          {DATA.experience.map((job) => (
            <div key={job.title} ref={r1} className="reveal" style={{ position: "relative", marginBottom: "2rem" }}>
              {/* Pulse dot */}
              <div className="pulse-dot" style={{ position: "absolute", left: "-2.15rem", top: "1.75rem", width: 14, height: 14, borderRadius: "50%", background: "var(--blue)", border: "2px solid var(--bg)" }} />

              <div className="glow-card" style={{ padding: "2rem" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div>
                    <h3 className="font-syne" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--white)" }}>{job.title}</h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--blue-light)", marginTop: "0.2rem" }}>
                      {job.company} <span style={{ color: "var(--muted)" }}>·</span> Client: {job.client}
                    </div>
                    <div className="font-mono-custom" style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                      {job.date} &nbsp;·&nbsp; {job.location}
                    </div>
                  </div>
                  {job.current && (
                    <span className="font-mono-custom" style={{ padding: "0.25rem 0.75rem", borderRadius: 999, fontSize: "0.7rem", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", whiteSpace: "nowrap" }}>
                      Current
                    </span>
                  )}
                </div>

                {/* Bullets */}
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "1.5rem" }}>
                  {job.bullets.map((b, i) => (
                    <li key={i} style={{ display: "flex", gap: "0.6rem", fontSize: "0.87rem", color: "var(--text)", lineHeight: 1.65 }}>
                      <span style={{ color: "var(--blue)", flexShrink: 0, marginTop: 2 }}>▸</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Products */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div className="font-mono-custom" style={{ fontSize: "0.68rem", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.6rem" }}>
                    Live Products
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {job.products.map((p) => (
                      <ProductLink key={p.name} name={p.name} url={p.url} />
                    ))}
                  </div>
                </div>

                {/* Tech tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {job.tech.map((t) => (
                    <span key={t} className="font-mono-custom" style={{ padding: "0.2rem 0.55rem", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 4, fontSize: "0.7rem", color: "var(--muted)" }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductLink({ name, url }: { name: string; url: string }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="font-mono-custom"
      style={{
        display: "flex", alignItems: "center", gap: "0.35rem",
        padding: "0.3rem 0.8rem", borderRadius: 6, fontSize: "0.76rem",
        background: hov ? "rgba(6,182,212,0.18)" : "rgba(6,182,212,0.08)",
        border: hov ? "1px solid var(--cyan-light)" : "1px solid rgba(6,182,212,0.2)",
        color: "var(--cyan-light)", transition: "all 0.2s",
      }}
    >
      <span className="live-dot" />{name}
    </a>
  );
}

/* ══════════════════════════════
   PROJECTS
══════════════════════════════ */
export function Projects() {
  return (
    <section id="projects" className="relative z-10" style={{ padding: "7rem 0", background: "var(--bg2)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <SectionLabel label="// 04 — Projects" />
        <SectionHeading>Featured <Cyan>Work</Cyan></SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1.5rem" }}>
          {DATA.projects.map((p, i) => (
            <ProjectCard key={p.title} project={p} delay={i * 0.07} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project: p, delay }: { project: typeof DATA.projects[0]; delay: number }) {
  const ref = useReveal(delay);
  const [hov, setHov] = useState(false);
  return (
    <div
      ref={ref} className="reveal glow-card"
      style={{
        padding: "1.75rem", display: "flex", flexDirection: "column",
        ...(p.featured ? { borderColor: "rgba(59,130,246,0.35)", boxShadow: "0 0 30px rgba(59,130,246,0.1)" } : {}),
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.75rem" }}>{p.icon}</span>
        <a
          href={p.url} target="_blank" rel="noopener noreferrer"
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 6, fontSize: "0.85rem", transition: "all 0.2s",
            background: hov ? "var(--glow)" : "var(--bg4)",
            border: hov ? "1px solid var(--blue)" : "1px solid var(--border)",
            color: hov ? "var(--blue-light)" : "var(--muted)",
          }}
        >↗</a>
      </div>
      <h3 className="font-syne" style={{ fontWeight: 700, fontSize: "1rem", color: "var(--white)", marginBottom: "0.6rem" }}>{p.title}</h3>
      <p style={{ fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "1.25rem", flex: 1, color: "var(--muted)" }}>{p.desc}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem" }}>
        {p.stack.map((s) => (
          <span key={s} className="font-mono-custom" style={{ padding: "0.15rem 0.55rem", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 4, fontSize: "0.7rem", color: "var(--muted)" }}>{s}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="font-mono-custom" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: p.status === "live" ? "#86efac" : "var(--muted)" }}>
          {p.status === "live" && <span className="live-dot" />}
          {p.status === "live" ? "Live Production" : "Personal Project"}
        </span>
        <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.78rem", color: "var(--blue-light)" }}>
          {p.status === "live" ? "Visit Site →" : "GitHub →"}
        </a>
      </div>
    </div>
  );
}

/* ══════════════════════════════
   CREDENTIALS
══════════════════════════════ */
export function Credentials() {
  return (
    <section id="certs" className="relative z-10" style={{ padding: "7rem 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <SectionLabel label="// 05 — Credentials" />
        <SectionHeading>Education &amp; <Cyan>Certs</Cyan></SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: "1.25rem" }}>
          {DATA.credentials.map((c, i) => {
            const ref = useReveal(i * 0.1);
            return (
              <div key={c.title} ref={ref} className="reveal glow-card" style={{ padding: "1.5rem" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{c.icon}</div>
                <h3 className="font-syne" style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--white)", marginBottom: "0.35rem" }}>{c.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--blue-light)", marginBottom: "0.25rem" }}>{c.inst}</p>
                <p className="font-mono-custom" style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{c.meta}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════
   CONTACT
══════════════════════════════ */
export function Contact() {
  const r1 = useReveal(0.1);
  const r2 = useReveal(0.2);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const contactItems = [
    { icon: "✉️", label: "Email",    val: DATA.email,       href: `mailto:${DATA.email}` },
    { icon: "📞", label: "Phone",    val: DATA.phone,        href: `tel:${DATA.phone.replace(/\D/g, "")}` },
    { icon: "📍", label: "Location", val: DATA.location,     href: null },
    { icon: "💼", label: "LinkedIn", val: "View Profile →",  href: DATA.linkedin },
    { icon: "⌨️", label: "GitHub",   val: "View Repos →",    href: DATA.github },
  ];

  return (
    <>
      <section
        id="contact"
        className="relative z-10 contact-section"
        style={{ padding: "7rem 0", background: "var(--bg2)" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem" }}>
          <SectionLabel label="// 06 — Contact" />
          <SectionHeading>
            Let's <Cyan>Connect</Cyan>
          </SectionHeading>
          <p className="contact-heading-sub">
            Open to exciting opportunities, collaborations, and conversations.
            Drop me a message!
          </p>

          <div className="contact-grid">

            {/* ── Info Cards ── */}
            <div
              ref={r1}
              className="reveal"
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              {contactItems.map((item) => {
                const inner = (
                  <div
                    className="glow-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem 1.25rem",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="font-mono-custom"
                        style={{
                          fontSize: "0.68rem",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                          marginBottom: 2,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        className="contact-item-val"
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text)",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.val}
                      </div>
                    </div>
                  </div>
                );

                return item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={item.label}>{inner}</div>
                );
              })}
            </div>

            {/* ── Form ── */}
            <div ref={r2} className="reveal glow-card contact-form-card">
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
              >
                {[
                  { label: "Your Name",     type: "text",  placeholder: "Enter your name" },
                  { label: "Email Address", type: "email", placeholder: "you@example.com" },
                  { label: "Subject",       type: "text",  placeholder: "Let's work together" },
                ].map((f) => (
                  <div
                    key={f.label}
                    style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                  >
                    <label
                      className="font-mono-custom"
                      style={{
                        fontSize: "0.68rem",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: 8,
                        fontSize: "0.9rem",
                        color: "var(--white)",
                        outline: "none",
                        background: "var(--bg4)",
                        border: "1px solid var(--border)",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "var(--blue)";
                        e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "var(--border)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                ))}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label
                    className="font-mono-custom"
                    style={{
                      fontSize: "0.68rem",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell me about your project or opportunity..."
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: 8,
                      fontSize: "0.9rem",
                      color: "var(--white)",
                      outline: "none",
                      resize: "vertical",
                      background: "var(--bg4)",
                      border: "1px solid var(--border)",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--blue)";
                      e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="contact-submit-btn"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    background: sent ? "#16a34a" : "var(--blue)",
                    transition: "background 0.3s, transform 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    !sent && (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  {sent ? "✓ Message Sent!" : "Send Message ↗"}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
