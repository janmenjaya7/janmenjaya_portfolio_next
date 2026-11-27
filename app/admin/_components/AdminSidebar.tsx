"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChartNoAxesColumn, ChevronDown, FileText, Globe, Inbox, Layers, LayoutGrid, LogOut } from "lucide-react";
import type { PortfolioData } from "../../data";
import { CONTENT_GROUPS } from "../_lib/sections";
import BrandLogo from "../../components/BrandLogo";
import Tooltip from "./Tooltip";
import styles from "../_styles/admin.module.css";

type Props = {
  active: string;
  data: PortfolioData;
  dirtyGroups: Set<string>;
  unreadCount: number;
  onSelect: (id: string) => void;
  onLogout: () => void;
  loggingOut: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "A").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

/* Brand (fixed) · scrollable section list · account card (fixed) */
export default function AdminSidebar({ active, data, dirtyGroups, unreadCount, onSelect, onLogout, loggingOut }: Props) {
  const [contentOpen, setContentOpen] = useState(true);
  const navRef = useRef<HTMLElement>(null);

  // Keep the active item fully visible in the scrolling nav: centred in the phone/tablet strip, and scrolled into
  // view (only if it isn't already) in the desktop sidebar — never hidden under the edge fade or cut off
  useEffect(() => {
    const nav = navRef.current;
    const item = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !item) return;
    let behavior: ScrollBehavior = "smooth";
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) behavior = "auto";
    } catch {
      /* keep smooth */
    }
    const navBox = nav.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    if (nav.scrollWidth > nav.clientWidth + 1) {
      const left = nav.scrollLeft + (itemBox.left - navBox.left) - (nav.clientWidth - itemBox.width) / 2;
      nav.scrollTo({ left: Math.max(0, left), behavior });
    } else if (nav.scrollHeight > nav.clientHeight + 1) {
      const edge = 20; // keep clear of the top/bottom fade
      if (itemBox.top < navBox.top + edge) nav.scrollTo({ top: Math.max(0, nav.scrollTop - (navBox.top + edge - itemBox.top)), behavior });
      else if (itemBox.bottom > navBox.bottom - edge) nav.scrollTo({ top: nav.scrollTop + (itemBox.bottom - (navBox.bottom - edge)), behavior });
    }
  }, [active, contentOpen]);
  const totalItems = CONTENT_GROUPS.reduce((n, g) => n + (g.count?.(data) ?? 0), 0);

  return (
    <aside className={styles.admSidebar}>
      <div className={styles.admBrand}>
        <BrandLogo size={48} />
        <span className={styles.admBrandText}>
          <span className={styles.admBrandEyebrow}>Portfolio</span>
          <span className={styles.admBrandTitle}>Admin</span>
        </span>
      </div>

      <nav ref={navRef} className={styles.admNav} aria-label="Admin sections">
        <Tooltip side="right" title="Dashboard" text="Overview of your content and Redis storage status.">
          <button
            type="button"
            className={`${styles.admNavItem} ${active === "overview" ? styles.admNavItemActive : ""}`}
            aria-current={active === "overview" ? "page" : undefined}
            onClick={() => onSelect("overview")}
          >
            <LayoutGrid size={20} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        </Tooltip>

        <Tooltip
          side="right"
          title={unreadCount ? `Messages · ${unreadCount} unread` : "Messages"}
          text="Everything people sent through the contact form."
        >
          <button
            type="button"
            className={`${styles.admNavItem} ${active === "messages" ? styles.admNavItemActive : ""}`}
            aria-current={active === "messages" ? "page" : undefined}
            onClick={() => onSelect("messages")}
          >
            <Inbox size={20} aria-hidden="true" />
            <span>Messages</span>
            {unreadCount > 0 && (
              <span className={`${styles.admBadge} ${styles.admBadgeUnread}`} aria-label={`${unreadCount} unread`}>
                {unreadCount}
              </span>
            )}
          </button>
        </Tooltip>

        <Tooltip side="right" title="Visitors" text="Who visited your site, where they came from and what they clicked.">
          <button
            type="button"
            className={`${styles.admNavItem} ${active === "visitors" ? styles.admNavItemActive : ""}`}
            aria-current={active === "visitors" ? "page" : undefined}
            onClick={() => onSelect("visitors")}
          >
            <ChartNoAxesColumn size={20} aria-hidden="true" />
            <span>Visitors</span>
          </button>
        </Tooltip>

        <Tooltip side="right" title="Resume" text="Upload or replace the PDF behind the “Download resume” button.">
          <button
            type="button"
            className={`${styles.admNavItem} ${active === "resume" ? styles.admNavItemActive : ""}`}
            aria-current={active === "resume" ? "page" : undefined}
            onClick={() => onSelect("resume")}
          >
            <FileText size={20} aria-hidden="true" />
            <span>Resume</span>
          </button>
        </Tooltip>

        <Tooltip
          side="right"
          title={contentOpen ? "Collapse content" : "Expand content"}
          text={`${totalItems} items across ${CONTENT_GROUPS.length} sections.`}
        >
        <button
          type="button"
          className={`${styles.admNavItem} ${styles.admNavParent}`}
          aria-expanded={contentOpen}
          onClick={() => setContentOpen((v) => !v)}
        >
          <Layers size={20} aria-hidden="true" />
          <span>Content</span>
          <span className={`${styles.admBadge} ${styles.admBadgeTotal}`}>{totalItems}</span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`${styles.admNavChevron} ${contentOpen ? styles.admNavChevronOpen : ""}`}
          />
        </button>
        </Tooltip>

        {contentOpen && (
          <ul className={styles.admSubNav}>
            {CONTENT_GROUPS.map((g) => {
              const isActive = active === g.id;
              const dirty = dirtyGroups.has(g.id);
              const count = g.count?.(data);
              return (
                <li key={g.id}>
                  <Tooltip
                    side="right"
                    title={dirty ? `${g.label} · unsaved changes` : count !== undefined ? `${g.label} · ${count} items` : g.label}
                    text={g.description}
                  >
                  <button
                    type="button"
                    className={`${styles.admSubItem} ${isActive ? styles.admSubItemActive : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect(g.id)}
                  >
                    <span className={styles.admSubIcon} aria-hidden="true">
                      <g.icon size={16} strokeWidth={2.1} />
                    </span>
                    <span className={styles.admSubLabel}>{g.label}</span>
                    {dirty ? (
                      <span className={`${styles.admBadge} ${styles.admBadgeWarn}`}>•</span>
                    ) : count !== undefined ? (
                      <span className={`${styles.admBadge} ${styles.admBadgeOk}`}>{count}</span>
                    ) : null}
                  </button>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className={styles.admSideFoot}>
        <div className={styles.admUser}>
          <span className={styles.admAvatar} aria-hidden="true">
            {initials(data.name || "Admin")}
            <span className={styles.admOnline} />
          </span>
          <span className={styles.admUserText}>
            <span className={styles.admUserName}>{data.name || "Admin"}</span>
            <span className={styles.admUserRole}>Signed in · Admin</span>
          </span>
        </div>

        <div className={styles.admFootActions}>
          <Tooltip title="View live site" text="Opens your portfolio in a new tab.">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.admFootBtn} ${styles.admFootSite}`}
            >
              <Globe size={16} aria-hidden="true" />
              <span>View site</span>
              <ArrowUpRight size={15} aria-hidden="true" className={styles.admFootArrow} />
            </a>
          </Tooltip>
          <Tooltip title="Log out" text="Ends this admin session. You'll need a new email code to come back.">
            <button
              type="button"
              className={`${styles.admFootBtn} ${styles.admFootLogout}`}
              onClick={onLogout}
              disabled={loggingOut}
            >
              <LogOut size={16} aria-hidden="true" className={styles.admFootLogoutIcon} />
              <span>{loggingOut ? "Leaving…" : "Log out"}</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
