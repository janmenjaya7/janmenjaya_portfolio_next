"use client";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CircleAlert, Download, ExternalLink, FileText, RotateCcw, UploadCloud } from "lucide-react";
import type { ResumeInfo } from "../../lib/resume-store";
import { MAX_RESUME_BYTES, formatBytes, validateResume } from "../../lib/resume-validation";
import { adminApi, ApiError } from "../_lib/api";
import styles from "../_styles/admin.module.css";
import rs from "../_styles/resume.module.css";

type Props = {
  onNotice: (tone: "ok" | "error", text: string) => void;
  onUnauthorized: () => void;
};

type Load = { state: "loading" } | { state: "ready"; info: ResumeInfo } | { state: "error"; message: string };

const when = (ts: number) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));

/* Admin: see which resume visitors download, upload a replacement PDF, or go back to the default. */
export default function ResumePanel({ onNotice, onUnauthorized }: Props) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [busy, setBusy] = useState<"upload" | "restore" | null>(null);
  const [fieldError, setFieldError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const fail = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.status === 401) return onUnauthorized();
    onNotice("error", err instanceof Error ? err.message : fallback);
  };

  // fetch current info; only the latest response is applied (state is set in the callbacks, never synchronously)
  const fetchInfo = () => {
    const id = ++requestId.current;
    adminApi
      .getResume()
      .then((info) => {
        if (id === requestId.current) setLoad({ state: "ready", info });
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        if (err instanceof ApiError && err.status === 401) return onUnauthorized();
        setLoad({ state: "error", message: err instanceof Error ? err.message : "Couldn't load the resume details." });
      });
  };

  const retry = () => {
    setLoad({ state: "loading" });
    fetchInfo();
  };

  useEffect(() => {
    fetchInfo(); // initial state is already "loading"
    return () => {
      // deliberate: bump the counter so any response that arrives after unmount is ignored
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (file: File | undefined | null) => {
    setFieldError("");
    if (!file) return;
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const check = validateResume({ name: file.name, type: file.type, size: file.size, head });
    if (!check.ok) {
      setFieldError(check.error);
      return;
    }
    const id = ++requestId.current;
    setBusy("upload");
    try {
      const info = await adminApi.uploadResume(file);
      if (id !== requestId.current) return;
      setLoad({ state: "ready", info });
      onNotice("ok", "Resume updated — visitors now download the new file.");
    } catch (err) {
      if (id === requestId.current) fail(err, "Couldn't upload the resume.");
    } finally {
      if (id === requestId.current) setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const restore = async () => {
    if (!window.confirm("Remove the uploaded resume and go back to the default file?")) return;
    const id = ++requestId.current;
    setBusy("restore");
    try {
      const info = await adminApi.deleteResume();
      if (id !== requestId.current) return;
      setLoad({ state: "ready", info });
      onNotice("ok", "Back to the default resume.");
    } catch (err) {
      if (id === requestId.current) fail(err, "Couldn't restore the default resume.");
    } finally {
      if (id === requestId.current) setBusy(null);
    }
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => upload(e.target.files?.[0]);
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!busy) upload(e.dataTransfer.files?.[0]);
  };

  const info = load.state === "ready" ? load.info : null;

  return (
    <section className={`${styles.admCard} ${styles.admEditorCard}`} aria-labelledby="adm-resume-title">
      <header className={styles.admSectionHead}>
        <span className={styles.admMetricIcon}>
          <FileText size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="adm-resume-title" className={styles.admCardTitle}>
            Resume
          </h2>
          <p className={styles.admMuted}>The file behind the “Download resume” button on your site.</p>
        </div>
      </header>

      <div className={styles.admSectionBody}>
        {/* current file */}
        <div className={rs.rsCurrent} aria-live="polite">
          {load.state === "loading" ? (
            <div className={rs.rsSkeleton} aria-label="Loading resume details" />
          ) : load.state === "error" ? (
            <div className={rs.rsError} role="alert">
              <CircleAlert size={18} aria-hidden="true" />
              <span>{load.message}</span>
              <button type="button" className={rs.rsLinkBtn} onClick={retry}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <span className={rs.rsFileIcon} aria-hidden="true">
                PDF
              </span>
              <div className={rs.rsFileText}>
                <span className={rs.rsFileName}>{info?.source === "uploaded" ? info.meta.name : "Default resume (resume.pdf)"}</span>
                <span className={rs.rsFileMeta}>
                  {info?.source === "uploaded" ? `${formatBytes(info.meta.size)} · uploaded ${when(info.meta.updatedAt)}` : "Shipped with the site — upload a PDF to replace it"}
                </span>
              </div>
              <span className={info?.source === "uploaded" ? rs.rsBadgeLive : rs.rsBadge}>{info?.source === "uploaded" ? "Uploaded" : "Default"}</span>
            </>
          )}
        </div>

        <div className={rs.rsActions}>
          <a className={rs.rsBtnGhost} href="/api/resume" target="_blank" rel="noopener noreferrer">
            <Download size={16} aria-hidden="true" /> Download current
          </a>
          <a className={rs.rsBtnGhost} href="/#hero" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} aria-hidden="true" /> See it on the site
          </a>
          {info?.source === "uploaded" ? (
            <button type="button" className={rs.rsBtnDanger} onClick={restore} disabled={busy !== null}>
              <RotateCcw size={16} aria-hidden="true" /> {busy === "restore" ? "Restoring…" : "Restore default"}
            </button>
          ) : null}
        </div>

        {/* upload */}
        <label
          className={`${rs.rsDrop} ${dragging ? rs.rsDropOver : ""} ${busy === "upload" ? rs.rsDropBusy : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className={rs.rsInput}
            onChange={onPick}
            disabled={busy !== null}
            aria-describedby="adm-resume-help adm-resume-error"
          />
          <UploadCloud size={28} aria-hidden="true" className={rs.rsDropIcon} />
          <span className={rs.rsDropTitle}>{busy === "upload" ? "Uploading…" : "Drop a new PDF here, or click to choose"}</span>
          <span id="adm-resume-help" className={rs.rsDropHint}>
            PDF only · up to {formatBytes(MAX_RESUME_BYTES)} · replaces the current resume immediately
          </span>
        </label>
        {fieldError ? (
          <p id="adm-resume-error" className={rs.rsFieldError} role="alert">
            {fieldError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
