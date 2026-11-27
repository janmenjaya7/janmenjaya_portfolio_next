"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CircleAlert, ImageUp, Images, ShieldAlert, Trash2 } from "lucide-react";
import { resolveProject } from "../../lib/journey";
import { MAX_SHOT_BYTES, shotSlug, shotUrl, validateShot, type ShotIndex } from "../../lib/shot-validation";
import { adminApi, ApiError } from "../_lib/api";
import styles from "../_styles/admin.module.css";
import sh from "../_styles/shots.module.css";

type Props = {
  /** saved (live) projects — screenshots attach by project title */
  projects: unknown;
  onNotice: (tone: "ok" | "error", text: string) => void;
  onUnauthorized: () => void;
};

type Load = { state: "loading" } | { state: "ready"; index: ShotIndex } | { state: "error"; message: string };
type Row = { slug: string; title: string; builtIn: string | null; internal: boolean };

const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`;

/* The server checks the file's format bytes; this also makes sure the browser can actually open it,
   so a damaged file never becomes a broken image on the site. */
async function decodes(file: File): Promise<boolean> {
  if (typeof createImageBitmap !== "function") return true; // very old browser: rely on the server check
  try {
    const bmp = await createImageBitmap(file);
    const ok = bmp.width > 0 && bmp.height > 0;
    bmp.close();
    return ok;
  } catch {
    return false;
  }
}

/* Admin: upload a real screenshot per project (it replaces the built-in screen on the site's laptop mockup). */
export default function ShotsPanel({ projects, onNotice, onUnauthorized }: Props) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ slug: string; text: string } | null>(null);
  const requestId = useRef(0);

  // one row per project with a usable title; duplicates by slug would share a screenshot, so keep the first
  const rows: Row[] = [];
  for (const raw of Array.isArray(projects) ? projects : []) {
    const p = resolveProject((raw ?? {}) as Record<string, unknown>);
    const slug = shotSlug(p?.title);
    if (!p || !slug || rows.some((r) => r.slug === slug)) continue;
    rows.push({ slug, title: p.title, builtIn: p.image, internal: p.internal });
  }

  const fail = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.status === 401) return onUnauthorized();
    onNotice("error", err instanceof Error ? err.message : fallback);
  };

  // only the latest response is applied; state is set in the callbacks, never synchronously
  const fetchIndex = () => {
    const id = ++requestId.current;
    adminApi
      .getShots()
      .then((index) => {
        if (id === requestId.current) setLoad({ state: "ready", index });
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        if (err instanceof ApiError && err.status === 401) return onUnauthorized();
        setLoad({ state: "error", message: err instanceof Error ? err.message : "Couldn't load the screenshots." });
      });
  };

  useEffect(() => {
    fetchIndex(); // initial state is already "loading"
    return () => {
      // deliberate: bump the counter so any response that arrives after unmount is ignored
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (row: Row, file: File | undefined | null, input: HTMLInputElement) => {
    setRowError(null);
    if (!file) return;
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const check = validateShot({ name: file.name, size: file.size, head });
    if (!check.ok) {
      setRowError({ slug: row.slug, text: check.error });
      input.value = "";
      return;
    }
    if (!(await decodes(file))) {
      setRowError({ slug: row.slug, text: "That image couldn't be opened — it may be damaged. Please export it again as JPG, PNG or WebP." });
      input.value = "";
      return;
    }
    const id = ++requestId.current;
    setBusy(row.slug);
    try {
      const index = await adminApi.uploadShot(row.slug, file);
      if (id !== requestId.current) return;
      setLoad({ state: "ready", index });
      onNotice("ok", `Screenshot for “${row.title}” is live on your site.`);
    } catch (err) {
      if (id === requestId.current) fail(err, "Couldn't upload the screenshot.");
    } finally {
      if (id === requestId.current) setBusy(null);
      input.value = "";
    }
  };

  const remove = async (row: Row) => {
    const fallback = row.builtIn ? "the built-in screenshot" : "a text cover";
    if (!window.confirm(`Remove the uploaded screenshot for “${row.title}”? The site will show ${fallback} instead.`)) return;
    setRowError(null);
    const id = ++requestId.current;
    setBusy(row.slug);
    try {
      const index = await adminApi.deleteShot(row.slug);
      if (id !== requestId.current) return;
      setLoad({ state: "ready", index });
      onNotice("ok", `Removed the uploaded screenshot for “${row.title}”.`);
    } catch (err) {
      if (id === requestId.current) fail(err, "Couldn't remove the screenshot.");
    } finally {
      if (id === requestId.current) setBusy(null);
    }
  };

  const index = load.state === "ready" ? load.index : {};

  return (
    // a natural-height card (not admEditorCard, which fills the screen): the page scrolls down to it
    <section className={`${styles.admCard} ${sh.shCard}`} aria-labelledby="adm-shots-title">
      <header className={styles.admSectionHead}>
        <span className={styles.admMetricIcon}>
          <Images size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="adm-shots-title" className={styles.admCardTitle}>
            Project screenshots
          </h2>
          <p className={styles.admMuted}>What visitors see on the laptop when they open a project. An upload replaces the built-in screen.</p>
        </div>
      </header>

      <div className={sh.shBody}>
        <p className={sh.shWarn}>
          <ShieldAlert size={18} aria-hidden="true" />
          <span>
            For internal tools (CRM, admin panels) use sample data or blur it first — never show real student names, phone numbers, emails or payments.
          </span>
        </p>

        {load.state === "loading" ? (
          <div className={sh.shSkeletonList} aria-label="Loading screenshots">
            {[0, 1, 2].map((i) => (
              <div key={i} className={sh.shSkeleton} />
            ))}
          </div>
        ) : load.state === "error" ? (
          <div className={sh.shError} role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{load.message}</span>
            <button
              type="button"
              className={sh.shLinkBtn}
              onClick={() => {
                setLoad({ state: "loading" });
                fetchIndex();
              }}
            >
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p className={sh.shEmpty}>Add a project above (and save) to give it a screenshot.</p>
        ) : (
          <ul className={sh.shList}>
            {rows.map((row) => {
              const meta = index[row.slug];
              const src = meta ? shotUrl(row.slug, meta) : row.builtIn;
              const inputId = `adm-shot-${row.slug}`;
              const errId = `${inputId}-error`;
              const rowBusy = busy === row.slug;
              return (
                <li key={row.slug} className={sh.shRow} aria-busy={rowBusy}>
                  <span className={sh.shThumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary upload */}
                    {src ? <img src={src} alt="" loading="lazy" /> : <span className={sh.shThumbEmpty}>Text cover</span>}
                  </span>
                  <span className={sh.shText}>
                    <span className={sh.shTitle}>{row.title}</span>
                    <span className={sh.shMeta}>
                      {meta
                        ? `Uploaded · ${kb(meta.size)} · ${new Date(meta.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                        : row.builtIn
                          ? row.internal
                            ? "Built-in: public sign-in screen"
                            : "Built-in screenshot"
                          : "No screenshot — shows a text cover"}
                    </span>
                    {rowError?.slug === row.slug ? (
                      <span id={errId} className={sh.shRowError} role="alert">
                        {rowError.text}
                      </span>
                    ) : null}
                  </span>
                  <span className={sh.shActions}>
                    <label className={`${sh.shBtn} ${rowBusy || busy !== null ? sh.shBtnDisabled : ""}`} htmlFor={inputId}>
                      <ImageUp size={16} aria-hidden="true" />
                      {rowBusy ? "Saving…" : meta ? "Replace" : "Upload"}
                      <span className={sh.shSr}> screenshot for {row.title}</span>
                    </label>
                    <input
                      id={inputId}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className={sh.shInput}
                      disabled={busy !== null}
                      aria-describedby={rowError?.slug === row.slug ? errId : "adm-shots-hint"}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => upload(row, e.target.files?.[0], e.target)}
                    />
                    {meta ? (
                      <button type="button" className={`${sh.shBtn} ${sh.shBtnDanger}`} onClick={() => remove(row)} disabled={busy !== null} aria-label={`Remove uploaded screenshot for ${row.title}`}>
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p id="adm-shots-hint" className={sh.shHint}>
          JPG, PNG or WebP · up to {kb(MAX_SHOT_BYTES)} · a 16:10 landscape screenshot (e.g. 1440×900) fits the laptop best. Screenshots follow the project title — renaming a project unlinks its upload.
        </p>
      </div>
    </section>
  );
}
