"use client";
import { useEffect, useState } from "react";
import { Inbox, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import type { ContactMessage } from "../../lib/messages";
import Tooltip from "./Tooltip";
import styles from "../_styles/admin.module.css";
import ms from "../_styles/messages.module.css";

type Props = {
  messages: ContactMessage[];
  loadError: string;
  onSetRead: (id: string, read: boolean) => void;
  onDelete: (id: string) => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/* Inbox for contact-form submissions */
export default function MessagesPanel({ messages, loadError, onSetRead, onDelete }: Props) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const unread = messages.filter((m) => !m.read).length;
  const shown = filter === "unread" ? messages.filter((m) => !m.read) : messages;

  const toggleOpen = (m: ContactMessage) => {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    if (opening && !m.read) onSetRead(m.id, true); // opening a message marks it read
  };

  return (
    <section className={`${styles.admCard} ${styles.admEditorCard}`} aria-labelledby="adm-msg-title">
      <header className={styles.admSectionHead}>
        <span className={styles.admMetricIcon}>
          <Inbox size={22} aria-hidden="true" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id="adm-msg-title" className={styles.admCardTitle}>Messages</h2>
          <p className={styles.admMuted}>
            {unread} unread · {messages.length} total — sent from the contact form on your site.
          </p>
        </div>
        <div className={ms.msTabs} role="tablist" aria-label="Filter messages">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={`${ms.msTab} ${filter === f ? ms.msTabActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : "Unread"}
              <span className={ms.msTabCount}>{f === "all" ? messages.length : unread}</span>
            </button>
          ))}
        </div>
      </header>

      <div className={styles.admSectionBody}>
        {loadError ? (
          <p className={ms.msEmpty} role="alert">{loadError}</p>
        ) : shown.length === 0 ? (
          <div className={ms.msEmpty}>
            <Inbox size={28} aria-hidden="true" />
            <p>{filter === "unread" ? "No unread messages — you're all caught up." : "No messages yet. They'll appear here when someone uses the contact form."}</p>
          </div>
        ) : (
          <ul className={ms.msList}>
            {shown.map((m) => (
              <MessageItem
                key={m.id}
                msg={m}
                open={openId === m.id}
                onToggle={() => toggleOpen(m)}
                onSetRead={onSetRead}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function MessageItem({
  msg,
  open,
  onToggle,
  onSetRead,
  onDelete,
}: {
  msg: ContactMessage;
  open: boolean;
  onToggle: () => void;
  onSetRead: (id: string, read: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const replyHref = `mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}`;

  return (
    <li className={`${ms.msItem} ${msg.read ? "" : ms.msUnread} ${open ? ms.msOpen : ""}`}>
      <button type="button" className={ms.msHead} aria-expanded={open} onClick={onToggle}>
        <span className={ms.msAvatar} aria-hidden="true">
          {(msg.name.trim()[0] || "?").toUpperCase()}
        </span>
        <span className={ms.msMeta}>
          <span className={ms.msTop}>
            <span className={ms.msName}>{msg.name}</span>
            {!msg.read && <span className={ms.msDot} aria-label="Unread" />}
            <span className={ms.msDate}>{formatDate(msg.createdAt)}</span>
          </span>
          <span className={ms.msSubject}>{msg.subject}</span>
          {!open && <span className={ms.msPreview}>{msg.message}</span>}
        </span>
      </button>

      {open && (
        <div className={ms.msBody}>
          <a href={`mailto:${msg.email}`} className={ms.msEmail}>
            {msg.email}
          </a>
          <p className={ms.msText}>{msg.message}</p>
          <p className={ms.msFull}>
            Received {new Date(msg.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      <div className={ms.msActions}>
        <Tooltip title="Reply" text={`Opens your email app to reply to ${msg.email}.`}>
          <a href={replyHref} className={ms.msBtn}>
            <Reply size={15} aria-hidden="true" /> Reply
          </a>
        </Tooltip>
        <Tooltip title={msg.read ? "Mark as unread" : "Mark as read"}>
          <button type="button" className={ms.msBtn} onClick={() => onSetRead(msg.id, !msg.read)}>
            {msg.read ? <Mail size={15} aria-hidden="true" /> : <MailOpen size={15} aria-hidden="true" />}
            {msg.read ? "Unread" : "Read"}
          </button>
        </Tooltip>
        <Tooltip
          title={confirming ? "Click again to delete" : "Delete"}
          text={confirming ? "This can't be undone." : "Click twice to permanently delete this message."}
        >
          <button
            type="button"
            className={`${ms.msBtn} ${ms.msBtnDanger} ${confirming ? ms.msBtnConfirm : ""}`}
            onClick={() => (confirming ? onDelete(msg.id) : setConfirming(true))}
          >
            <Trash2 size={15} aria-hidden="true" /> {confirming ? "Delete?" : "Delete"}
          </button>
        </Tooltip>
      </div>
    </li>
  );
}
