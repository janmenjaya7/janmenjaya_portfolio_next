"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { CONTACT_LIMITS, validateContact, type ContactInput, type FieldErrors } from "../lib/contact-validation";
import ArrowPillButton from "./ArrowPillButton";
import styles from "../styles/contact.module.css";

const EMPTY: ContactInput = { name: "", email: "", subject: "", message: "" };

const FIELDS: { key: keyof ContactInput; label: string; type: string; placeholder: string; autoComplete: string }[] = [
  { key: "name", label: "Your Name", type: "text", placeholder: "Enter your name", autoComplete: "name" },
  { key: "email", label: "Email Address", type: "email", placeholder: "you@example.com", autoComplete: "email" },
  { key: "subject", label: "Subject", type: "text", placeholder: "Let's work together", autoComplete: "off" },
];

/* Contact form: validates, stores the message via /api/contact, then shows a confirmation popup */
export default function ContactForm() {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const update = (key: keyof ContactInput, v: string) => {
    setValues((s) => ({ ...s, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const focusFirstError = (errs: FieldErrors) => {
    const first = (["name", "email", "subject", "message"] as const).find((k) => errs[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#cf-${first}`)?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const result = validateContact(values);
    if ("errors" in result) {
      setErrors(result.errors);
      focusFirstError(result.errors);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, website: honeypot }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; fields?: FieldErrors }
        | null;

      if (!res.ok || !body?.ok) {
        if (body?.fields) {
          setErrors(body.fields);
          focusFirstError(body.fields);
        }
        setFormError(body?.error || "Couldn't send your message. Please try again.");
        return;
      }

      setSentTo(result.data.name);
      setValues(EMPTY);
      setErrors({});
    } catch {
      setFormError("Network error — check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <form ref={formRef} className={styles.cfForm} onSubmit={submit} noValidate>
        {FIELDS.map((f) => (
          <div key={f.key} className={styles.cfField}>
            <label htmlFor={`cf-${f.key}`} className={`${styles.cfLabel} font-mono-custom`}>
              {f.label}
            </label>
            <input
              id={`cf-${f.key}`}
              type={f.type}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              maxLength={CONTACT_LIMITS[f.key]}
              className={styles.cfInput}
              value={values[f.key]}
              aria-invalid={Boolean(errors[f.key])}
              aria-describedby={errors[f.key] ? `cf-${f.key}-err` : undefined}
              onChange={(e) => update(f.key, e.target.value)}
            />
            {errors[f.key] && (
              <p id={`cf-${f.key}-err`} className={styles.cfError}>
                {errors[f.key]}
              </p>
            )}
          </div>
        ))}

        <div className={styles.cfField}>
          <label htmlFor="cf-message" className={`${styles.cfLabel} font-mono-custom`}>
            Message
            <span className={styles.cfCount}>
              {values.message.length}/{CONTACT_LIMITS.message}
            </span>
          </label>
          <textarea
            id="cf-message"
            rows={5}
            placeholder="Tell me about your project or opportunity..."
            maxLength={CONTACT_LIMITS.message}
            className={`${styles.cfInput} ${styles.cfTextarea}`}
            value={values.message}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "cf-message-err" : undefined}
            onChange={(e) => update("message", e.target.value)}
          />
          {errors.message && (
            <p id="cf-message-err" className={styles.cfError}>
              {errors.message}
            </p>
          )}
        </div>

        {/* Honeypot for bots — hidden from people and screen readers */}
        <div className={styles.cfTrap} aria-hidden="true">
          <label htmlFor="cf-website">Website</label>
          <input
            id="cf-website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {formError && (
          <p className={styles.cfFormError} role="alert">
            {formError}
          </p>
        )}

        <ArrowPillButton type="submit" disabled={sending} className={styles.cfSubmit}>
          {sending ? "Sending…" : "Send Message"}
        </ArrowPillButton>
      </form>

      {sentTo !== null && <SuccessModal name={sentTo} onClose={() => setSentTo(null)} />}
    </>
  );
}

function SuccessModal({ name, onClose }: { name: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className={styles.cfBackdrop} onClick={onClose}>
      <div
        className={styles.cfModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cf-modal-title"
        aria-describedby="cf-modal-text"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.cfModalX} aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
        <svg className={styles.cfCheck} viewBox="0 0 52 52" aria-hidden="true">
          <circle className={styles.cfCheckCircle} cx="26" cy="26" r="24" />
          <path className={styles.cfCheckMark} d="M15 27l7 7 15-16" />
        </svg>
        <h3 id="cf-modal-title" className={`${styles.cfModalTitle} font-syne`}>
          Your response is submitted
        </h3>
        <p id="cf-modal-text" className={styles.cfModalText}>
          Thanks{name ? `, ${name}` : ""}! Your message has been received — I&apos;ll get back to you soon.
        </p>
        <button ref={closeRef} type="button" className={styles.cfModalBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
