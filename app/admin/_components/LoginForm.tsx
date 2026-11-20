"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, CircleCheck, Lock, Mail } from "lucide-react";
import { adminApi } from "../_lib/api";
import styles from "../_styles/login.module.css";

const RESEND_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  const sendCode = async () => {
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      setError("Enter a valid email address.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await adminApi.requestCode(clean);
      setStep("code");
      setCode("");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await adminApi.verifyCode(code);
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify the code. Please try again.");
      setCode("");
      setPending(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") sendCode();
    else verify();
  };

  const disabled = !configured || pending;

  return (
    <div className={styles.lgPage}>
      <form className={styles.lgCard} onSubmit={onSubmit} noValidate>
        <div className={styles.lgIcon}>
          {step === "email" ? <Lock size={22} aria-hidden="true" /> : <Mail size={22} aria-hidden="true" />}
        </div>
        <h1 className={styles.lgTitle}>
          {step === "email" ? "Admin" : "Check"}{" "}
          <span className={styles.lgTitleMuted}>{step === "email" ? "login" : "your email"}</span>
        </h1>
        <p className={styles.lgSub}>
          {step === "email"
            ? "Enter the admin email and we'll send you a 6-digit login code."
            : `If ${maskEmail(email.trim())} is the admin email, a code is on its way. It expires in 10 minutes.`}
        </p>

        {!configured && (
          <p className={styles.lgError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            Email login isn&apos;t set up yet. Add ADMIN_EMAIL, RESEND_API_KEY, ADMIN_SESSION_SECRET and the Upstash
            variables to the server environment.
          </p>
        )}

        {step === "email" ? (
          <>
            <label className={styles.lgLabel} htmlFor="lg-email">Email</label>
            <input
              id="lg-email"
              className={styles.lgInput}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              disabled={disabled}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        ) : (
          <>
            <label className={styles.lgLabel} htmlFor="lg-code">Login code</label>
            <input
              id="lg-code"
              ref={codeRef}
              className={`${styles.lgInput} ${styles.lgCode}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              maxLength={6}
              value={code}
              disabled={disabled}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </>
        )}

        {error && (
          <p className={styles.lgError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {error}
          </p>
        )}

        <button type="submit" className={styles.lgSubmit} disabled={disabled}>
          {step === "email"
            ? pending ? "Sending…" : "Send code"
            : pending ? "Verifying…" : "Verify & open admin"}
        </button>

        {step === "code" && (
          <div className={styles.lgLinks}>
            <button
              type="button"
              className={styles.lgLinkBtn}
              onClick={() => {
                setStep("email");
                setError("");
              }}
            >
              <ArrowLeft size={14} aria-hidden="true" /> Change email
            </button>
            <button
              type="button"
              className={styles.lgLinkBtn}
              disabled={cooldown > 0 || pending}
              onClick={sendCode}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : (
                <>
                  <CircleCheck size={14} aria-hidden="true" /> Resend code
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
