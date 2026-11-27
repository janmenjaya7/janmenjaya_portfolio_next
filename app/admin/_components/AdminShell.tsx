"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, RefreshCw } from "lucide-react";
import type { PortfolioData } from "../../data";
import type { ContactMessage } from "../../lib/messages";
import type { SectionKey } from "../../lib/portfolio-schema";
import type { StoreSource } from "../../lib/portfolio-store";
import { adminApi, ApiError } from "../_lib/api";
import { CONTENT_GROUPS } from "../_lib/sections";
import AdminOverview from "./AdminOverview";
import AdminSidebar from "./AdminSidebar";
import { EditorSkeleton, OverviewSkeleton } from "./AdminSkeleton";
import MessagesPanel from "./MessagesPanel";
import ResumePanel from "./ResumePanel";
import ShotsPanel from "./ShotsPanel";
import VisitorsPanel from "./VisitorsPanel";
import SectionEditor from "./SectionEditor";
import Tooltip from "./Tooltip";
import styles from "../_styles/admin.module.css";

type Props = {
  initialData: PortfolioData;
  initialSource: StoreSource;
  storeConfigured: boolean;
  initialMessages: ContactMessage[];
  initialMessagesError: string;
};

type Notice = { tone: "ok" | "error"; text: string } | null;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export default function AdminShell({
  initialData,
  initialSource,
  storeConfigured,
  initialMessages,
  initialMessagesError,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [messagesError, setMessagesError] = useState(initialMessagesError);
  const unreadCount = messages.filter((m) => !m.read).length;
  const [saved, setSaved] = useState<PortfolioData>(initialData);
  const [draft, setDraft] = useState<PortfolioData>(initialData);
  const [source, setSource] = useState<StoreSource>(initialSource);
  const [active, setActive] = useState("overview");
  const [busy, setBusy] = useState<"save" | "reset" | "logout" | "refresh" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const lastSync = useRef(0);

  const dirtyGroups = useMemo(
    () => new Set(CONTENT_GROUPS.filter((g) => g.keys.some((k) => !same(draft[k], saved[k]))).map((g) => g.id)),
    [draft, saved],
  );
  const group = CONTENT_GROUPS.find((g) => g.id === active);
  // Saving over a failed read could wipe real data, so it's blocked until a refresh succeeds
  const canSave = storeConfigured && source !== "error";

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (dirtyGroups.size === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyGroups]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Quietly pull the latest data when the tab becomes visible again (e.g. edited on another
  // device) — only when nothing is unsaved, and at most every 30s
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible" || dirtyGroups.size > 0 || busy) return;
      if (Date.now() - lastSync.current < 30_000) return;
      lastSync.current = Date.now();
      adminApi
        .fetchLatest()
        .then(({ data, source: src }) => {
          setSaved(data);
          setDraft(data);
          setSource(src);
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) router.replace("/admin/login");
        });
      adminApi
        .listMessages()
        .then((list) => {
          setMessages(list);
          setMessagesError("");
        })
        .catch(() => {
          // keep showing the current list; the next Refresh will report errors
        });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [dirtyGroups, busy, router]);

  const handleError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.status === 401) {
      router.replace("/admin/login");
      return;
    }
    setNotice({ tone: "error", text: err instanceof Error ? err.message : fallback });
  };

  const save = async () => {
    if (!group) return;
    setBusy("save");
    try {
      let latest = saved;
      for (const key of group.keys) {
        if (!same(draft[key], saved[key])) latest = await adminApi.saveSection(key, draft[key]);
      }
      setSaved(latest);
      // Keep other groups' unsaved edits, take server-normalized values for this group
      setDraft((d) => {
        const next = { ...d };
        group.keys.forEach((k) => ((next as Record<SectionKey, unknown>)[k] = latest[k]));
        return next;
      });
      setSource("redis");
      setNotice({ tone: "ok", text: `${group.label} saved — the live site is updated.` });
    } catch (err) {
      handleError(err, "Couldn't save. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  /* Re-fetch everything from Redis; shows skeletons while loading */
  const refresh = async () => {
    if (
      dirtyGroups.size > 0 &&
      !window.confirm("Refreshing loads the latest saved data and discards your unsaved changes. Continue?")
    ) {
      return;
    }
    setBusy("refresh");
    setNotice(null);
    try {
      const [{ data, source: src }, inbox] = await Promise.all([
        adminApi.fetchLatest(),
        adminApi.listMessages().then(
          (list) => ({ list, error: "" }),
          (err: unknown) => ({ list: null, error: err instanceof Error ? err.message : "Couldn't load messages." }),
        ),
      ]);
      lastSync.current = Date.now();
      setSaved(data);
      setDraft(data);
      setSource(src);
      if (inbox.list) setMessages(inbox.list);
      setMessagesError(inbox.error);
      setNotice(
        src === "error"
          ? { tone: "error", text: "Couldn't reach Redis — showing defaults. Try again shortly." }
          : { tone: "ok", text: "Up to date — loaded the latest data from Redis." },
      );
    } catch (err) {
      handleError(err, "Couldn't refresh. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  /* Inbox actions are optimistic and roll back if the request fails */
  const setMessageRead = async (id: string, read: boolean) => {
    const before = messages;
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, read } : m)));
    try {
      await adminApi.setMessageRead(id, read);
    } catch (err) {
      setMessages(before);
      handleError(err, "Couldn't update the message.");
    }
  };

  const deleteMessage = async (id: string) => {
    const before = messages;
    setMessages((list) => list.filter((m) => m.id !== id));
    try {
      await adminApi.deleteMessage(id);
      setNotice({ tone: "ok", text: "Message deleted." });
    } catch (err) {
      setMessages(before);
      handleError(err, "Couldn't delete the message.");
    }
  };

  const discard = () => {
    if (!group) return;
    setDraft((d) => {
      const next = { ...d };
      group.keys.forEach((k) => ((next as Record<SectionKey, unknown>)[k] = saved[k]));
      return next;
    });
  };

  const resetAll = async () => {
    if (!window.confirm("Delete all saved content from Redis and go back to the defaults in data.ts?")) return;
    setBusy("reset");
    try {
      const defaults = await adminApi.resetAll();
      setSaved(defaults);
      setDraft(defaults);
      setSource("default");
      setNotice({ tone: "ok", text: "Reset done — the site now uses the default content." });
    } catch (err) {
      handleError(err, "Couldn't reset. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const logout = async () => {
    setBusy("logout");
    try {
      await adminApi.logout();
    } catch {
      // Cookie may already be gone; continue to the login page either way
    }
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className={styles.admLayout}>
      <AdminSidebar
        active={active}
        data={draft}
        dirtyGroups={dirtyGroups}
        unreadCount={unreadCount}
        onSelect={setActive}
        onLogout={logout}
        loggingOut={busy === "logout"}
      />

      <main className={styles.admMain}>
        <div className={styles.admTitleRow}>
          <h1 className={styles.admTitle}>
            {group ? group.label : active === "messages" ? "Messages" : active === "resume" ? "Resume" : active === "visitors" ? "Visitors" : "Portfolio"}{" "}
            <span className={styles.admTitleMuted}>
              {group ? "editor" : active === "messages" ? "inbox" : active === "resume" ? "file" : active === "visitors" ? "analytics" : "overview"}
            </span>
          </h1>
          <Tooltip
            side="bottom"
            title="Refresh data"
            text={
              dirtyGroups.size > 0
                ? "Loads the latest content and messages from Redis. Unsaved changes will be lost (asks first)."
                : "Loads the latest content and messages from Redis."
            }
          >
            <button
              type="button"
              className={styles.admRefreshBtn}
              onClick={refresh}
              disabled={busy !== null}
              aria-busy={busy === "refresh"}
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
                className={busy === "refresh" ? styles.admSpin : undefined}
              />
              <span>{busy === "refresh" ? "Refreshing…" : "Refresh"}</span>
            </button>
          </Tooltip>
        </div>

        {notice && (
          <div
            className={`${styles.admNotice} ${notice.tone === "ok" ? styles.admNoticeOk : styles.admNoticeError}`}
            role={notice.tone === "ok" ? "status" : "alert"}
          >
            {notice.tone === "ok" ? <CircleCheck size={18} aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}
            {notice.text}
          </div>
        )}

        {busy === "refresh" ? (
          group || active === "messages" ? <EditorSkeleton /> : <OverviewSkeleton />
        ) : active === "visitors" ? (
          <VisitorsPanel
            onNotice={(tone, text) => setNotice({ tone, text })}
            onUnauthorized={() => router.replace("/admin/login")}
          />
        ) : active === "resume" ? (
          <ResumePanel
            onNotice={(tone, text) => setNotice({ tone, text })}
            onUnauthorized={() => router.replace("/admin/login")}
          />
        ) : active === "messages" ? (
          <MessagesPanel
            messages={messages}
            loadError={messagesError}
            onSetRead={setMessageRead}
            onDelete={deleteMessage}
          />
        ) : group ? (
          <>
            <SectionEditor
              key={group.id}
              group={group}
              draft={draft}
              dirty={dirtyGroups.has(group.id)}
              saving={busy === "save"}
              canSave={canSave}
              onChange={(key, value) => setDraft((d) => ({ ...d, [key]: value }))}
              onSave={save}
              onDiscard={discard}
            />
            {/* screenshots attach to the saved (live) projects, not unsaved edits */}
            {group.id === "projects" ? (
              <ShotsPanel
                projects={saved.projects}
                onNotice={(tone, text) => setNotice({ tone, text })}
                onUnauthorized={() => router.replace("/admin/login")}
              />
            ) : null}
          </>
        ) : (
          <AdminOverview
            data={draft}
            source={source}
            storeConfigured={storeConfigured}
            messages={messages}
            onOpen={setActive}
            onResetAll={resetAll}
            resetting={busy === "reset"}
          />
        )}
      </main>
    </div>
  );
}
