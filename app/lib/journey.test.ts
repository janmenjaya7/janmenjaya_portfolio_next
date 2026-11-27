import { test } from "node:test";
import assert from "node:assert/strict";
import { buildJourney, classifyCredential, firstYear, resolveProject } from "./journey.ts";

const CREDS = [
  { title: "Master of Computer Applications", inst: "Trident Academy of Creative Technology", meta: "Bhubaneswar, Odisha · 2019 – 2022" },
  { title: "GCP Associate Cloud Engineer", inst: "Google Cloud Platform", meta: "Certified · January 2023" },
  { title: "Android App Development", inst: "Mobile Development Certification", meta: "Certified · May 2020" },
  { title: "Excellence Award", inst: "IFAS Edutech Pvt. Ltd.", meta: "Outstanding Project Performance" },
];
const JOBS = [
  { title: "Software Developer — Frontend", company: "IFAS Edutech Pvt. Ltd.", date: "Present", location: "Pune, Maharashtra", current: true, bullets: ["Own the frontend of 4 live production platforms."] },
  { title: "Frontend Developer", company: "e2eHiring", date: "From Aug 2023", location: "Bengaluru, Karnataka", current: false, bullets: ["Started my professional journey."] },
];

test("firstYear finds 19xx/20xx years only", () => {
  assert.equal(firstYear("Certified · January 2023"), 2023);
  assert.equal(firstYear("2019 – 2022"), 2019);
  assert.equal(firstYear("Outstanding"), null);
  assert.equal(firstYear("Room 2150"), null);
  assert.equal(firstYear(undefined), null);
});

test("classifyCredential", () => {
  assert.equal(classifyCredential("Master of Computer Applications"), "education");
  assert.equal(classifyCredential("B.Tech in CSE"), "education");
  assert.equal(classifyCredential("Excellence Award"), "recognition");
  assert.equal(classifyCredential("GCP Associate Cloud Engineer"), "certification");
});

test("buildJourney orders real milestones from first step to today", () => {
  const j = buildJourney(CREDS, JOBS);
  assert.deepEqual(
    j.map((m) => [m.when, m.kind, m.title]),
    [
      ["2019", "education", "Master of Computer Applications"],
      ["May 2020", "certification", "Android App Development"],
      ["Jan 2023", "certification", "GCP Associate Cloud Engineer"],
      ["Aug 2023", "role", "Frontend Developer"],
      ["Today", "role", "Software Developer — Frontend"],
      ["Recognition", "recognition", "Excellence Award"],
    ],
  );
  const today = j.find((m) => m.current)!;
  assert.equal(today.place, "IFAS Edutech Pvt. Ltd. · Pune");
  assert.equal(today.detail, "Own the frontend of 4 live production platforms.");
});

test("buildJourney never invents: undated, untitled and malformed entries are skipped", () => {
  assert.deepEqual(buildJourney(undefined, null), []);
  assert.deepEqual(buildJourney("x", 5), []);
  const j = buildJourney(
    [null, { title: "" }, { title: "Some Certificate", meta: "no date here" }, { title: "Best Intern Award" }],
    [{ title: "Intern" }, { title: "Dev", company: "Acme", date: "sometime" }, { company: "NoTitle", current: true }],
  );
  assert.deepEqual(j.map((m) => m.title), ["Best Intern Award"], "only the undated award is kept (as Recognition)");
  assert.equal(j[0].when, "Recognition");
});

test("resolveProject attaches verified media and drops dead links", () => {
  const ifas = resolveProject({ title: "IFAS Online Learning Portal", desc: "Portal", stack: ["Next.js"], url: "https://ifasonline.com", status: "live" })!;
  assert.equal(ifas.site, "https://ifasonline.com");
  assert.equal(ifas.image, "/projects/ifas-online-full.webp");
  assert.equal(ifas.tall, true, "full-page screenshot scrolls inside the device");
  assert.equal(ifas.repo, null);
  assert.equal(ifas.contribution, "Frontend development");

  const course = resolveProject({ title: "Course Management System", url: "https://github.com/janmenjaya-biswal", status: "personal" })!;
  assert.equal(course.repo, "https://github.com/janmenjaya7/Course-management-system", "dead profile link replaced by the verified repo");
  assert.equal(course.site, "https://course-management-system-wheat.vercel.app");
  assert.equal(course.image, "/projects/course-management.webp");

  const travel = resolveProject({ title: "Keep Calm and Travel On", url: "https://github.com/janmenjaya-biswal", status: "personal" })!;
  assert.equal(travel.repo, "https://github.com/janmenjaya7/Tourism-management");
  assert.equal(travel.site, null);
  assert.equal(travel.image, null, "no screenshot is invented");
  assert.equal(travel.tall, false);
});

test("resolveProject: sign-in-only tools show as internal — no dead-end login link, real sign-in screen, address kept", () => {
  const crm = resolveProject({ title: "IFAS Admin CRM Dashboard", stack: ["React.js"], url: "https://crm.ifasonline.com", status: "live" })!;
  assert.equal(crm.internal, true);
  assert.equal(crm.live, true, "still a production product");
  assert.equal(crm.site, null, "no 'Visit live site' to a login wall");
  assert.equal(crm.image, "/projects/ifas-crm-login.webp");
  assert.equal(crm.displayHost, "crm.ifasonline.com", "address bar still shows the real host");

  const admin = resolveProject({ title: "IFAS Admin Panel", url: "https://admin.ifasonline.com", status: "live" })!;
  assert.equal(admin.internal, true);
  assert.equal(admin.site, null);
  assert.equal(admin.image, "/projects/ifas-admin-login.webp");

  // any project can be marked internal from /admin with status "internal"
  const hr = resolveProject({ title: "HR Portal", url: "https://hr.example.com", status: "internal" })!;
  assert.equal(hr.internal, true);
  assert.equal(hr.live, true);
  assert.equal(hr.site, null);
  assert.equal(hr.image, null, "no screenshot is invented");
  assert.equal(hr.displayHost, "hr.example.com");

  // public projects are unaffected
  const portal = resolveProject({ title: "IFAS Online Learning Portal", url: "https://ifasonline.com", status: "live" })!;
  assert.equal(portal.internal, false);
  assert.equal(portal.offline, false);
  assert.equal(portal.site, "https://ifasonline.com");
  assert.equal(portal.displayHost, null);
});

test("resolveProject: an uploaded screenshot replaces the built-in one", () => {
  const up = "/api/project-shot/ifas-admin-crm-dashboard?v=1";
  const crm = resolveProject({ title: "IFAS Admin CRM Dashboard", url: "https://crm.ifasonline.com", status: "live" }, up)!;
  assert.equal(crm.image, up);
  assert.equal(crm.imageAlt, "IFAS Admin CRM Dashboard screenshot");
  const ifas = resolveProject({ title: "IFAS Online Learning Portal", url: "https://ifasonline.com", status: "live" }, "/api/project-shot/ifas-online-learning-portal?v=2")!;
  assert.equal(ifas.tall, false, "an upload's height is unknown, so it isn't treated as a scrolling full page");
  // only same-site paths are accepted
  for (const bad of ["https://evil.example/x.jpg", "//evil.example/x.jpg", "/\\evil.example/x.jpg", "javascript:alert(1)", "", null, undefined]) {
    assert.equal(resolveProject({ title: "IFAS Admin Panel", status: "live" }, bad)!.image, "/projects/ifas-admin-login.webp", String(bad));
  }
});

test("resolveProject guards malformed input", () => {
  assert.equal(resolveProject({ title: "  " }), null);
  assert.equal(resolveProject({} as never), null);
  const p = resolveProject({ title: "X", url: "javascript:alert(1)", stack: ["A", "", 3], status: "live" })!;
  assert.equal(p.site, null);
  assert.deepEqual(p.stack, ["A"]);
});

/* ── resume sheet printed on the intro paper ── */
import { buildResumeSheet, fitProjects } from "./journey.ts";
import { DATA } from "../data.ts";

test("resume sheet: built only from the real portfolio data", () => {
  const r = buildResumeSheet(DATA);
  assert.equal(r.name, "Janmenjaya Biswal");
  assert.equal(r.role, "Frontend Developer");
  assert.deepEqual(r.skills.map((g) => g.group), ["Frontend", "Styling & UI", "Tools & DevOps"]);
  assert.ok(r.skills[0].items.includes("React.js"));
  // nothing that isn't in the data (the brief mentioned these; the data doesn't have them)
  const text = JSON.stringify(r);
  assert.ok(!/Redux|YouTube/i.test(text));
  assert.deepEqual(r.roles.map((x) => x.company), ["IFAS Edutech Pvt. Ltd.", "e2eHiring"]);
  assert.ok(r.roles.every((x) => x.points.length <= 4));
  assert.deepEqual(r.education.map((e) => e.title), ["Master of Computer Applications"]);
  assert.deepEqual(r.certifications.map((e) => e.title), ["GCP Associate Cloud Engineer", "Android App Development"]);
  assert.deepEqual(r.recognition.map((e) => e.title), ["Excellence Award"]);
  assert.equal(r.contact.email, "janmenjayabiswal@gmail.com");
});

test("resume sheet: internal tools have no link, personal repos link to GitHub, descriptions are one sentence", () => {
  const r = buildResumeSheet(DATA);
  const by = (t: RegExp) => r.projects.find((p) => t.test(p.title))!;
  assert.equal(by(/CRM/).note, "Internal tool");
  assert.equal(by(/CRM/).href, null);
  assert.equal(by(/Admin Panel/).href, null);
  assert.equal(by(/Online Learning/).note, "ifasonline.com");
  // a verified demo wins over the repo; a repo-only project points to its source
  assert.equal(by(/Course Management/).note, "course-management-system-wheat.vercel.app");
  const repoOnly = buildResumeSheet({ projects: [{ title: "Side thing", url: "https://github.com/x/side", status: "personal" }] }).projects[0];
  assert.equal(repoOnly.note, "Source on GitHub");
  assert.equal(repoOnly.href, "https://github.com/x/side");
  assert.equal(by(/Online Learning/).desc, "Main EdTech platform serving 50,000+ learners.");
  const blank = buildResumeSheet({ projects: [{ title: "No words yet", desc: "", url: "https://example.com", status: "live" }] }).projects[0];
  assert.equal(blank.desc, "", "an empty description stays empty — never a placeholder");
});

test("resume sheet: missing / malformed data never throws or shows blanks", () => {
  for (const bad of [null, undefined, "x", 42, [], {}]) {
    const r = buildResumeSheet(bad);
    assert.equal(r.name, "");
    assert.deepEqual(r.skills, []);
    assert.deepEqual(r.roles, []);
    assert.deepEqual(r.projects, []);
    assert.equal(r.contact.email, null);
  }
  const r = buildResumeSheet({
    email: "not-an-email",
    linkedin: "javascript:alert(1)",
    github: "https://github.com/x",
    skills: [{ cluster: "", items: [{ name: "  " }, { name: "React" }, null] }, { cluster: "Empty", items: [] }, null],
    techPills: ["ignored when clusters exist"],
    experience: [{ title: "Dev", company: "" }, { title: "Dev", company: "Acme", bullets: ["", "  Shipped  ", 5] }, null],
    projects: [{ title: "" }, { title: "A", desc: "One. Two." }, { title: "A" }, null],
    credentials: [{ title: "" }, { title: "B.Tech", inst: "X" }],
  });
  assert.deepEqual(r.skills, [{ group: "Skills", items: ["React"] }]);
  assert.deepEqual(r.roles.map((x) => [x.company, x.points]), [["Acme", ["Shipped"]]]);
  assert.deepEqual(r.projects.map((p) => [p.title, p.desc]), [["A", "One."]], "duplicates and untitled projects dropped");
  assert.deepEqual(r.education.map((e) => e.title), ["B.Tech"]);
  assert.equal(r.contact.email, null);
  assert.equal(r.contact.linkedin, null, "only http(s) links");
  assert.equal(r.contact.github, "https://github.com/x");
});

test("resume sheet: falls back to tech pills (deduped) when there are no skill clusters", () => {
  const r = buildResumeSheet({ techPills: ["React", "React", " Next ", ""] });
  assert.deepEqual(r.skills, [{ group: "Skills", items: ["React", "Next"] }]);
});

import { resumeChapters } from "./journey.ts";

test("chapters: all six for the real data, empty blocks skipped otherwise", () => {
  assert.deepEqual(resumeChapters(buildResumeSheet(DATA)), [
    "Introduction", "Technical expertise", "Professional experience", "Selected work", "Education & credentials", "Contact",
  ]);
  assert.deepEqual(resumeChapters(buildResumeSheet({})), ["Introduction"]);
  assert.deepEqual(resumeChapters(buildResumeSheet({}), true), ["Introduction", "Contact"], "a resume link alone still gets a Contact chapter");
});

test("offline projects: unreachable production sites keep their card but lose the dead link", () => {
  for (const [title, url] of [["Lurnigo Course Marketplace", "https://lurnigo.com"], ["Anjana Samaj Community Site", "https://anjanasamaj.in"], ["ELA Learn", "https://www.elalearn.com/"]]) {
    const p = resolveProject({ title, url, status: "live" })!;
    assert.equal(p.offline, true, title);
    assert.equal(p.live, false, `${title} is not shown as Live`);
    assert.equal(p.site, null, `${title} has no "Visit live site" link`);
    assert.equal(p.displayHost, new URL(url).host.replace(/^www\./, ""), "address bar keeps the real host");
    assert.equal(p.contribution, "Frontend development", "still credited as production work");
  }
  // admin can mark any project offline; a new working URL brings a project straight back
  assert.equal(resolveProject({ title: "Something", url: "https://example.org", status: "offline" })!.offline, true);
  const back = resolveProject({ title: "Lurnigo Course Marketplace", url: "https://lurnigo.in", status: "live" })!;
  assert.equal(back.offline, false);
  assert.equal(back.site, "https://lurnigo.in");
  // internal tools are never "offline" (they are reachable, just private)
  assert.equal(resolveProject({ title: "IFAS Admin CRM Dashboard", url: "https://crm.ifasonline.com", status: "live" })!.offline, false);
  // the resume paper says so too
  const sheet = buildResumeSheet({ projects: [{ title: "ELA Learn", url: "https://elalearn.com", status: "live" }] });
  assert.deepEqual([sheet.projects[0].note, sheet.projects[0].href], ["Site offline", null]);
});

test("resume sheet: when there are too many projects, offline sites drop off first and working ones stay", () => {
  const p = (title: string, note: string) => ({ title, note });
  const list = [p("A", "a.com"), p("B", "Site offline"), p("C", "c.com"), p("D", "Site offline"), p("E", "Source on GitHub")];
  assert.deepEqual(fitProjects(list, 3).map((x) => x.title), ["A", "C", "E"], "both offline sites go, order kept");
  assert.deepEqual(fitProjects(list, 4).map((x) => x.title), ["A", "B", "C", "E"], "only as many as needed, from the end");
  assert.deepEqual(fitProjects(list, 9).map((x) => x.title), ["A", "B", "C", "D", "E"], "fits → unchanged");
  const allLive = [p("A", "a"), p("B", "b"), p("C", "c")];
  assert.deepEqual(fitProjects(allLive, 2).map((x) => x.title), ["A", "B"], "no offline ones → plain cut");
  assert.deepEqual(fitProjects([], 8), []);
  // with the real data the newest project and every working one fit on the sheet
  const titles = buildResumeSheet(DATA).projects.map((x) => x.title);
  assert.ok(titles.includes("Two Brothers Publication") && titles.some((t) => /Course Management/.test(t)), titles.join(" | "));
  assert.ok(titles.length <= 8);
});
