import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveView, safeHref, mailtoHref, displayDomain, indexLabel, formatClock, splitDeck } from "./newone-utils.ts";

test("resolveView: ?v=site opens the site view", () => {
  assert.equal(resolveView("site"), "site");
  assert.equal(resolveView(" SITE "), "site");
  assert.equal(resolveView(["site", "intro"]), "site");
});

test("resolveView: missing, empty or unknown values fall back to the intro", () => {
  for (const v of [undefined, null, "", "story", "sites", ["story"], [] as string[]]) {
    assert.equal(resolveView(v), "intro", `value ${JSON.stringify(v)}`);
  }
});

test("safeHref: allows http(s) and mailto only", () => {
  assert.equal(safeHref("https://ifasonline.com"), "https://ifasonline.com");
  assert.equal(safeHref("  http://a.b  "), "http://a.b");
  assert.equal(safeHref("mailto:me@x.io"), "mailto:me@x.io");
  for (const bad of ["javascript:alert(1)", "/relative", "", "   ", null, undefined, 42, {}]) {
    assert.equal(safeHref(bad), null, `value ${JSON.stringify(bad)}`);
  }
});

test("mailtoHref: valid emails only", () => {
  assert.equal(mailtoHref("janmenjayabiswal@gmail.com"), "mailto:janmenjayabiswal@gmail.com");
  assert.equal(mailtoHref(" a@b.co "), "mailto:a@b.co");
  for (const bad of ["", "not-an-email", "a@b", "a b@c.d", null, undefined]) {
    assert.equal(mailtoHref(bad), null, `value ${JSON.stringify(bad)}`);
  }
});

test("displayDomain strips protocol, www and path; keeps raw text when not a URL", () => {
  assert.equal(displayDomain("https://www.ifasonline.com/courses?x=1"), "ifasonline.com");
  assert.equal(displayDomain("https://crm.ifasonline.com"), "crm.ifasonline.com");
  assert.equal(displayDomain("not a url"), "not a url");
});

test("indexLabel pads to two digits and guards bad input", () => {
  assert.equal(indexLabel(0), "01");
  assert.equal(indexLabel(9), "10");
  assert.equal(indexLabel(-3), "01");
  assert.equal(indexLabel(Number.NaN), "01");
});




test("formatClock: formats in the requested zone and guards bad input", () => {
  const d = new Date("2026-01-15T12:58:00Z");
  assert.equal(formatClock(d, "Asia/Kolkata"), "18:28");
  assert.equal(formatClock(d, "UTC"), "12:58");
  assert.equal(formatClock(new Date("invalid"), "Asia/Kolkata"), "--:--");
  assert.equal(formatClock(d, "Not/AZone"), "--:--");
});

test("splitDeck: screenshots go to the deck in order (capped), the rest to the list", () => {
  const p = (title: string, image: string | null) => ({ title, image });
  const items = [p("A", "/a.webp"), p("B", null), p("C", "/c.webp"), p("D", "/d.webp")];
  const { deck, more } = splitDeck(items, 2);
  assert.deepEqual(deck.map((x) => x.title), ["A", "C"]);
  assert.deepEqual(more.map((x) => x.title), ["B", "D"], "over the cap falls through to the list, order kept");
});

test("splitDeck: empty, malformed and zero cap are safe", () => {
  assert.deepEqual(splitDeck([]), { deck: [], more: [] });
  assert.deepEqual(splitDeck(null as unknown as []), { deck: [], more: [] });
  const r = splitDeck([null, undefined, { image: "/x.webp" }] as Array<{ image: string | null } | null | undefined>, 0);
  assert.deepEqual(r, { deck: [], more: [{ image: "/x.webp" }] });
  assert.equal(splitDeck([{ image: "" }], 3).deck.length, 0, "an empty image string isn't a screenshot");
});
