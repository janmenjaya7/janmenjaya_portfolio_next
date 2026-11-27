import { test } from "node:test";
import assert from "node:assert/strict";
import { contentHealth } from "./content-health.ts";
import { DATA } from "../data.ts";

test("health: the real portfolio content scores well and only lists real gaps", () => {
  const h = contentHealth(DATA);
  assert.ok(h.score >= 80 && h.score <= 100, String(h.score));
  assert.equal(h.passed + h.issues.length, h.total);
  // real gaps in the default data: ELA Learn has no description; Admin Panel and ELA Learn have no tech stack
  assert.ok(h.issues.some((i) => /Describe “ELA Learn”/.test(i.text)));
  assert.ok(h.issues.some((i) => /tech stack for “IFAS Admin Panel”/.test(i.text)));
  assert.ok(!h.issues.some((i) => /Describe “IFAS Admin Panel”/.test(i.text)), "a short but real description is fine");
  // fully described projects are not flagged
  assert.ok(!h.issues.some((i) => /Two Brothers/.test(i.text)));
  // every issue points to a real admin section
  for (const i of h.issues) assert.match(i.group, /^(profile|hero|about|skills|experience|projects|credentials)$/);
});

test("health: fixes come before tips", () => {
  const h = contentHealth(DATA);
  const firstTip = h.issues.findIndex((i) => i.level === "tip");
  const lastFix = h.issues.map((i) => i.level).lastIndexOf("fix");
  assert.ok(firstTip === -1 || lastFix === -1 || lastFix < firstTip);
});

test("health: empty or malformed content never throws and asks for the basics", () => {
  for (const bad of [null, undefined, "x", 42, [], {}]) {
    const h = contentHealth(bad);
    assert.ok(h.score < 30, `score ${h.score}`);
    assert.ok(h.issues.some((i) => i.text === "Add your name"));
    assert.ok(h.issues.some((i) => i.text === "Add your projects"));
  }
  const weird = contentHealth({ name: 5, projects: [null, "x", { title: "  " }, { title: "Real", desc: 3, stack: "React" }], skills: [{ items: "x" }], experience: [{}] });
  assert.ok(weird.issues.some((i) => /Describe “Real”/.test(i.text)), "non-string description counts as missing");
  assert.ok(weird.issues.some((i) => i.text === "Add your work experience"), "an empty job object isn't a job");
});

test("health: offline project links are flagged unless already marked offline", () => {
  const base = { name: "A", role: "B", email: "a@b.co", summary: "x".repeat(50), projects: [{ title: "Old", desc: "A long enough description.", stack: ["React"], url: "https://lurnigo.com" }] };
  assert.ok(contentHealth(base).issues.some((i) => /is offline/.test(i.text)));
  const marked = { ...base, projects: [{ ...base.projects[0], status: "offline" }] };
  assert.ok(!contentHealth(marked).issues.some((i) => /is offline/.test(i.text)));
});

test("health: a complete profile scores 100 with no issues", () => {
  const full = {
    name: "A B",
    role: "Dev",
    email: "a@b.co",
    github: "https://github.com/x",
    summary: "I build fast, accessible web products for real people.",
    stats: [{ num: "3+", label: "Years" }, { num: "50k", label: "Learners" }],
    about: { paragraphs: ["Story."] },
    skills: [{ items: ["React", "Next.js", "TS", "CSS", "HTML"].map((name) => ({ name, level: 80 })) }],
    experience: [{ title: "Dev", company: "Co", current: true, bullets: ["Did things."] }],
    projects: ["P1", "P2", "P3"].map((title) => ({ title, desc: "A clear description of the project.", stack: ["React"], url: "https://example.com" })),
    credentials: [{ title: "MCA" }],
  };
  const h = contentHealth(full);
  assert.equal(h.score, 100);
  assert.deepEqual(h.issues, []);
});
