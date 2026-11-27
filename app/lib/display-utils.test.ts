import { test } from "node:test";
import assert from "node:assert/strict";
import { stripLeadingEmoji, levelLabel, safeUrl, hostOf, pad2, cleanList, parseStat, formatStat } from "./display-utils.ts";

test("stripLeadingEmoji removes leading emoji, keeps the words", () => {
  assert.equal(stripLeadingEmoji("📍 Pune, MH"), "Pune, MH");
  assert.equal(stripLeadingEmoji("☁️ GCP Certified"), "GCP Certified");
  assert.equal(stripLeadingEmoji("✈️ Travel"), "Travel");
  assert.equal(stripLeadingEmoji("🎓 MCA — Trident Academy"), "MCA — Trident Academy");
  assert.equal(stripLeadingEmoji("👨‍💻 Developer"), "Developer", "ZWJ sequences");
});

test("stripLeadingEmoji leaves plain text and inner emoji alone; guards bad input", () => {
  assert.equal(stripLeadingEmoji("Photography"), "Photography");
  assert.equal(stripLeadingEmoji("Next.js 🚀 apps"), "Next.js 🚀 apps");
  assert.equal(stripLeadingEmoji("  spaced  "), "spaced");
  assert.equal(stripLeadingEmoji(""), "");
  assert.equal(stripLeadingEmoji("📍"), "");
  assert.equal(stripLeadingEmoji(undefined), "");
  assert.equal(stripLeadingEmoji(42), "");
});

test("levelLabel maps levels to words at the boundaries", () => {
  assert.equal(levelLabel(100), "Daily driver");
  assert.equal(levelLabel(90), "Daily driver");
  assert.equal(levelLabel(89), "Fluent");
  assert.equal(levelLabel(80), "Fluent");
  assert.equal(levelLabel(79), "Comfortable");
  assert.equal(levelLabel(65), "Comfortable");
  assert.equal(levelLabel(64), "Learning");
  assert.equal(levelLabel(0), "Learning");
  assert.equal(levelLabel("85"), "Fluent", "numeric strings from the admin");
});

test("levelLabel returns empty for missing or malformed levels", () => {
  for (const bad of [undefined, null, "", "  ", "abc", Number.NaN, {}]) {
    assert.equal(levelLabel(bad), "", `value ${String(bad)}`);
  }
});

test("safeUrl accepts http(s) only", () => {
  assert.equal(safeUrl("https://ifasonline.com"), "https://ifasonline.com");
  assert.equal(safeUrl(" http://a.io/x "), "http://a.io/x");
  for (const bad of ["javascript:alert(1)", "mailto:a@b.c", "/relative", "", "https://", "https://a b", null, 1]) {
    assert.equal(safeUrl(bad), null, `value ${JSON.stringify(bad)}`);
  }
});

test("hostOf strips www and path", () => {
  assert.equal(hostOf("https://www.lurnigo.com/courses"), "lurnigo.com");
  assert.equal(hostOf("nonsense"), "nonsense");
});

test("pad2 and cleanList", () => {
  assert.equal(pad2(0), "01");
  assert.equal(pad2(11), "12");
  assert.equal(pad2(-1), "01");
  assert.deepEqual(cleanList(["React", " ", "", "Next.js ", 3, null]), ["React", "Next.js"]);
  assert.deepEqual(cleanList(undefined), []);
});

test("parseStat reads prefix, number and suffix", () => {
  assert.deepEqual(parseStat("50K+"), { prefix: "", value: 50, decimals: 0, grouped: false, suffix: "K+" });
  assert.deepEqual(parseStat("3+"), { prefix: "", value: 3, decimals: 0, grouped: false, suffix: "+" });
  assert.deepEqual(parseStat("~25%"), { prefix: "~", value: 25, decimals: 0, grouped: false, suffix: "%" });
  assert.deepEqual(parseStat(" 50,000+ "), { prefix: "", value: 50000, decimals: 0, grouped: true, suffix: "+" });
  assert.deepEqual(parseStat("4.5x"), { prefix: "", value: 4.5, decimals: 1, grouped: false, suffix: "x" });
});

test("parseStat returns null when there is nothing to count", () => {
  for (const bad of ["", "N/A", "∞", undefined, null, 12]) {
    assert.equal(parseStat(bad), null, `value ${JSON.stringify(bad)}`);
  }
});

test("formatStat renders in-between and final values, clamped", () => {
  const k = parseStat("50K+")!;
  assert.equal(formatStat(k, 0), "0K+");
  assert.equal(formatStat(k, 24.6), "25K+");
  assert.equal(formatStat(k, 50), "50K+");
  assert.equal(formatStat(k, 999), "50K+", "never overshoots");
  assert.equal(formatStat(k, -5), "0K+");
  const big = parseStat("50,000+")!;
  assert.equal(formatStat(big, 50000), "50,000+");
  assert.equal(formatStat(big, 1234.4), "1,234+");
  assert.equal(formatStat(parseStat("4.5x")!, 2), "2.0x");
  assert.equal(formatStat(parseStat("~25%")!, 25), "~25%");
});

import { skillExtras, skillGroups } from "./display-utils.ts";

test("skills: groups come from the portfolio data (TypeScript included), with honest level words", () => {
  const g = skillGroups([
    { cluster: "Frontend", items: [{ name: "React.js", level: 95 }, { name: "TypeScript", level: 85 }, { name: " ", level: 50 }] },
    { cluster: "", items: [{ name: "Git", level: 70 }] },
    { cluster: "Empty", items: [] },
    null,
  ]);
  assert.deepEqual(g, [
    { name: "Frontend", items: [{ name: "React.js", level: "Daily driver" }, { name: "TypeScript", level: "Fluent" }] },
    { name: "Skills", items: [{ name: "Git", level: "Comfortable" }] },
  ]);
  assert.deepEqual(skillGroups(undefined), []);
  assert.deepEqual(skillGroups("nope"), []);
});

test("skills: extras skip anything already listed (case/punctuation-insensitive, partial names) and duplicates", () => {
  const groups = skillGroups([{ cluster: "x", items: [{ name: "REST APIs / Axios" }, { name: "Git / GitLab / Bitbucket" }, { name: "JavaScript ES6+" }, { name: "HTML5 / CSS3" }] }]);
  assert.deepEqual(skillExtras(["REST API", "GitLab", "JavaScript", "CSS3", "Node.js", "node.js", "", null, "GCP"], groups), ["Node.js", "GCP"]);
  assert.deepEqual(skillExtras(undefined, groups), []);
});

import { prioritiseBullets, splitFigures } from "./display-utils.ts";

test("figures: measurable numbers are found, version numbers are not", () => {
  const f = (s: string) => splitFigures(s).filter((p) => p.figure).map((p) => p.text);
  assert.deepEqual(f("Own the frontend of 4 live production platforms used by 50,000+ learners across India."), ["4", "50,000+"]);
  assert.deepEqual(f("cut UI development time by ~30%."), ["~30%"]);
  assert.deepEqual(f("Integrated 100+ REST APIs"), ["100+"]);
  assert.deepEqual(f("React + ES6+ with HTML5 / CSS3 and SSR"), [], "ES6+, HTML5, CSS3 are names, not figures");
  assert.deepEqual(f("about 25 % faster"), ["25 %"]);
  // the parts always rebuild the original text exactly
  const s = "Optimised Webpack / Babel builds — leaner bundles and ~25% faster page loads.";
  assert.equal(splitFigures(s).map((p) => p.text).join(""), s);
  assert.deepEqual(splitFigures(""), []);
  assert.deepEqual(splitFigures(null), []);
});

test("bullets: outcome lines (with figures) lead, original order kept, nothing dropped or reworded", () => {
  const b = ["Build Next.js apps with SSR", "Own 4 platforms for 50,000+ learners", "Write tests", "Cut load time ~25%", "Integrated 100+ APIs"];
  const r = prioritiseBullets(b);
  assert.deepEqual(r.lead, ["Own 4 platforms for 50,000+ learners", "Cut load time ~25%", "Integrated 100+ APIs"]);
  assert.deepEqual(r.more, ["Build Next.js apps with SSR", "Write tests"]);
  assert.deepEqual([...r.lead, ...r.more].sort(), [...b].sort(), "every bullet still shown");
  assert.deepEqual(prioritiseBullets(["a", "b"]), { lead: ["a", "b"], more: [] }, "short lists: nothing hidden");
  assert.deepEqual(prioritiseBullets(undefined), { lead: [], more: [] });
  assert.deepEqual(prioritiseBullets(["x", " ", 5, "y"], 1), { lead: ["x"], more: ["y"] });
});
