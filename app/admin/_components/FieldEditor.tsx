"use client";
import { useEffect, useId, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { blankFrom, itemTemplate } from "../../lib/portfolio-schema";
import { labelFor } from "../_lib/sections";
import { validateField } from "../_lib/validation";
import Tooltip from "./Tooltip";
import styles from "../_styles/editor.module.css";

type FieldProps = {
  name: string;
  value: unknown;
  /* Matching value from the default data — defines the shape for new items */
  template: unknown;
  onChange: (value: unknown) => void;
};

const LONG_TEXT_KEYS = new Set(["summary", "desc", "paragraphs", "bullets"]);
const SELECT_OPTIONS: Record<string, string[]> = { status: ["live", "personal"] };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/* Picks the editor that fits the value's shape: list, group of fields, toggle, number or text */
export function FieldEditor({ name, value, template, onChange }: FieldProps) {
  if (Array.isArray(value) || Array.isArray(template)) {
    return <ListField name={name} value={value} template={template} onChange={onChange} />;
  }
  if (isObject(value) || isObject(template)) {
    return <ObjectField name={name} value={value} template={template} onChange={onChange} />;
  }
  if (typeof template === "boolean" || typeof value === "boolean") {
    return <ToggleField name={name} value={value === true} onChange={onChange} />;
  }
  if (typeof template === "number" || typeof value === "number") {
    return <NumberField name={name} value={Number(value) || 0} onChange={onChange} />;
  }
  return <TextField name={name} value={typeof value === "string" ? value : ""} onChange={onChange} />;
}

/* ── Primitive fields ── */

function TextField({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const error = validateField(name, value);
  const options = SELECT_OPTIONS[name];
  const long = LONG_TEXT_KEYS.has(name) || value.length > 90;
  const type = name === "email" ? "email" : ["url", "linkedin", "github"].includes(name) ? "url" : "text";

  return (
    <div className={`${styles.edField} ${long ? styles.edWide : ""}`}>
      <label htmlFor={id} className={styles.edLabel}>{labelFor(name)}</label>
      {options ? (
        <select id={id} className={styles.edInput} value={value} onChange={(e) => onChange(e.target.value)}>
          {!options.includes(value) && <option value={value}>{value || "Select…"}</option>}
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : long ? (
        <textarea
          id={id}
          className={`${styles.edInput} ${styles.edTextarea}`}
          value={value}
          rows={3}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={styles.edInput}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <p className={styles.edError} role="alert">{error}</p>}
    </div>
  );
}

function NumberField({ name, value, onChange }: { name: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  const error = validateField(name, value);
  const isLevel = name === "level";

  return (
    <div className={styles.edField}>
      <label htmlFor={id} className={styles.edLabel}>
        {labelFor(name)}
        {isLevel && <span className={styles.edLabelHint}>{value}%</span>}
      </label>
      <div className={styles.edNumberRow}>
        {isLevel && (
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            aria-label={`${labelFor(name)} slider`}
            className={styles.edRange}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        )}
        <input
          id={id}
          type="number"
          className={`${styles.edInput} ${isLevel ? styles.edNumberSmall : ""}`}
          value={Number.isFinite(value) ? value : 0}
          min={isLevel ? 0 : undefined}
          max={isLevel ? 100 : undefined}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
      </div>
      {error && <p className={styles.edError} role="alert">{error}</p>}
    </div>
  );
}

function ToggleField({ name, value, onChange }: { name: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={styles.edField}>
      <span className={styles.edLabel}>{labelFor(name)}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={labelFor(name)}
        className={`${styles.edSwitch} ${value ? styles.edSwitchOn : ""}`}
        onClick={() => onChange(!value)}
      >
        <span className={styles.edSwitchKnob} />
      </button>
    </div>
  );
}

/* ── Object: a grid of its fields ── */

function ObjectField({ name, value, template, onChange }: FieldProps) {
  const obj = isObject(value) ? value : {};
  const tpl = isObject(template) ? template : obj;
  const keys = Array.from(new Set([...Object.keys(tpl), ...Object.keys(obj)]));

  return (
    <fieldset className={`${styles.edGroup} ${styles.edWide}`}>
      <legend className={styles.edGroupTitle}>{labelFor(name)}</legend>
      <div className={styles.edGrid}>
        {keys.map((k) => (
          <FieldEditor
            key={k}
            name={k}
            value={obj[k]}
            template={tpl[k]}
            onChange={(v) => onChange({ ...obj, [k]: v })}
          />
        ))}
      </div>
    </fieldset>
  );
}

/* ── Lists: add, reorder, delete ── */

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

function itemTitle(item: unknown, index: number): string {
  if (isObject(item)) {
    for (const k of ["title", "name", "cluster", "label", "num"]) {
      const v = item[k];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return `Item ${index + 1}`;
}

function ListField({ name, value, template, onChange }: FieldProps) {
  const list = Array.isArray(value) ? value : [];
  const tplList = Array.isArray(template) && template.length ? template : list;
  const itemTpl = itemTemplate(tplList);
  const objectItems = isObject(itemTpl);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const add = () => {
    onChange([...list, blankFrom(tplList.length ? tplList : [""])]);
    setOpenIndex(list.length);
  };

  return (
    <div className={`${styles.edList} ${styles.edWide}`}>
      <div className={styles.edListHead}>
        <span className={styles.edGroupTitle}>{labelFor(name)}</span>
        <span className={styles.edCount}>{list.length}</span>
      </div>

      {list.length === 0 && <p className={styles.edEmpty}>No items yet — add the first one.</p>}

      {objectItems ? (
        <div className={styles.edCards}>
          {list.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={i} className={`${styles.edCard} ${open ? styles.edCardOpen : ""}`}>
                <div className={styles.edCardHead}>
                  <Tooltip title={open ? "Hide fields" : "Edit item"} text={itemTitle(item, i)}>
                    <button
                      type="button"
                      className={styles.edCardToggle}
                      aria-expanded={open}
                      onClick={() => setOpenIndex(open ? null : i)}
                    >
                      <span className={styles.edCardIndex}>{i + 1}</span>
                      <span className={styles.edCardTitle}>{itemTitle(item, i)}</span>
                      <ChevronDown size={16} className={styles.edChevron} aria-hidden="true" />
                    </button>
                  </Tooltip>
                  <ItemActions
                    index={i}
                    total={list.length}
                    onMove={(to) => {
                      onChange(move(list, i, to));
                      setOpenIndex(open ? to : openIndex);
                    }}
                    onDelete={() => {
                      onChange(list.filter((_, j) => j !== i));
                      setOpenIndex(null);
                    }}
                  />
                </div>
                {open && (
                  <div className={styles.edCardBody}>
                    <div className={styles.edGrid}>
                      {Object.keys({ ...(itemTpl as object), ...(isObject(item) ? item : {}) }).map((k) => (
                        <FieldEditor
                          key={k}
                          name={k}
                          value={isObject(item) ? item[k] : undefined}
                          template={(itemTpl as Record<string, unknown>)[k]}
                          onChange={(v) =>
                            onChange(list.map((it, j) => (j === i ? { ...(isObject(it) ? it : {}), [k]: v } : it)))
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.edRows}>
          {list.map((item, i) => (
            <div key={i} className={styles.edRow}>
              <PrimitiveRowInput
                name={name}
                index={i}
                value={typeof item === "string" ? item : String(item ?? "")}
                onChange={(v) => onChange(list.map((it, j) => (j === i ? v : it)))}
              />
              <ItemActions
                index={i}
                total={list.length}
                onMove={(to) => onChange(move(list, i, to))}
                onDelete={() => onChange(list.filter((_, j) => j !== i))}
              />
            </div>
          ))}
        </div>
      )}

      <Tooltip title={`Add to ${labelFor(name)}`} text="Adds a blank one at the end. Fill it in, then save.">
        <button type="button" className={styles.edAdd} onClick={add}>
          <Plus size={16} aria-hidden="true" /> Add {objectItems ? "item" : "entry"}
        </button>
      </Tooltip>
    </div>
  );
}

function PrimitiveRowInput({
  name,
  index,
  value,
  onChange,
}: {
  name: string;
  index: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const label = `${labelFor(name)} ${index + 1}`;
  return LONG_TEXT_KEYS.has(name) ? (
    <textarea
      aria-label={label}
      className={`${styles.edInput} ${styles.edTextarea}`}
      rows={2}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ) : (
    <input aria-label={label} className={styles.edInput} value={value} onChange={(e) => onChange(e.target.value)} />
  );
}

/* Up / down / delete. Delete needs a second click within 3s to confirm. */
function ItemActions({
  index,
  total,
  onMove,
  onDelete,
}: {
  index: number;
  total: number;
  onMove: (to: number) => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <div className={styles.edActions}>
      <Tooltip title="Move up" text="Shows this item earlier on the site.">
        <button
          type="button"
          className={styles.edIconBtn}
          disabled={index === 0}
          aria-label="Move up"
          onClick={() => onMove(index - 1)}
        >
          <ArrowUp size={15} />
        </button>
      </Tooltip>
      <Tooltip title="Move down" text="Shows this item later on the site.">
        <button
          type="button"
          className={styles.edIconBtn}
          disabled={index === total - 1}
          aria-label="Move down"
          onClick={() => onMove(index + 1)}
        >
          <ArrowDown size={15} />
        </button>
      </Tooltip>
      <Tooltip
        title={confirming ? "Click again to delete" : "Delete"}
        text={confirming ? "Removes it from this section. Save to apply." : "Click twice to remove this item."}
      >
        <button
          type="button"
          className={`${styles.edIconBtn} ${styles.edDanger} ${confirming ? styles.edConfirm : ""}`}
          aria-label={confirming ? "Confirm delete" : "Delete"}
          onClick={() => (confirming ? onDelete() : setConfirming(true))}
        >
          <Trash2 size={15} />
          {confirming && <span>Delete?</span>}
        </button>
      </Tooltip>
    </div>
  );
}
