import { randomUUID } from "node:crypto";
import type { ContactInput } from "./contact-validation";
import { oldestRead } from "./inbox-rules";
import { getRedis, StoreNotConfiguredError } from "./portfolio-store";

export { validateContact } from "./contact-validation";

/* Contact-form messages, stored in one Redis hash: id → message JSON */

const KEY = "contact:messages";
const MAX_STORED = 1000;

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
};

function requireRedis() {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  return redis;
}

export class InboxFullError extends Error {}

export async function addMessage(input: ContactInput): Promise<ContactMessage> {
  const redis = requireRedis();
  if ((await redis.hlen(KEY)) >= MAX_STORED) {
    // make room by dropping the oldest message you've already read, so a full inbox doesn't silence new visitors
    const victim = oldestRead(await listMessages());
    if (!victim) throw new InboxFullError("Inbox is full.");
    await redis.hdel(KEY, victim.id);
  }
  const msg: ContactMessage = { id: randomUUID(), ...input, createdAt: new Date().toISOString(), read: false };
  await redis.hset(KEY, { [msg.id]: msg });
  return msg;
}

/* Newest first; skips any malformed entries */
export async function listMessages(): Promise<ContactMessage[]> {
  const redis = requireRedis();
  const all = (await redis.hgetall<Record<string, unknown>>(KEY)) ?? {};
  return Object.values(all)
    .map((v) => (typeof v === "string" ? safeParse(v) : v))
    .filter(isMessage)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setMessageRead(id: string, read: boolean): Promise<ContactMessage | null> {
  const redis = requireRedis();
  const raw = await redis.hget<unknown>(KEY, id);
  const msg = typeof raw === "string" ? safeParse(raw) : raw;
  if (!isMessage(msg)) return null;
  const next = { ...msg, read };
  await redis.hset(KEY, { [id]: next });
  return next;
}

export async function deleteMessage(id: string): Promise<boolean> {
  return (await requireRedis().hdel(KEY, id)) > 0;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function isMessage(v: unknown): v is ContactMessage {
  if (typeof v !== "object" || v === null) return false;
  const m = v as Record<string, unknown>;
  return ["id", "name", "email", "subject", "message", "createdAt"].every((k) => typeof m[k] === "string");
}
