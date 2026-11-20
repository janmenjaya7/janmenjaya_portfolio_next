"use client";
import { useState, useEffect } from "react";
import { DATA } from "../data";

const links = DATA.navLinks;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scrollTo = (id: string) => {
    setOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 10);
  };

  return (
    <>
      <style>{`
        .nav-links { display: none; }
        .nav-hire  { display: none; }
        .hamburger { display: flex; }

        @media (min-width: 768px) {
          .nav-links  { display: flex; }
          .nav-hire   { display: inline-flex; }
          .hamburger  { display: none; }
          .mobile-menu { display: none !important; }
          .mobile-backdrop { display: none !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 70,
          background:
            mounted && scrolled ? "rgba(5,13,28,0.92)" : "transparent",
          backdropFilter: mounted && scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: mounted && scrolled ? "blur(20px)" : "none",
          borderBottom:
            mounted && scrolled
              ? "1px solid var(--border)"
              : "1px solid transparent",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("hero");
            }}
            className="font-syne"
            style={{
              fontWeight: 800,
              fontSize: "1.4rem",
              color: "var(--white)",
              textDecoration: "none",
              flexShrink: 0,
              letterSpacing: "-0.5px",
            }}
          >
            JB<span style={{ color: "var(--cyan-light)" }}>.</span>
          </a>

          {/* Desktop links */}
          <ul
            className="nav-links"
            style={{ listStyle: "none", gap: "0.25rem", marginLeft: "auto" }}
          >
            {links.map((l) => (
              <li key={l}>
                <a
                  href={`#${l.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(l.toLowerCase());
                  }}
                  className="font-medium"
                  style={{
                    display: "block",
                    padding: "0.4rem 0.9rem",
                    fontSize: "0.85rem",
                    color: "var(--muted)",
                    borderRadius: 8,
                    textDecoration: "none",
                    transition: "color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--white)";
                    e.currentTarget.style.background = "rgba(59,130,246,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop Hire Me */}
          <a
            href={`mailto:${DATA.email}`}
            className="nav-hire font-semibold"
            style={{
              alignItems: "center",
              padding: "0.45rem 1.2rem",
              background: "var(--blue)",
              color: "#fff",
              borderRadius: 8,
              fontSize: "0.85rem",
              textDecoration: "none",
              flexShrink: 0,
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--blue-light)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--blue)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Hire Me
          </a>

          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="hamburger"
            style={{
              marginLeft: "auto",
              flexShrink: 0,
              flexDirection: "column",
              justifyContent: "center",
              gap: 5,
              width: 36,
              height: 36,
              padding: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: "100%",
                  height: 2,
                  background: "var(--white)",
                  borderRadius: 2,
                  transition: "transform 0.3s ease, opacity 0.3s ease",
                  transformOrigin: "center",
                  ...(open && i === 0
                    ? { transform: "translateY(7px) rotate(45deg)" }
                    : {}),
                  ...(open && i === 1
                    ? { opacity: 0, transform: "scaleX(0)" }
                    : {}),
                  ...(open && i === 2
                    ? { transform: "translateY(-7px) rotate(-45deg)" }
                    : {}),
                }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      <div
        className="mobile-menu"
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 70,
          left: 0,
          right: 0,
          zIndex: 999,
          background: "rgba(5,13,28,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--border)",
          padding: "1rem 1.5rem 1.5rem",
          transform: open ? "translateY(0)" : "translateY(-6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 0.25s ease, opacity 0.25s ease",
        }}
      >
        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {links.map((l) => (
            <li key={l}>
              <a
                href={`#${l.toLowerCase()}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(l.toLowerCase());
                }}
                style={{
                  display: "block",
                  padding: "0.85rem 1rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "var(--text)",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59,130,246,0.12)";
                  e.currentTarget.style.color = "var(--white)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text)";
                }}
              >
                {l}
              </a>
            </li>
          ))}

          {/* Mobile Hire Me */}
          <li
            style={{
              marginTop: "0.75rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            <a
              href={`mailto:${DATA.email}`}
              style={{
                display: "block",
                textAlign: "center",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                background: "var(--blue)",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--blue-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--blue)")
              }
            >
              Hire Me ✉
            </a>
          </li>
        </ul>
      </div>

      {/* Backdrop */}
      <div
        className="mobile-backdrop"
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 998,
          background: "rgba(0,0,0,0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />
    </>
  );
}
