/* Content health for the admin dashboard: what's missing or worth fixing in the portfolio content, as a checklist
   with a score. Pure and defensive (content comes from Redis and may be partial), so it runs under `node --test`. */

export type HealthIssue = {
  /** admin section to open to fix it */
  group: "profile" | "hero" | "about" | "skills" | "experience" | "projects" | "credentials";
  /** short, actionable text */
  text: string;
  /** "fix": visible gap on the live site · "tip": would make it stronger */
  level: "fix" | "tip";
};

export type ContentHealth = { score: number; passed: number; total: number; issues: HealthIssue[] };

const OFFLINE = ["lurnigo.com", "anjanasamaj.in", "elalearn.com"]; // keep in sync with OFFLINE_HOSTS in journey.ts

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

export function contentHealth(raw: unknown): ContentHealth {
  const d = obj(raw);
  const issues: HealthIssue[] = [];
  let total = 0;
  let passed = 0;
  const check = (ok: boolean, issue: HealthIssue) => {
    total++;
    if (ok) passed++;
    else issues.push(issue);
  };

  // profile
  check(!!str(d.name), { group: "profile", text: "Add your name", level: "fix" });
  check(!!str(d.role), { group: "profile", text: "Add your role (e.g. Frontend Developer)", level: "fix" });
  check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(d.email)), { group: "profile", text: "Add a valid contact email", level: "fix" });
  check(!!str(d.linkedin) || !!str(d.github), { group: "profile", text: "Link your LinkedIn or GitHub", level: "tip" });

  // hero
  check(str(d.summary).length >= 40, { group: "hero", text: "Write a short summary (at least a sentence)", level: "fix" });
  const stats = arr(d.stats).filter((s) => str(obj(s).num) && str(obj(s).label));
  check(stats.length >= 2, { group: "hero", text: "Add at least 2 headline numbers (e.g. years, learners)", level: "tip" });

  // about
  check(arr(obj(d.about).paragraphs).some((p) => str(p)), { group: "about", text: "Write your About story", level: "fix" });

  // skills
  const skillItems = arr(d.skills).flatMap((c) => arr(obj(c).items)).filter((i) => str(obj(i).name));
  check(skillItems.length >= 5, { group: "skills", text: skillItems.length ? `Only ${skillItems.length} skills listed — add a few more` : "Add your skills", level: skillItems.length ? "tip" : "fix" });

  // experience
  const jobs = arr(d.experience).map(obj).filter((j) => str(j.title) || str(j.company));
  check(jobs.length > 0, { group: "experience", text: "Add your work experience", level: "fix" });
  if (jobs.length) {
    check(jobs.some((j) => j.current === true), { group: "experience", text: "Mark your current role", level: "tip" });
    for (const j of jobs) {
      check(arr(j.bullets).some((b) => str(b)), { group: "experience", text: `Add achievements to “${str(j.title) || str(j.company)}”`, level: "fix" });
    }
  }

  // projects
  const projects = arr(d.projects).map(obj).filter((p) => str(p.title));
  check(projects.length >= 3, { group: "projects", text: projects.length ? `Only ${projects.length} project${projects.length === 1 ? "" : "s"} — aim for 3 or more` : "Add your projects", level: projects.length ? "tip" : "fix" });
  for (const p of projects) {
    const title = str(p.title);
    check(str(p.desc).length >= 20, { group: "projects", text: `Describe “${title}” (what it does, who uses it)`, level: "fix" });
    check(arr(p.stack).some((s) => str(s)), { group: "projects", text: `Add the tech stack for “${title}”`, level: "tip" });
    const h = host(str(p.url));
    if (h && OFFLINE.includes(h) && p.status !== "offline") {
      check(false, { group: "projects", text: `“${title}” (${h}) is offline — update or remove the link`, level: "tip" });
    }
  }

  // credentials
  check(arr(d.credentials).some((c) => str(obj(c).title)), { group: "credentials", text: "Add education or certifications", level: "tip" });

  // fixes first, then tips; the original order within each
  issues.sort((a, b) => (a.level === b.level ? 0 : a.level === "fix" ? -1 : 1));
  return { score: total ? Math.round((passed / total) * 100) : 0, passed, total, issues };
}
