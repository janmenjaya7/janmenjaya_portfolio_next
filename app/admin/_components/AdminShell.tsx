"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { PortfolioData } from "../../data";
import type { SectionKey } from "../../lib/portfolio-schema";
import type { StoreSource } from "../../lib/portfolio-store";
import { adminApi, ApiError } from "../_lib/api";
import { CONTENT_GROUPS } from "../_lib/sections";
import AdminOverview from "./AdminOverview";
import AdminSidebar from "./AdminSidebar";
import SectionEditor from "./SectionEditor";
import styles from "../_styles/admin.module.css";

type Props = {
  initialData: PortfolioData;
  initialSource: StoreSource;
  storeConfigured: boolean;
};

type Notice = { tone: "ok" | "error"; text: string } | null;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export default function AdminShell({ initialData, initialSource, storeConfigured }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState<PortfolioData>(initialData);
  const [draft, setDraft] = useState<PortfolioData>(initialData);
  const [source, setSource] = useState<StoreSource>(initialSource);
  const [active, setActive] = useState("overview");
  const [busy, setBusy] = useState<"save" | "reset" | "logout" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

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
        onSelect={setActive}
        onLogout={logout}
        loggingOut={busy === "logout"}
      />

      <main className={styles.admMain}>
        <h1 className={styles.admTitle}>
          {group ? group.label : "Portfolio"} <span className={styles.admTitleMuted}>{group ? "editor" : "overview"}</span>
        </h1>

        {notice && (
          <div
            className={`${styles.admNotice} ${notice.tone === "ok" ? styles.admNoticeOk : styles.admNoticeError}`}
            role={notice.tone === "ok" ? "status" : "alert"}
          >
            {notice.tone === "ok" ? <CircleCheck size={18} aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}
            {notice.text}
          </div>
        )}

        {group ? (
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
        ) : (
          <AdminOverview
            data={draft}
            source={source}
            storeConfigured={storeConfigured}
            onOpen={setActive}
            onResetAll={resetAll}
            resetting={busy === "reset"}
          />
        )}
      </main>
    </div>
  );
}
