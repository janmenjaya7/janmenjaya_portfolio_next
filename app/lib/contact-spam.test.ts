import { test } from "node:test";
import assert from "node:assert/strict";
import { countLinks, MAX_LINKS, MIN_FILL_MS, submittedTooFast, validateContact } from "./contact-validation.ts";
import { clientIpFrom } from "./request-ip.ts";
import { oldestRead } from "./inbox-rules.ts";

const ok = { name: "Asha", email: "asha@example.com", subject: "Hello", message: "I'd like to talk about a project." };

test("contact: a normal enquiry passes; required fields and email format are enforced", () => {
  assert.ok("data" in validateContact(ok));
  const r = validateContact({ ...ok, email: "not-an-email", name: "  " });
  assert.ok("errors" in r && r.errors.email && r.errors.name);
  assert.ok("errors" in validateContact(null));
  assert.ok("errors" in validateContact({ ...ok, message: 42 }), "non-string input is rejected, not crashed on");
});

test("spam: link-stuffed messages are rejected; a few links are fine", () => {
  assert.equal(countLinks("see https://a.com and http://b.org/x and www.c.net"), 3);
  assert.equal(countLinks("no links here, just text."), 0);
  assert.equal(countLinks(""), 0);
  const three = `My work: ${"https://x.com ".repeat(MAX_LINKS)}`;
  assert.ok("data" in validateContact({ ...ok, message: three }), "exactly the limit is allowed");
  const four = `Buy now ${"https://spam.example/p ".repeat(MAX_LINKS + 1)}`;
  const r = validateContact({ ...ok, message: four });
  assert.ok("errors" in r && /no more than 3 links/.test(r.errors.message ?? ""));
});

test("spam: forms sent faster than a person can type are bots; unknown timing is not", () => {
  assert.equal(submittedTooFast(400), true);
  assert.equal(submittedTooFast(MIN_FILL_MS - 1), true);
  assert.equal(submittedTooFast(MIN_FILL_MS), false, "boundary: exactly the minimum is human");
  assert.equal(submittedTooFast(45_000), false);
  // older cached page / curl: no timing → not blocked here (rate limits still apply)
  assert.equal(submittedTooFast(undefined), false);
  assert.equal(submittedTooFast(null), false);
  assert.equal(submittedTooFast("100"), false);
  assert.equal(submittedTooFast(Number.NaN), false);
  assert.equal(submittedTooFast(-5), false, "a broken clock isn't proof of a bot");
});

test("rate-limit IP: platform headers win over the visitor-controllable x-forwarded-for", () => {
  const h = (o: Record<string, string>) => (n: string) => o[n] ?? null;
  assert.equal(clientIpFrom(h({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9" })), "1.1.1.1");
  assert.equal(clientIpFrom(h({ "x-vercel-forwarded-for": "2.2.2.2, 10.0.0.1", "x-forwarded-for": "9.9.9.9" })), "2.2.2.2");
  assert.equal(clientIpFrom(h({ "x-forwarded-for": " 3.3.3.3 , 10.0.0.1" })), "3.3.3.3");
  assert.equal(clientIpFrom(h({ "x-real-ip": "  " , "x-forwarded-for": "4.4.4.4" })), "4.4.4.4", "blank header is skipped");
  assert.equal(clientIpFrom(h({})), "unknown");
});

test("full inbox: makes room by dropping the oldest READ message, never an unread one", () => {
  const m = (id: string, createdAt: string, read: boolean) => ({ id, name: "n", email: "e@x.io", subject: "s", message: "mmmmmmmmmm", createdAt, read });
  const msgs = [m("a", "2026-03-01T00:00:00Z", false), m("b", "2026-01-05T00:00:00Z", true), m("c", "2026-02-01T00:00:00Z", true), m("d", "2025-12-01T00:00:00Z", false)];
  assert.equal(oldestRead(msgs)?.id, "b", "the oldest unread (d) is kept; the oldest read (b) goes");
  assert.equal(oldestRead(msgs.filter((x) => !x.read)), null, "all unread → nothing deleted (inbox reports full)");
  assert.equal(oldestRead([]), null);
});
