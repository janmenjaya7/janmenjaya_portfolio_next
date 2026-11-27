"use client";
/*
  Admin dashboard. Designed to answer, in order: "is everything OK?" → "what's new?" → "what should I fix?" → "where do
  I edit X?". Headline tiles are clickable shortcuts; the checklist turns content gaps into one-click fixes.
*/
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  CircleCheck,
  Database,
  FolderKanban,
  Inbox,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import type { PortfolioData } from "../../data";
import type { VisitorSummary } from "../../lib/analytics";
import { contentHealth } from "../../lib/content-health";
import type { ContactMessage } from "../../lib/messages";
import type { StoreSource } from "../../lib/portfolio-store";
import { adminApi, ApiError } from "../_lib/api";
import { CONTENT_GROUPS } from "../_lib/sections";
import Tooltip from "./Tooltip";
import ov from "../_styles/overview.module.css";

type Props = {
  data: PortfolioData;
  source: StoreSource;
  storeConfigured: boolean;
  messages: ContactMessage[];
  onOpen: (groupId: string) => void;
  onResetAll: () => void;
  resetting: boolean;
};

type Visitors = { state: "loading" } | { state: "ready"; data: VisitorSummary } | { state: "unavailable"; reason: string };

const OFFLINE = ["lurnigo.com", "anjanasamaj.in", "elalearn.com"];
const ISSUES_COLLAPSED = 5;

function greeting(h: number): string {
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(iso: string, now: number): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const m = Math.round((now - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(t));
}

/* tiny trend line for the visitors tile */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const w = 120;
  const h = 34;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 6)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg className={ov.ovSpark} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${line} L${w},${h} L0,${h} Z`} className={ov.ovSparkArea} />
      <path d={line} className={ov.ovSparkLine} />
    </svg>
  );
}

/* content-health ring */
function Ring({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const tone = value >= 90 ? ov.ovRingGood : value >= 70 ? ov.ovRingOk : ov.ovRingLow;
  return (
    <svg className={`${ov.ovRing} ${tone}`} viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} className={ov.ovRingTrack} />
      <circle cx="28" cy="28" r={r} className={ov.ovRingValue} strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 28 28)" />
    </svg>
  );
}

export default function AdminOverview({ data, source, storeConfigured, messages, onOpen, onResetAll, resetting }: Props) {
  const [visitors, setVisitors] = useState<Visitors>(() =>
    storeConfigured ? { state: "loading" } : { state: "unavailable", reason: "Needs Redis" },
  );
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [now] = useState(() => Date.now());

  // visitors for the headline tile; only the latest response is applied, failures show a calm "unavailable"
  useEffect(() => {
    if (!storeConfigured) return;
    let cancelled = false; // a response arriving after unmount (or a newer request) is ignored
    adminApi
      .getVisitors(7)
      .then((d) => {
        if (!cancelled) setVisitors({ state: "ready", data: d });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVisitors({ state: "unavailable", reason: err instanceof ApiError && err.status === 401 ? "Sign in again" : "Couldn't load" });
      });
    return () => {
      cancelled = true;
    };
  }, [storeConfigured]);

  const health = useMemo(() => contentHealth(data), [data]);
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const offline = projects.filter((p) => OFFLINE.some((h) => (p.url ?? "").includes(h))).length;
  const live = projects.filter((p) => p.status === "live").length - offline;
  const safeMessages = Array.isArray(messages) ? messages : [];
  const unread = safeMessages.filter((m) => !m.read).length;
  const latest = safeMessages.slice(0, 3);
  const firstName = (data.name ?? "").trim().split(/\s+/)[0] || "there";
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(now));
  const issues = showAllIssues ? health.issues : health.issues.slice(0, ISSUES_COLLAPSED);

  const status = !storeConfigured
    ? { tone: "warn", short: "Saving disabled", text: "Redis isn't configured, so the site shows the built-in content and saving is turned off until the Upstash settings are added." }
    : source === "error"
      ? { tone: "danger", short: "Storage unreachable", text: "Couldn't reach Redis. The built-in content is shown and saving is blocked to protect your data. Refresh to try again." }
      : source === "default"
        ? { tone: "info", short: "Using defaults", text: "Connected. Nothing saved yet — the site shows the built-in content. Your first save stores everything in Redis." }
        : { tone: "ok", short: "All systems normal", text: "Connected to Redis. The live site shows the content you see here." };

  return (
    <div className={ov.ov}>
      {/* ── welcome ── */}
      <section className={ov.ovHello} aria-labelledby="ov-hello">
        <div>
          <p className={ov.ovDate}>{date}</p>
          <h2 id="ov-hello" className={ov.ovHelloTitle}>
            {greeting(new Date(now).getHours())}, {firstName}
          </h2>
          <p className={`${ov.ovStatus} ${ov[`ovStatus_${status.tone}`]}`}>
            <span className={ov.ovStatusDot} aria-hidden="true" />
            {status.short}
          </p>
        </div>
        <div className={ov.ovHelloActions}>
          <a className={ov.ovBtnPrimary} href="/" target="_blank" rel="noopener noreferrer">
            View site <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <button type="button" className={ov.ovBtnGhost} onClick={() => onOpen("profile")}>
            Edit profile
          </button>
        </div>
      </section>

      {/* ── headline tiles ── */}
      <ul className={ov.ovTiles} aria-label="At a glance">
        <li>
          <button type="button" className={ov.ovTile} onClick={() => onOpen("visitors")}>
            <span className={ov.ovTileHead}>
              <Users size={16} aria-hidden="true" /> Visitors · 7 days
            </span>
            {visitors.state === "loading" ? (
              <span className={ov.ovTileSkeleton} aria-label="Loading visitors" />
            ) : visitors.state === "ready" ? (
              <>
                <span className={ov.ovTileValue}>{visitors.data.totals.visitors}</span>
                <span className={ov.ovTileSub}>
                  {visitors.data.totals.visits} visit{visitors.data.totals.visits === 1 ? "" : "s"}
                  {visitors.data.totals.liveNow ? ` · ${visitors.data.totals.liveNow} on the site now` : ""}
                </span>
                <Sparkline values={visitors.data.perDay.map((d) => d.visits)} />
              </>
            ) : (
              <>
                <span className={ov.ovTileValue}>—</span>
                <span className={ov.ovTileSub}>{visitors.reason}</span>
              </>
            )}
          </button>
        </li>
        <li>
          <button type="button" className={`${ov.ovTile} ${unread ? ov.ovTileAlert : ""}`} onClick={() => onOpen("messages")}>
            <span className={ov.ovTileHead}>
              <Inbox size={16} aria-hidden="true" /> Unread messages
            </span>
            <span className={ov.ovTileValue}>{unread}</span>
            <span className={ov.ovTileSub}>{safeMessages.length ? `${safeMessages.length} in your inbox` : "Inbox is empty"}</span>
          </button>
        </li>
        <li>
          <a className={ov.ovTile} href="#ov-health">
            <span className={ov.ovTileHead}>
              <Sparkles size={16} aria-hidden="true" /> Content health
            </span>
            <span className={ov.ovTileRow}>
              <Ring value={health.score} />
              <span>
                <span className={ov.ovTileValue}>{health.score}%</span>
                <span className={ov.ovTileSub}>{health.issues.length ? `${health.issues.length} thing${health.issues.length === 1 ? "" : "s"} to improve` : "Nothing to fix"}</span>
              </span>
            </span>
          </a>
        </li>
        <li>
          <button type="button" className={ov.ovTile} onClick={() => onOpen("projects")}>
            <span className={ov.ovTileHead}>
              <FolderKanban size={16} aria-hidden="true" /> Projects
            </span>
            <span className={ov.ovTileValue}>{projects.length}</span>
            <span className={ov.ovTileSub}>
              {Math.max(0, live)} live{offline ? ` · ${offline} offline` : ""}
            </span>
          </button>
        </li>
      </ul>

      {/* ── attention + latest messages ── */}
      <div className={ov.ovSplit}>
        <section className={ov.ovPanel} id="ov-health" aria-labelledby="ov-health-title">
          <div className={ov.ovPanelHead}>
            <h3 id="ov-health-title" className={ov.ovPanelTitle}>
              Needs attention
            </h3>
            <span className={ov.ovCount}>
              {health.passed}/{health.total} checks passed
            </span>
          </div>
          {health.issues.length === 0 ? (
            <p className={ov.ovAllGood}>
              <CircleCheck size={18} aria-hidden="true" /> Your content is complete. Nice work.
            </p>
          ) : (
            <>
              <ul className={ov.ovIssues}>
                {issues.map((i, n) => (
                  <li key={`${i.group}-${n}`} className={ov.ovIssue}>
                    <span className={`${ov.ovIssueDot} ${i.level === "fix" ? ov.ovIssueFix : ov.ovIssueTip}`} aria-hidden="true" />
                    <span className={ov.ovIssueText}>
                      {i.text}
                      <span className={ov.ovIssueLevel}>{i.level === "fix" ? "Missing on your site" : "Suggestion"}</span>
                    </span>
                    <button type="button" className={ov.ovIssueBtn} onClick={() => onOpen(i.group)} aria-label={`Fix: ${i.text}`}>
                      Fix <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              {health.issues.length > ISSUES_COLLAPSED && (
                <button type="button" className={ov.ovMore} onClick={() => setShowAllIssues((v) => !v)} aria-expanded={showAllIssues}>
                  {showAllIssues ? "Show fewer" : `Show all ${health.issues.length}`}
                </button>
              )}
            </>
          )}
        </section>

        <section className={ov.ovPanel} aria-labelledby="ov-msg-title">
          <div className={ov.ovPanelHead}>
            <h3 id="ov-msg-title" className={ov.ovPanelTitle}>
              Latest messages
            </h3>
            <button type="button" className={ov.ovLink} onClick={() => onOpen("messages")}>
              Open inbox <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          {latest.length === 0 ? (
            <p className={ov.ovEmpty}>No messages yet. New contact-form messages show up here.</p>
          ) : (
            <ul className={ov.ovMsgs}>
              {latest.map((m) => (
                <li key={m.id}>
                  <button type="button" className={ov.ovMsg} onClick={() => onOpen("messages")}>
                    <span className={ov.ovAvatar} aria-hidden="true">
                      {(m.name || "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <span className={ov.ovMsgMain}>
                      <span className={ov.ovMsgTop}>
                        <span className={ov.ovMsgName}>{m.name || "Unknown sender"}</span>
                        <span className={ov.ovMsgTime}>{timeAgo(m.createdAt, now)}</span>
                      </span>
                      <span className={ov.ovMsgSubject}>
                        {!m.read && <span className={ov.ovUnreadDot} aria-label="Unread" />}
                        {m.subject || "(no subject)"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── content map ── */}
      <section className={ov.ovPanel} aria-labelledby="ov-content-title">
        <div className={ov.ovPanelHead}>
          <h3 id="ov-content-title" className={ov.ovPanelTitle}>
            Your content
          </h3>
          <span className={ov.ovCount}>{CONTENT_GROUPS.length} sections</span>
        </div>
        <ul className={ov.ovGroups}>
          {CONTENT_GROUPS.map((g) => {
            const count = g.count?.(data);
            const gaps = health.issues.filter((i) => i.group === g.id).length;
            return (
              <li key={g.id}>
                <button type="button" className={ov.ovGroup} onClick={() => onOpen(g.id)} aria-label={`Open ${g.label}${count !== undefined ? ` (${count})` : ""}${gaps ? `, ${gaps} to fix` : ""}`}>
                  <span className={ov.ovGroupIcon} aria-hidden="true">
                    <g.icon size={18} />
                  </span>
                  <span className={ov.ovGroupMain}>
                    <span className={ov.ovGroupLabel}>{g.label}</span>
                    <span className={ov.ovGroupDesc}>{g.description}</span>
                  </span>
                  <span className={ov.ovGroupMeta}>
                    {count !== undefined && <span className={ov.ovGroupCount}>{count}</span>}
                    {gaps > 0 && <span className={ov.ovGroupGap}>{gaps} to fix</span>}
                  </span>
                  <span className={ov.ovGroupArrow} aria-hidden="true">
                    <ChevronRight size={18} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── system ── */}
      <section className={`${ov.ovPanel} ${ov.ovSystem}`} aria-labelledby="ov-system-title">
        <div className={ov.ovSystemInfo}>
          <span className={`${ov.ovSystemIcon} ${ov[`ovStatus_${status.tone}`]}`} aria-hidden="true">
            {status.tone === "ok" ? <Database size={18} /> : <ShieldAlert size={18} />}
          </span>
          <div>
            <h3 id="ov-system-title" className={ov.ovPanelTitle}>
              Storage
            </h3>
            <p className={ov.ovSystemText} role="status">
              {status.text}
            </p>
          </div>
        </div>
        <div className={ov.ovDanger}>
          <span className={ov.ovDangerLabel}>Danger zone</span>
          <Tooltip title="Reset to defaults" text="Deletes everything saved in Redis and goes back to the built-in content. Asks to confirm first.">
            <button type="button" className={ov.ovBtnDanger} onClick={onResetAll} disabled={!storeConfigured || source !== "redis" || resetting}>
              <RotateCcw size={15} aria-hidden="true" />
              {resetting ? "Resetting…" : "Reset to defaults"}
            </button>
          </Tooltip>
        </div>
      </section>
    </div>
  );
}
