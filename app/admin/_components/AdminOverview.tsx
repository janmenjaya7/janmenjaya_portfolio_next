"use client";
import { Award, Briefcase, CodeXml, Database, FolderKanban, RotateCcw } from "lucide-react";
import type { PortfolioData } from "../../data";
import type { StoreSource } from "../../lib/portfolio-store";
import Tooltip from "./Tooltip";
import styles from "../_styles/admin.module.css";

type Props = {
  data: PortfolioData;
  source: StoreSource;
  storeConfigured: boolean;
  onOpen: (groupId: string) => void;
  onResetAll: () => void;
  resetting: boolean;
};

export default function AdminOverview({ data, source, storeConfigured, onOpen, onResetAll, resetting }: Props) {
  const liveProjects = data.projects.filter((p) => p.status === "live").length;
  const skillCount = data.skills.reduce((n, c) => n + c.items.length, 0);
  const avgLevel = skillCount
    ? Math.round(data.skills.reduce((n, c) => n + c.items.reduce((m, i) => m + i.level, 0), 0) / skillCount)
    : 0;

  const metrics = [
    {
      id: "projects",
      label: "Projects",
      value: data.projects.length,
      icon: FolderKanban,
      badge: `${liveProjects} live`,
      tone: "ok" as const,
    },
    {
      id: "skills",
      label: "Skills",
      value: skillCount,
      icon: CodeXml,
      badge: skillCount ? `avg ${avgLevel}%` : "none yet",
      tone: skillCount ? ("ok" as const) : ("warn" as const),
    },
    {
      id: "experience",
      label: "Roles",
      value: data.experience.length,
      icon: Briefcase,
      badge: data.experience.some((e) => e.current) ? "currently working" : "no current role",
      tone: "ok" as const,
    },
    {
      id: "credentials",
      label: "Credentials",
      value: data.credentials.length,
      icon: Award,
      badge: `${data.techPills.length} tech pills`,
      tone: "ok" as const,
    },
  ];

  const status = !storeConfigured
    ? { tone: "warn", text: "Redis is not configured — showing defaults. Saving is disabled until the Upstash env variables are set." }
    : source === "error"
      ? { tone: "danger", text: "Couldn't reach Redis. Showing defaults; saving is blocked to protect your data. Refresh to retry." }
      : source === "default"
        ? { tone: "info", text: "Connected. Nothing saved yet — the site uses the defaults. Your first save stores everything in Redis." }
        : { tone: "ok", text: "Connected to Redis. The live site shows the content below." };

  return (
    <div className={styles.admOverview}>
      <section className={styles.admCard} aria-labelledby="adm-overview-title">
        <h2 id="adm-overview-title" className={styles.admCardTitle}>Overview</h2>
        <div className={styles.admMetrics}>
          {metrics.map((m) => (
            <Tooltip key={m.id} title={`Open ${m.label}`} text={`Edit your ${m.label.toLowerCase()} — ${m.badge}.`}>
              <button type="button" className={styles.admMetric} onClick={() => onOpen(m.id)}>
                <span className={styles.admMetricIcon}>
                  <m.icon size={22} aria-hidden="true" />
                </span>
                <span className={styles.admMetricLabel}>{m.label}</span>
                <span className={styles.admMetricValue}>{m.value}</span>
                <span className={`${styles.admPill} ${m.tone === "ok" ? styles.admPillOk : styles.admPillWarn}`}>
                  {m.badge}
                </span>
              </button>
            </Tooltip>
          ))}
        </div>
      </section>

      <section className={styles.admCard} aria-labelledby="adm-storage-title">
        <h2 id="adm-storage-title" className={styles.admCardTitle}>Storage</h2>
        <div className={`${styles.admStatus} ${styles[`admStatus_${status.tone}`]}`} role="status">
          <Database size={18} aria-hidden="true" />
          <p>{status.text}</p>
        </div>
        <div className={styles.admProfileRow}>
          <div>
            <p className={styles.admMuted}>Showing as</p>
            <p className={styles.admStrong}>{data.name || "—"}</p>
            <p className={styles.admMuted}>{data.role || "—"}</p>
          </div>
          <Tooltip
            title="Reset to defaults"
            text="Deletes everything saved in Redis and goes back to the content in data.ts. Asks to confirm first."
          >
            <button
              type="button"
              className={styles.admGhostBtn}
              onClick={onResetAll}
              disabled={!storeConfigured || source !== "redis" || resetting}
            >
              <RotateCcw size={16} aria-hidden="true" />
              {resetting ? "Resetting…" : "Reset to defaults"}
            </button>
          </Tooltip>
        </div>
      </section>
    </div>
  );
}
