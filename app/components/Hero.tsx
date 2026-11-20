// "use client";
// import { useEffect, useState, useRef } from "react";
// import { DATA } from "../data";

// function useReveal(delay = 0) {
//   const ref = useRef<HTMLDivElement>(null);
//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     el.style.transitionDelay = delay + "s";
//     const obs = new IntersectionObserver(
//       ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
//       { threshold: 0.15 }
//     );
//     obs.observe(el);
//     return () => obs.disconnect();
//   }, [delay]);
//   return ref;
// }

// function Typewriter({ words }: { words: string[] }) {
//   const [text, setText] = useState("");
//   const [wi, setWi] = useState(0);
//   const [deleting, setDeleting] = useState(false);
//   const [ci, setCi] = useState(0);

//   useEffect(() => {
//     const word = words[wi];
//     const timeout = setTimeout(() => {
//       if (!deleting) {
//         setText(word.slice(0, ci + 1));
//         if (ci + 1 === word.length) {
//           setTimeout(() => setDeleting(true), 1800);
//         } else {
//           setCi(ci + 1);
//         }
//       } else {
//         setText(word.slice(0, ci - 1));
//         if (ci - 1 === 0) {
//           setDeleting(false);
//           setWi((wi + 1) % words.length);
//           setCi(0);
//         } else {
//           setCi(ci - 1);
//         }
//       }
//     }, deleting ? 55 : 90);
//     return () => clearTimeout(timeout);
//   }, [ci, deleting, wi, words]);

//   return <span style={{ color: "var(--blue-pale)" }} className="typewriter-cursor">{text}</span>;
// }

// export default function Hero() {
//   const r0 = useReveal(0);
//   const r1 = useReveal(0.1);
//   const r2 = useReveal(0.2);
//   const r3 = useReveal(0.3);
//   const r4 = useReveal(0.4);

//   return (
//     <section
//       id="hero"
//       className="relative z-10 min-h-screen"
//       style={{
//         display: "grid",
//         gridTemplateColumns: "1fr auto",
//         alignItems: "center",
//         gap: "3rem",
//         padding: "calc(70px + 4rem) 2rem 4rem",
//         maxWidth: 1100,
//         margin: "0 auto",
//       }}
//     >
//       {/* ── LEFT CONTENT ── */}
//       <div style={{ maxWidth: 620 }}>

//         {/* Eyebrow */}
//         {/* <div ref={r0} className="reveal">
//           <span
//             className="inline-flex items-center gap-2 font-mono-custom"
//             style={{
//               fontSize: "0.78rem", letterSpacing: "0.1em",
//               padding: "0.35rem 1rem", borderRadius: 999, marginBottom: "1.5rem", display: "inline-flex",
//               color: "var(--cyan)", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)",
//             }}
//           >
//             Hello, World 👋
//           </span>
//         </div> */}

//         {/* Name */}
//         <div ref={r1} className="reveal">
//           <h1
//             className="font-syne font-black"
//             style={{ fontSize: "clamp(3rem,7vw,5.5rem)", lineHeight: 1.0, letterSpacing: "-2px", marginBottom: "1.25rem" }}
//           >
//             <span style={{ display: "block", color: "var(--white)" }}>Janmenjaya</span>
//             <span
//               style={{
//                 display: "block",
//                 background: "linear-gradient(135deg, var(--blue-light), var(--cyan-light))",
//                 WebkitBackgroundClip: "text",
//                 WebkitTextFillColor: "transparent",
//                 backgroundClip: "text",
//               }}
//             >
//               Biswal
//             </span>
//           </h1>
//         </div>

//         {/* Typewriter row */}
//         <div
//           ref={r2}
//           className="reveal font-mono-custom"
//           style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.25rem", fontSize: "1.05rem", color: "var(--muted)", marginBottom: "1.5rem" }}
//         >
//           <span>I build &nbsp;</span>
//           <Typewriter words={DATA.typewriterWords} />
//         </div>

//         {/* Description */}
//         <div ref={r3} className="reveal" style={{ marginBottom: "2rem" }}>
//           <p style={{ fontSize: "1.02rem", lineHeight: 1.85, maxWidth: 540, color: "var(--text)" }}>
//             Frontend Developer with{" "}
//             <strong style={{ color: "var(--white)", fontWeight: 600 }}>3 years of experience</strong>{" "}
//             crafting performant, scalable web applications. Based in{" "}
//             <strong style={{ color: "var(--white)", fontWeight: 600 }}>Pune, Maharashtra</strong> — currently at{" "}
//             <strong style={{ color: "var(--white)", fontWeight: 600 }}>e2eHiring</strong>, shipping products for IFAS Educate.
//           </p>
//         </div>

//         {/* CTA + Stats */}
//         <div ref={r4} className="reveal">
//           {/* Buttons */}
//           <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
//             <a
//               href="#projects"
//               style={{ display: "inline-flex", alignItems: "center", padding: "0.75rem 1.75rem", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem", color: "#fff", background: "var(--blue)", transition: "all 0.2s" }}
//               onMouseEnter={e => { e.currentTarget.style.background = "var(--blue-light)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.35)"; }}
//               onMouseLeave={e => { e.currentTarget.style.background = "var(--blue)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
//               className="no-underline"
//             >
//               View My Work
//             </a>
//             <a
//               href="#contact"
//               style={{ display: "inline-flex", alignItems: "center", padding: "0.75rem 1.75rem", borderRadius: 10, fontWeight: 500, fontSize: "0.9rem", color: "var(--text)", border: "1px solid var(--border2)", transition: "all 0.2s" }}
//               onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.color = "var(--white)"; e.currentTarget.style.background = "var(--glow)"; }}
//               onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "transparent"; }}
//              className="no-underline"
//             >
//               Get In Touch
//             </a>
//           </div>

//           {/* Stats */}
//           <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
//             {DATA.stats.map((s, i) => (
//               <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//                 {i > 0 && (
//                   <div style={{ width: 1, height: 36, background: "var(--border)", flexShrink: 0 }} />
//                 )}
//                 <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
//                   <span className="font-syne" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--white)", lineHeight: 1 }}>{s.num}</span>
//                   <span className="font-mono-custom" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--muted)" }}>{s.label}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ── RIGHT VISUAL ── */}
//       <div
//         className="relative"
//         style={{ width: 280, height: 280, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
//       >
//         {/* Orbiting rings */}
//         {(
//           [
//             { size: 160, dur: "8s",  cls: "orbit-cw",  dotColor: "var(--blue)" },
//             { size: 210, dur: "12s", cls: "orbit-ccw", dotColor: "var(--cyan-light)" },
//             { size: 265, dur: "18s", cls: "orbit-cw",  dotColor: "var(--blue-pale)" },
//           ] as const
//         ).map((o, i) => (
//           <div
//             key={i}
//             className={o.cls}
//             style={{
//               position: "absolute", borderRadius: "50%",
//               width: o.size, height: o.size,
//               border: "1px dashed var(--border)",
//               animationDuration: o.dur,
//             }}
//           >
//             <div
//               style={{
//                 position: "absolute", top: -4, left: "50%",
//                 transform: "translateX(-50%)",
//                 width: 8, height: 8, borderRadius: "50%",
//                 background: o.dotColor,
//               }}
//             />
//           </div>
//         ))}

//         {/* Avatar core */}
//         <div
//           className="font-syne font-black"
//           style={{
//             position: "relative", zIndex: 10,
//             width: 110, height: 110, borderRadius: "50%",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             fontSize: "2rem", color: "var(--white)",
//             background: "linear-gradient(135deg, var(--bg3), var(--bg4))",
//             border: "2px solid var(--border2)",
//             boxShadow: "0 0 40px rgba(59,130,246,0.2)",
//           }}
//         >
//           JB
//         </div>

//         {/* Floating tech tags */}
//         {(
//           [
//             { text: "<React />",    delay: "0s",   top: "10%",  left: "-20%" },
//             { text: "Next.js",      delay: "0.7s", top: "8%",   right: "-14%" },
//             { text: "TypeScript",   delay: "1.4s", bottom: "18%", left: "-24%" },
//             { text: "React Native", delay: "2.1s", bottom: "10%", right: "-20%" },
//           ] as const
//         ).map((t) => (
//           <div
//             key={t.text}
//             className="float-anim font-mono-custom"
//             style={{
//               position: "absolute",
//               top: "top" in t ? t.top : undefined,
//               bottom: "bottom" in t ? t.bottom : undefined,
//               left: "left" in t ? t.left : undefined,
//               right: "right" in t ? t.right : undefined,
//               animationDelay: t.delay,
//               fontSize: "0.7rem", padding: "0.3rem 0.7rem", borderRadius: 8,
//               background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--blue-pale)",
//               whiteSpace: "nowrap",
//             }}
//           >
//             {t.text}
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

"use client";
import { useEffect, useState, useRef } from "react";
import styles from "../styles/hero.module.css";
import ArrowPillButton from "./ArrowPillButton";
import { usePortfolio } from "./PortfolioProvider";

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transitionDelay = delay + "s";
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

function Typewriter({ words }: { words: string[] }) {
  const [text, setText] = useState("");
  const [wi, setWi] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [ci, setCi] = useState(0);

  useEffect(() => {
    const word = words[wi];
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          setText(word.slice(0, ci + 1));
          if (ci + 1 === word.length) {
            setTimeout(() => setDeleting(true), 1800);
          } else {
            setCi(ci + 1);
          }
        } else {
          setText(word.slice(0, ci - 1));
          if (ci - 1 === 0) {
            setDeleting(false);
            setWi((wi + 1) % words.length);
            setCi(0);
          } else {
            setCi(ci - 1);
          }
        }
      },
      deleting ? 55 : 90,
    );
    return () => clearTimeout(timeout);
  }, [ci, deleting, wi, words]);

  return (
    <span style={{ color: "var(--blue-pale)" }} className="typewriter-cursor">
      {text}
    </span>
  );
}

const orbitRings = [
  {
    size: 160,
    dur: "8s",
    cls: "orbit-cw",
    dotColor: "var(--blue)",
    ringCls: styles.orbitRing0,
  },
  {
    size: 210,
    dur: "12s",
    cls: "orbit-ccw",
    dotColor: "var(--cyan-light)",
    ringCls: styles.orbitRing1,
  },
  {
    size: 265,
    dur: "18s",
    cls: "orbit-cw",
    dotColor: "var(--blue-pale)",
    ringCls: styles.orbitRing2,
  },
] as const;

const floatTags = [
  {
    text: "<React />",
    delay: "0s",
    top: "10%",
    left: "-20%",
    bottom: undefined,
    right: undefined,
  },
  {
    text: "Next.js",
    delay: "0.7s",
    top: "8%",
    right: "-14%",
    bottom: undefined,
    left: undefined,
  },
  {
    text: "TypeScript",
    delay: "1.4s",
    bottom: "18%",
    left: "-24%",
    top: undefined,
    right: undefined,
  },
  {
    text: "React Native",
    delay: "2.1s",
    bottom: "10%",
    right: "-20%",
    top: undefined,
    left: undefined,
  },
];

export default function Hero() {
  const DATA = usePortfolio();
  const words = DATA.typewriterWords.filter((w) => w.trim());
  const r1 = useReveal(0.0);
  const r2 = useReveal(0.1);
  const r3 = useReveal(0.2);
  const r4 = useReveal(0.3);

  return (
    <section id="hero" className={styles.heroSection}>
      {/* ── LEFT CONTENT ── */}
      <div className={styles.heroLeft}>
        {/* Name */}
        <div ref={r1} className="reveal">
          <h1 className={`${styles.heroName} font-syne font-black`}>
            <span style={{ display: "block", color: "var(--white)" }}>
              Janmenjaya
            </span>
            <span
              style={{
                display: "block",
                background:
                  "linear-gradient(135deg, var(--blue-light), var(--cyan-light))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Biswal
            </span>
          </h1>
        </div>

        {/* Typewriter */}
        <div
          ref={r2}
          className={`${styles.heroTypewriter} reveal font-mono-custom`}
        >
          {words.length > 0 && (
            <>
              <span>I build &nbsp;</span>
              <Typewriter words={words} />
            </>
          )}
        </div>

        {/* Description */}
        <div ref={r3} className={`${styles.heroDescWrap} reveal`}>
          <p className={styles.heroDesc}>
            Frontend Developer with{" "}
            <strong style={{ color: "var(--white)", fontWeight: 600 }}>
              3 years of experience
            </strong>{" "}
            crafting performant, scalable web applications. Based in{" "}
            <strong style={{ color: "var(--white)", fontWeight: 600 }}>
              Pune, Maharashtra
            </strong>{" "}
            — currently at{" "}
            <strong style={{ color: "var(--white)", fontWeight: 600 }}>
              IFAS Educate
            </strong>
            , building ed-tech products that help students across India crack
            competitive exams. Previously at{" "}
            <strong style={{ color: "var(--white)", fontWeight: 600 }}>
              e2eHiring
            </strong>
            .
          </p>
        </div>

        {/* CTA + Stats */}
        <div ref={r4} className="reveal">
          {/* Buttons */}
          <div className={styles.heroCta}>
            <ArrowPillButton href="#projects">View My Work</ArrowPillButton>
            <ArrowPillButton href="#contact" variant="ghost">
              Get In Touch
            </ArrowPillButton>
          </div>

          {/* Stats */}
          <div className={styles.heroStats}>
            {DATA.stats.map((s, i) => (
              <div
                key={s.num}
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                {i > 0 && (
                  <div
                    style={{
                      width: 1,
                      height: 36,
                      background: "var(--border)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  <span className={`${styles.statNum} font-syne`}>{s.num}</span>
                  <span
                    className="font-mono-custom"
                    style={{
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      color: "var(--muted)",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT VISUAL ── */}
      <div className={styles.heroVisual}>
        {/* Orbit rings */}
        {orbitRings.map((o, i) => (
          <div
            key={i}
            className={`${o.cls} ${o.ringCls}`}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: "1px dashed var(--border)",
              animationDuration: o.dur,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -4,
                left: "50%",
                transform: "translateX(-50%)",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: o.dotColor,
              }}
            />
          </div>
        ))}

        {/* Avatar */}
        <div className={`${styles.heroAvatar} font-syne font-black`}>JB</div>

        {/* Float tags */}
        {floatTags.map((t) => (
          <div
            key={t.text}
            className={`${styles.floatTag} float-anim font-mono-custom`}
            style={{
              top: t.top,
              bottom: t.bottom,
              left: t.left,
              right: t.right,
              animationDelay: t.delay,
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </section>
  );
}
