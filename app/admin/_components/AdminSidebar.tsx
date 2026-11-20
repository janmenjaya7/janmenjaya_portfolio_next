"use client";
import { useState } from "react";
import { ChevronDown, ExternalLink, Layers, LayoutGrid, LogOut } from "lucide-react";
import type { PortfolioData } from "../../data";
import { CONTENT_GROUPS } from "../_lib/sections";
import styles from "../_styles/admin.module.css";

type Props = {
  active: string;
  data: PortfolioData;
  dirtyGroups: Set<string>;
  onSelect: (id: string) => void;
  onLogout: () => void;
  loggingOut: boolean;
};

export default function AdminSidebar({ active, data, dirtyGroups, onSelect, onLogout, loggingOut }: Props) {
  const [contentOpen, setContentOpen] = useState(true);

  return (
    <aside className={styles.admSidebar}>
      <div className={styles.admBrand}>
        <span className={styles.admLogo}>
          JB<span className={styles.admLogoDot}>.</span>
        </span>
        <span className={styles.admBrandText}>Admin</span>
      </div>

      <nav className={styles.admNav} aria-label="Admin sections">
        <button
          type="button"
          className={`${styles.admNavItem} ${active === "overview" ? styles.admNavItemActive : ""}`}
          aria-current={active === "overview" ? "page" : undefined}
          onClick={() => onSelect("overview")}
        >
          <LayoutGrid size={20} aria-hidden="true" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={`${styles.admNavItem} ${styles.admNavParent}`}
          aria-expanded={contentOpen}
          onClick={() => setContentOpen((v) => !v)}
        >
          <Layers size={20} aria-hidden="true" />
          <span>Content</span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`${styles.admNavChevron} ${contentOpen ? styles.admNavChevronOpen : ""}`}
          />
        </button>

        {contentOpen && (
          <ul className={styles.admSubNav}>
            {CONTENT_GROUPS.map((g) => {
              const isActive = active === g.id;
              const dirty = dirtyGroups.has(g.id);
              const count = g.count?.(data);
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    className={`${styles.admSubItem} ${isActive ? styles.admSubItemActive : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect(g.id)}
                  >
                    <span>{g.label}</span>
                    {dirty ? (
                      <span className={`${styles.admBadge} ${styles.admBadgeWarn}`} title="Unsaved changes">
                        •
                      </span>
                    ) : count !== undefined ? (
                      <span className={`${styles.admBadge} ${styles.admBadgeOk}`}>{count}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className={styles.admSideFoot}>
        <a href="/" target="_blank" rel="noopener noreferrer" className={styles.admNavItem}>
          <ExternalLink size={20} aria-hidden="true" />
          <span>View site</span>
        </a>
        <button type="button" className={styles.admNavItem} onClick={onLogout} disabled={loggingOut}>
          <LogOut size={20} aria-hidden="true" />
          <span>{loggingOut ? "Logging out…" : "Log out"}</span>
        </button>
      </div>
    </aside>
  );
}
