"use client";
/* Admin → Visitors: who came to the site, from where, on what device, how long they stayed and what they clicked. */
import { useEffect, useRef, useState } from "react";
import { ChartNoAxesColumn, CircleAlert, Clock, Globe, MousePointerClick, RefreshCw, Trash2, Users, Zap } from "lucide-react";
import { formatDuration, type Count, type Visit, type VisitorSummary } from "../../lib/analytics";
import { adminApi, ApiError } from "../_lib/api";
import styles from "../_styles/admin.module.css";
import vs from "../_styles/visitors.module.css";

type Props = {
  onNotice: (tone: "ok" | "error", text: string) => void;
  onUnauthorized: () => void;
};

type Load = { state: "loading" } | { state: "ready"; data: VisitorSummary } | { state: "error"; message: string };

const RANGES = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string): string {
  if (!code || code === "Unknown") return "Unknown";
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
const flag = (code: string) =>
  /^[A-Za-z]{2}$/.test(code) ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "🌐";

function ago(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
}
const at = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
/* friendly names for the site's section ids (anything else is shown capitalised) */
const SECTION_NAMES: Record<string, string> = {
  hero: "Hero (top of page)",
  chapters: "Story in 6 chapters",
  story: "Story video",
  journey: "Journey",
  about: "About",
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  contact: "Contact",
};
const sectionLabel = (s: string) => SECTION_NAMES[s] ?? (s ? s[0].toUpperCase() + s.slice(1) : "Section");

const place = (v: Visit) => [v.city, v.region, v.country ? countryName(v.country) : ""].filter(Boolean).join(", ") || "Location unknown";

function Bars({ items, total, format = (c: Count) => c.label }: { items: Count[]; total: number; format?: (c: Count) => string }) {
  if (!items.length) return <p className={vs.vsEmptySmall}>Nothing yet.</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className={vs.vsBars}>
      {items.map((i) => (
        <li key={i.label} className={vs.vsBarRow}>
          <span className={vs.vsBarFill} style={{ width: `${(i.count / max) * 100}%` }} aria-hidden="true" />
          <span className={vs.vsBarLabel} title={i.label}>
            {format(i)}
          </span>
          <span className={vs.vsBarCount}>
            {i.count}
            {total > 0 && <span className={vs.vsBarPct}> · {Math.round((i.count / total) * 100)}%</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function VisitorsPanel({ onNotice, onUnauthorized }: Props) {
  const [days, setDays] = useState(7);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const requestId = useRef(0);

  const fetchStats = (range: number) => {
    const id = ++requestId.current;
    adminApi
      .getVisitors(range)
      .then((data) => {
        if (id !== requestId.current) return;
        setLoad({ state: "ready", data });
        setNow(Date.now());
        setRefreshing(false);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setRefreshing(false);
        if (err instanceof ApiError && err.status === 401) return onUnauthorized();
        setLoad({ state: "error", message: err instanceof Error ? err.message : "Couldn't load visitor stats." });
      });
  };

  useEffect(() => {
    fetchStats(days); // initial state is already "loading"
    return () => {
      // ignore any response that arrives after unmount
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickRange = (d: number) => {
    if (d === days) return;
    setDays(d);
    setLoad({ state: "loading" });
    fetchStats(d);
  };
  const refresh = () => {
    setRefreshing(true);
    fetchStats(days);
  };
  const clearAll = () => {
    if (!window.confirm("Delete all visitor data? This can't be undone.")) return;
    setClearing(true);
    adminApi
      .clearVisitors()
      .then(({ removed }) => {
        onNotice("ok", removed ? `Deleted ${removed} recorded visit${removed === 1 ? "" : "s"}.` : "There was no visitor data to delete.");
        setLoad({ state: "loading" });
        fetchStats(days);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) return onUnauthorized();
        onNotice("error", err instanceof Error ? err.message : "Couldn't clear visitor data.");
      })
      .finally(() => setClearing(false));
  };

  const data = load.state === "ready" ? load.data : null;
  const t = data?.totals;
  const peak = data ? Math.max(1, ...data.perDay.map((d) => d.visits)) : 1;

  return (
    <section className={`${styles.admCard} ${styles.admEditorCard}`} aria-labelledby="adm-visitors-title">
      <header className={styles.admSectionHead}>
        <span className={styles.admMetricIcon}>
          <ChartNoAxesColumn size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="adm-visitors-title" className={styles.admCardTitle}>
            Visitors
          </h2>
          <p className={styles.admMuted}>Anonymous and cookie-free. Your own visits while logged in aren&apos;t counted.</p>
        </div>
      </header>

      <div className={styles.admSectionBody}>
        <div className={vs.vsToolbar}>
          <div className={vs.vsRanges} role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r.days} type="button" className={`${vs.vsRange} ${days === r.days ? vs.vsRangeOn : ""}`} aria-pressed={days === r.days} onClick={() => pickRange(r.days)}>
                {r.label}
              </button>
            ))}
          </div>
          <div className={vs.vsActions}>
            <button type="button" className={vs.vsGhostBtn} onClick={refresh} disabled={refreshing || load.state === "loading"}>
              <RefreshCw size={15} aria-hidden="true" className={refreshing ? styles.admSpin : undefined} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button type="button" className={`${vs.vsGhostBtn} ${vs.vsDangerBtn}`} onClick={clearAll} disabled={clearing || !t?.visits}>
              <Trash2 size={15} aria-hidden="true" />
              {clearing ? "Deleting…" : "Clear data"}
            </button>
          </div>
        </div>

        {load.state === "loading" && (
          <div className={vs.vsSkeletonGrid} aria-busy="true" aria-label="Loading visitor stats">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={vs.vsSkeleton} />
            ))}
          </div>
        )}

        {load.state === "error" && (
          <div className={vs.vsError} role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{load.message}</span>
            <button type="button" className={vs.vsLinkBtn} onClick={() => pickRangeRetry()}>
              Try again
            </button>
          </div>
        )}

        {data && t && (
          <>
            <ul className={vs.vsMetrics}>
              <li className={vs.vsMetric}>
                <Users size={18} aria-hidden="true" />
                <span className={vs.vsMetricNum}>{t.visitors}</span>
                <span className={vs.vsMetricLabel}>Unique visitors</span>
              </li>
              <li className={vs.vsMetric}>
                <Globe size={18} aria-hidden="true" />
                <span className={vs.vsMetricNum}>{t.visits}</span>
                <span className={vs.vsMetricLabel}>Visits</span>
              </li>
              <li className={`${vs.vsMetric} ${t.liveNow ? vs.vsMetricLive : ""}`}>
                <Zap size={18} aria-hidden="true" />
                <span className={vs.vsMetricNum}>{t.liveNow}</span>
                <span className={vs.vsMetricLabel}>On the site now</span>
              </li>
              <li className={vs.vsMetric}>
                <Clock size={18} aria-hidden="true" />
                <span className={vs.vsMetricNum}>{formatDuration(t.avgDurationMs)}</span>
                <span className={vs.vsMetricLabel}>Average time</span>
              </li>
              <li className={vs.vsMetric}>
                <ChartNoAxesColumn size={18} aria-hidden="true" />
                <span className={vs.vsMetricNum}>{t.engagedRate}%</span>
                <span className={vs.vsMetricLabel}>Engaged visits</span>
              </li>
              <li className={vs.vsMetric}>
                <MousePointerClick size={18} aria-hidden="true" />
                <span className={vs.vsMetricNum}>{t.clicks}</span>
                <span className={vs.vsMetricLabel}>Clicks</span>
              </li>
            </ul>

            {t.visits === 0 ? (
              <div className={vs.vsEmpty}>
                <Users size={28} aria-hidden="true" />
                <p className={vs.vsEmptyTitle}>No visits in this period yet</p>
                <p className={vs.vsEmptyText}>Visits appear here a few seconds after someone opens your site. Visitors who ask browsers not to track them are not counted.</p>
              </div>
            ) : (
              <>
                {data.days > 1 && (
                  <div className={vs.vsCard}>
                    <h3 className={vs.vsCardTitle}>Visits per day</h3>
                    <div className={vs.vsChart} role="img" aria-label={data.perDay.map((d) => `${d.day}: ${d.visits}`).join(", ")}>
                      {data.perDay.map((d) => (
                        <div key={d.day} className={vs.vsCol} title={`${d.day}: ${d.visits} visit${d.visits === 1 ? "" : "s"}`}>
                          <span className={vs.vsColBar} style={{ height: `${(d.visits / peak) * 100}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className={vs.vsChartAxis} aria-hidden="true">
                      <span>{data.perDay[0]?.day}</span>
                      <span>{data.perDay.at(-1)?.day}</span>
                    </div>
                  </div>
                )}

                <div className={vs.vsGrid}>
                  <div className={vs.vsCard}>
                    <h3 className={vs.vsCardTitle}>Came from</h3>
                    <Bars items={data.sources} total={t.visits} />
                  </div>
                  <div className={vs.vsCard}>
                    <h3 className={vs.vsCardTitle}>Countries</h3>
                    <Bars items={data.countries} total={t.visits} format={(c) => `${flag(c.label)} ${countryName(c.label)}`} />
                  </div>
                  <div className={vs.vsCard}>
                    <h3 className={vs.vsCardTitle}>Most clicked</h3>
                    <Bars items={data.clicks} total={0} />
                  </div>
                  <div className={vs.vsCard}>
                    <h3 className={vs.vsCardTitle}>Sections reached</h3>
                    <Bars items={data.sections} total={t.visits} format={(c) => sectionLabel(c.label)} />
                  </div>
                  <div className={vs.vsCard}>
                    <h3 className={vs.vsCardTitle}>Devices</h3>
                    <Bars items={data.devices} total={t.visits} format={(c) => c.label[0].toUpperCase() + c.label.slice(1)} />
                  </div>
                  <div className={vs.vsCard}>
                    <h3 className={vs.vsCardTitle}>Browsers</h3>
                    <Bars items={data.browsers} total={t.visits} />
                  </div>
                </div>

                <div className={vs.vsCard}>
                  <h3 className={vs.vsCardTitle}>Recent visits</h3>
                  <ul className={vs.vsVisits}>
                    {data.recent.map((v) => {
                      const clicks = v.events.filter((e) => e.type === "click").length;
                      const sections = v.events.filter((e) => e.type === "section").length;
                      const live = now - v.lastAt <= 2 * 60 * 1000;
                      return (
                        <li key={v.id}>
                          <details className={vs.vsVisit}>
                            <summary className={vs.vsVisitHead}>
                              <span className={vs.vsVisitFlag} aria-hidden="true">
                                {flag(v.country)}
                              </span>
                              <span className={vs.vsVisitMain}>
                                <span className={vs.vsVisitPlace}>
                                  {place(v)}
                                  {live && <span className={vs.vsLiveDot}>live</span>}
                                </span>
                                <span className={vs.vsVisitMeta}>
                                  {ago(v.startedAt, now)} · {v.device} · {v.browser} on {v.os} · from {v.source || "Direct"}
                                </span>
                              </span>
                              <span className={vs.vsVisitStats}>
                                <span>{formatDuration(v.durationMs)}</span>
                                <span>
                                  {clicks} click{clicks === 1 ? "" : "s"} · {sections} section{sections === 1 ? "" : "s"}
                                </span>
                              </span>
                            </summary>
                            <div className={vs.vsVisitBody}>
                              <p className={vs.vsVisitFacts}>
                                Landed on <code>{v.landing || "/"}</code>
                                {v.campaign ? <> · campaign {v.campaign}</> : null}
                                {v.viewport ? <> · screen {v.viewport}px wide</> : null}
                                {v.lang ? <> · language {v.lang}</> : null}
                              </p>
                              {v.events.length === 0 ? (
                                <p className={vs.vsEmptySmall}>Left without scrolling or clicking.</p>
                              ) : (
                                <ol className={vs.vsTimeline}>
                                  {v.events.map((e, i) => (
                                    <li key={i} className={e.type === "click" ? vs.vsTlClick : vs.vsTlSection}>
                                      <span className={vs.vsTlTime}>{at(e.at)}</span>
                                      {e.type === "click" ? (
                                        <span>
                                          Clicked <strong>{e.label}</strong>
                                          {e.href ? <span className={vs.vsTlHref}> → {e.href}</span> : null}
                                        </span>
                                      ) : (
                                        <span>Reached {sectionLabel(e.label)}</span>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );

  function pickRangeRetry() {
    setLoad({ state: "loading" });
    fetchStats(days);
  }
}
