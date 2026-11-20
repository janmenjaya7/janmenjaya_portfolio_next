"use client";
import { Save, Undo2 } from "lucide-react";
import { DATA, type PortfolioData } from "../../data";
import type { SectionKey } from "../../lib/portfolio-schema";
import type { ContentGroup } from "../_lib/sections";
import { collectErrors } from "../_lib/validation";
import { FieldEditor } from "./FieldEditor";
import Tooltip from "./Tooltip";
import styles from "../_styles/admin.module.css";
import editorStyles from "../_styles/editor.module.css";

type Props = {
  group: ContentGroup;
  draft: PortfolioData;
  dirty: boolean;
  saving: boolean;
  canSave: boolean;
  onChange: (key: SectionKey, value: unknown) => void;
  onSave: () => void;
  onDiscard: () => void;
};

/* Edits every data key of one sidebar group, with a sticky save bar */
export default function SectionEditor({ group, draft, dirty, saving, canSave, onChange, onSave, onDiscard }: Props) {
  const errors = group.keys.flatMap((k) => collectErrors(k, draft[k]));

  return (
    <section className={`${styles.admCard} ${styles.admEditorCard}`} aria-labelledby="adm-section-title">
      <header className={styles.admSectionHead}>
        <span className={styles.admMetricIcon}>
          <group.icon size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 id="adm-section-title" className={styles.admCardTitle}>{group.label}</h2>
          <p className={styles.admMuted}>{group.description}</p>
        </div>
      </header>

      {/* Only this area scrolls; header and save bar stay in place */}
      <div className={styles.admSectionBody}>
        <div className={editorStyles.edGrid}>
          {group.keys.map((key) => (
            <FieldEditor
              key={key}
              name={key}
              value={draft[key]}
              template={DATA[key]}
              onChange={(v) => onChange(key, v)}
            />
          ))}
        </div>
      </div>

      <div className={styles.admSaveBar} role="region" aria-label="Save changes">
        <p className={styles.admSaveMsg}>
          {errors.length > 0
            ? `Fix ${errors.length} field${errors.length > 1 ? "s" : ""} before saving.`
            : dirty
              ? "You have unsaved changes."
              : "All changes saved."}
        </p>
        <div className={styles.admSaveActions}>
          <Tooltip title="Discard" text={`Undo unsaved edits in ${group.label}.`}>
            <button type="button" className={styles.admGhostBtn} onClick={onDiscard} disabled={!dirty || saving}>
              <Undo2 size={16} aria-hidden="true" /> Discard
            </button>
          </Tooltip>
          <Tooltip
            title="Save changes"
            text={
              !canSave
                ? "Saving is disabled until Redis is configured and reachable."
                : errors.length > 0
                  ? "Fix the highlighted fields first."
                  : "Stores this section in Redis and updates the live site right away."
            }
          >
            <button
              type="button"
              className={styles.admPrimaryBtn}
              onClick={onSave}
              disabled={!dirty || saving || errors.length > 0 || !canSave}
            >
              <Save size={16} aria-hidden="true" /> {saving ? "Saving…" : "Save changes"}
            </button>
          </Tooltip>
        </div>
      </div>
    </section>
  );
}
