/* Inbox housekeeping rules — pure, so they are unit-tested. */
import type { ContactMessage } from "./messages";

/** Which stored message to remove to make room: the oldest one already read (never an unread one). */
export function oldestRead(messages: ContactMessage[]): ContactMessage | null {
  const read = messages.filter((m) => m && m.read === true && typeof m.createdAt === "string");
  if (!read.length) return null;
  return read.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b));
}
