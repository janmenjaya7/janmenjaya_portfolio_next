"use client";
import { Save, Undo2 } from "lucide-react";
import { DATA, type PortfolioData } from "../../data";
import type { SectionKey } from "../../lib/portfolio-schema";
import type { ContentGroup } from "../_lib/sections";
import { collectErrors } from "../_lib/validation";
import { FieldEditor } from "./FieldEditor";
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
    <section className={styles.admCard} aria-labelledby="adm-section-title">
      <header className={styles.admSectionHead}>
        <span className={styles.admMetricIcon}>
          <group.icon size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 id="adm-section-title" className={styles.admCardTitle}>{group.label}</h2>
          <p className={styles.admMuted}>{group.description}</p>
        </div>
      </header>

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

      <div className={styles.admSaveBar} role="region" aria-label="Save changes">
        <p className={styles.admSaveMsg}>
          {errors.length > 0
            ? `Fix ${errors.length} field${errors.length > 1 ? "s" : ""} before saving.`
            : dirty
              ? "You have unsaved changes."
              : "All changes saved."}
        </p>
        <div className={styles.admSaveActions}>
          <button type="button" className={styles.admGhostBtn} onClick={onDiscard} disabled={!dirty || saving}>
            <Undo2 size={16} aria-hidden="true" /> Discard
          </button>
          <button
            type="button"
            className={styles.admPrimaryBtn}
            onClick={onSave}
            disabled={!dirty || saving || errors.length > 0 || !canSave}
            title={!canSave ? "Configure Redis to enable saving" : undefined}
          >
            <Save size={16} aria-hidden="true" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </section>
  );
}
