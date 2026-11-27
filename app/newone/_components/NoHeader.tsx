"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../_styles/header.module.css";

type Props = {
  name: string;
  role: string;
  available: boolean;
};

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

/* Top bar: name, role, status, section links. On small screens the links move into a full-screen menu. */
export default function NoHeader({ name, role, available }: Props) {
  const [open, setOpen] = useState(false);

  // While the menu is open: lock page scroll and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className={`${styles.noHeader} ${open ? styles.noHeaderOpen : ""}`}>
      <Link href="/newone" className={styles.noHeaderName} aria-label={`${name} — back to the intro`}>
        {name}
        <span className={styles.noHeaderDots} aria-hidden="true">
          <i />
          <i />
        </span>
      </Link>

      <span className={styles.noHeaderRole}>{role}</span>

      {available ? (
        <span className={styles.noHeaderStatus}>
          <span className={styles.noHeaderPulse} aria-hidden="true" />
          Open to new opportunities
        </span>
      ) : null}

      <nav className={styles.noHeaderNav} aria-label="Sections">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className={styles.noHeaderLink}>
            {l.label}
          </a>
        ))}
      </nav>

      <button
        type="button"
        className={styles.noHeaderMenuBtn}
        aria-expanded={open}
        aria-controls="no-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
        <span className={`${styles.noHeaderMenuDots} ${open ? styles.noHeaderMenuDotsOpen : ""}`} aria-hidden="true">
          <i />
          <i />
        </span>
      </button>

      <div id="no-menu" className={`${styles.noMenu} ${open ? styles.noMenuOpen : ""}`} hidden={!open}>
        <nav aria-label="Menu">
          <ul className={styles.noMenuList}>
            {LINKS.map((l, i) => (
              <li key={l.href}>
                <a href={l.href} className={styles.noMenuLink} onClick={() => setOpen(false)}>
                  <span className={styles.noMenuIndex}>{String(i + 1).padStart(2, "0")}</span>
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/" className={styles.noMenuLink} onClick={() => setOpen(false)}>
                <span className={styles.noMenuIndex}>04</span>
                Classic site
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
