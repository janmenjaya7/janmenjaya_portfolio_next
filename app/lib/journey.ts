/* Career journey + project helpers. Pure and import-free so they run under `node --test`. */

export type MilestoneKind = "education" | "certification" | "role" | "recognition";

export type Milestone = {
  kind: MilestoneKind;
  /** Short label shown large, e.g. "2019", "Aug 2023", "Today". */
  when: string;
  /** Sort key: year (Infinity for current roles, Infinity + 1 for undated recognition). */
  order: number;
  title: string;
  place: string;
  detail: string;
  current: boolean;
};

type Cred = { title?: unknown; inst?: unknown; meta?: unknown };
type Job = { title?: unknown; company?: unknown; date?: unknown; location?: unknown; current?: unknown; bullets?: unknown };

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** First 4-digit year (19xx/20xx) in a string, or null. */
export function firstYear(text: unknown): number | null {
  const m = s(text).match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

/** "Certified · January 2023" → "Jan 2023"; "Bhubaneswar · 2019 – 2022" → "2019". */
function whenLabel(text: string, year: number): string {
  const month = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(19|20)\d{2}\b/i);
  return month ? `${month[1].slice(0, 1).toUpperCase()}${month[1].slice(1, 3).toLowerCase()} ${year}` : String(year);
}

export function classifyCredential(title: string): MilestoneKind {
  if (/award|recogni|honou?r/i.test(title)) return "recognition";
  if (/master|bachelor|degree|\bmca\b|\bbca\b|b\.?tech|m\.?tech|diploma/i.test(title)) return "education";
  return "certification";
}

/**
 * Build an ordered career journey from real portfolio data only:
 * credentials (education, certifications, awards) and experience entries.
 * Nothing is invented — entries without a usable title are skipped.
 */
export function buildJourney(credentials: unknown, experience: unknown): Milestone[] {
  const out: Milestone[] = [];

  for (const c of (Array.isArray(credentials) ? credentials : []) as Cred[]) {
    const title = s(c?.title);
    if (!title) continue;
    const kind = classifyCredential(title);
    const meta = s(c?.meta);
    const year = firstYear(meta);
    if (kind !== "recognition" && year === null) continue; // can't place it on a timeline honestly
    out.push({
      kind,
      when: year === null ? "Recognition" : whenLabel(meta, year),
      order: year === null ? Number.MAX_SAFE_INTEGER : year,
      title,
      place: s(c?.inst),
      detail: meta,
      current: false,
    });
  }

  for (const j of (Array.isArray(experience) ? experience : []) as Job[]) {
    const title = s(j?.title);
    const company = s(j?.company);
    if (!title || !company) continue;
    const current = j?.current === true;
    const date = s(j?.date);
    const year = firstYear(date);
    if (!current && year === null) continue;
    const bullets = Array.isArray(j?.bullets) ? (j.bullets as unknown[]).map(s).filter(Boolean) : [];
    const location = s(j?.location);
    out.push({
      kind: "role",
      when: current ? "Today" : whenLabel(date, year as number),
      order: current ? Number.MAX_SAFE_INTEGER - 1 : (year as number) + 0.5, // a role starting in a year comes after that year's certificates
      title,
      place: location ? `${company} · ${location.split(",")[0]}` : company,
      detail: bullets[0] ?? "",
      current,
    });
  }

  return out.sort((a, b) => a.order - b.order);
}

/* ── projects ── */

export type ProjectExtras = {
  image?: string;
  imageAlt?: string;
  tall?: boolean;
  repo?: string;
  demo?: string;
  /** sign-in-only staff tool: real but not publicly viewable, so no "Visit live site" */
  internal?: boolean;
};

/* Verified extras (real screenshots captured from the live sites, real repositories on github.com/janmenjaya7). */
const EXTRAS: Array<{ match: RegExp; extras: ProjectExtras }> = [
  { match: /two brothers/i, extras: { image: "/projects/two-brothers-full.webp", imageAlt: "Two Brothers Publication home page, scrolled from the top", tall: true } },
  { match: /ifas online/i, extras: { image: "/projects/ifas-online-full.webp", imageAlt: "IFAS Online home page, scrolled from the top", tall: true } },
  // login-only staff tools: the public sign-in screens (captured from the live sites) stand in until real screens are uploaded
  { match: /\bcrm\b/i, extras: { image: "/projects/ifas-crm-login.webp", imageAlt: "IFAS CRM sign-in screen", internal: true } },
  { match: /admin panel/i, extras: { image: "/projects/ifas-admin-login.webp", imageAlt: "IFAS Admin Panel sign-in screen", internal: true } },
  {
    match: /course management/i,
    extras: {
      image: "/projects/course-management.webp",
      imageAlt: "Course management system start screen",
      repo: "https://github.com/janmenjaya7/Course-management-system",
      demo: "https://course-management-system-wheat.vercel.app",
    },
  },
  { match: /keep calm and travel|tourism/i, extras: { repo: "https://github.com/janmenjaya7/Tourism-management" } },
];

/* The résumé sheet has room for this many projects. */
const MAX_SHEET_PROJECTS = 8;

/**
 * Keep the sheet to `max` projects without dropping working ones: when there are too many, offline sites are left
 * out first (from the end), and the original order is kept.
 */
export function fitProjects<T extends { note: string }>(projects: T[], max: number): T[] {
  if (projects.length <= max) return projects;
  const drop = new Set<T>();
  for (let i = projects.length - 1; i >= 0 && projects.length - drop.size > max; i--) {
    if (projects[i].note === "Site offline") drop.add(projects[i]);
  }
  return projects.filter((p) => !drop.has(p)).slice(0, max);
}

/* Links known to be dead (verified 404) are treated as missing rather than shown. */
const DEAD_LINKS = [/^https?:\/\/(www\.)?github\.com\/janmenjaya-biswal\/?$/i];

/*
  Production sites that are currently unreachable (checked Nov 2026 with Google public DNS: anjanasamaj.in and
  elalearn.com no longer exist, lurnigo.com's DNS fails). Those projects stay on the portfolio, marked "offline",
  with no dead "Visit live site" link. In /admin, status "offline" does the same for any project, and giving a
  project a new working URL brings it straight back.
*/
export const OFFLINE_HOSTS = ["lurnigo.com", "anjanasamaj.in", "elalearn.com"];

export type ShowcaseProject = {
  title: string;
  desc: string;
  stack: string[];
  live: boolean;
  site: string | null;
  repo: string | null;
  image: string | null;
  imageAlt: string;
  /** true when the screenshot is a tall full page that can scroll inside a device frame */
  tall: boolean;
  /** sign-in-only tool: shown with an "Internal tool" badge instead of a public link */
  internal: boolean;
  /** host for the device frame's address bar when there's no public link (internal tool or offline site) */
  displayHost: string | null;
  /** was live in production but its site is unreachable now: shown honestly, without a dead link */
  offline: boolean;
  contribution: string;
};

const http = (u: unknown) => {
  const v = s(u);
  return /^https?:\/\/\S+$/i.test(v) && !DEAD_LINKS.some((re) => re.test(v)) ? v : null;
};

/**
 * @param uploadedImage URL of a screenshot uploaded in /admin for this project; it wins over the built-in one.
 * Status "internal" (set in /admin) or a registry match marks a sign-in-only tool: still live, but no public link.
 */
export function resolveProject(
  p: { title?: unknown; desc?: unknown; stack?: unknown; url?: unknown; status?: unknown },
  uploadedImage?: string | null,
): ShowcaseProject | null {
  const title = s(p?.title);
  if (!title) return null;
  const extras = EXTRAS.find((e) => e.match.test(title))?.extras ?? {};
  const url = http(p?.url);
  const internal = p?.status === "internal" || extras.internal === true;
  const host = url ? hostname(url) : null;
  const offline = !internal && (p?.status === "offline" || (!!host && OFFLINE_HOSTS.includes(host)));
  const live = (p?.status === "live" || internal) && !offline;
  const urlIsRepo = !!url && /github\.com/i.test(url);
  // same-site paths only ("//host/…" is another site)
  const upload = typeof uploadedImage === "string" && /^\/(?![/\\])/.test(uploadedImage) ? uploadedImage : null;
  return {
    title,
    desc: s(p?.desc),
    stack: Array.isArray(p?.stack) ? (p.stack as unknown[]).map(s).filter(Boolean) : [],
    live,
    // a sign-in page isn't something to send visitors to; the URL stays for the address bar only
    site: internal || offline ? null : ((live && url && !urlIsRepo ? url : null) ?? extras.demo ?? null),
    repo: (urlIsRepo ? url : null) ?? extras.repo ?? null,
    image: upload ?? extras.image ?? null,
    imageAlt: upload ? `${title} screenshot` : (extras.imageAlt ?? `${title} screenshot`),
    tall: upload ? false : extras.tall === true,
    internal,
    // internal tools and offline sites keep their real address in the device frame even though there's no link
    displayHost: (internal || offline) && host ? host : null,
    offline,
    contribution: live || offline ? "Frontend development" : "Personal project",
  };
}

function hostname(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/* ── the editorial resume printed on the intro's paper ── */

export type ResumeEntry = { title: string; place: string; meta: string };
export type ResumeRole = { title: string; company: string; date: string; location: string; current: boolean; points: string[]; products: string[] };
export type ResumeProject = { title: string; desc: string; stack: string[]; note: string; href: string | null };
export type ResumeSheet = {
  name: string;
  role: string;
  summary: string;
  location: string;
  skills: Array<{ group: string; items: string[] }>;
  roles: ResumeRole[];
  projects: ResumeProject[];
  education: ResumeEntry[];
  certifications: ResumeEntry[];
  recognition: ResumeEntry[];
  contact: { email: string | null; linkedin: string | null; github: string | null; site: string | null };
};

const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(s).filter(Boolean) : []);
const firstSentence = (text: string) => text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
const webLink = (v: unknown) => (/^https?:\/\/\S+$/i.test(s(v)) ? s(v) : null);

/**
 * The resume sheet, built only from real portfolio data (the same data /admin edits).
 * Empty or malformed entries are dropped instead of being shown as blanks; nothing is invented.
 */
export function buildResumeSheet(data: unknown): ResumeSheet {
  const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;

  const skills: ResumeSheet["skills"] = [];
  for (const c of Array.isArray(d.skills) ? d.skills : []) {
    const items = (Array.isArray(c?.items) ? c.items : []).map((i: { name?: unknown }) => s(i?.name)).filter(Boolean).slice(0, 8);
    if (items.length) skills.push({ group: s(c?.cluster) || "Skills", items });
  }
  if (!skills.length) {
    const pills = [...new Set(list(d.techPills))].slice(0, 12);
    if (pills.length) skills.push({ group: "Skills", items: pills });
  }

  const roles: ResumeRole[] = [];
  for (const j of Array.isArray(d.experience) ? d.experience : []) {
    const title = s(j?.title);
    const company = s(j?.company);
    if (!title || !company) continue;
    roles.push({
      title,
      company,
      date: s(j?.date),
      location: s(j?.location),
      current: j?.current === true,
      points: list(j?.bullets).slice(0, 4),
      products: (Array.isArray(j?.products) ? j.products : []).map((p: { name?: unknown }) => s(p?.name)).filter(Boolean),
    });
  }

  const projects: ResumeProject[] = [];
  for (const raw of Array.isArray(d.projects) ? d.projects : []) {
    const p = resolveProject((raw ?? {}) as Record<string, unknown>);
    if (!p || projects.some((x) => x.title === p.title)) continue;
    const href = p.site ?? p.repo;
    const note = p.internal
      ? "Internal tool"
      : p.offline
        ? "Site offline"
      : p.site
        ? (hostname(p.site) ?? "Live")
        : p.repo
          ? "Source on GitHub"
          : p.live
            ? "Live"
            : "Personal project";
    projects.push({ title: p.title, desc: p.desc ? firstSentence(p.desc) : "", stack: p.stack.slice(0, 4), note, href });
  }

  const education: ResumeEntry[] = [];
  const certifications: ResumeEntry[] = [];
  const recognition: ResumeEntry[] = [];
  for (const c of Array.isArray(d.credentials) ? d.credentials : []) {
    const title = s(c?.title);
    if (!title) continue;
    const entry = { title, place: s(c?.inst), meta: s(c?.meta) };
    const kind = classifyCredential(title);
    (kind === "education" ? education : kind === "recognition" ? recognition : certifications).push(entry);
  }

  const email = s(d.email);
  return {
    name: s(d.name),
    role: s(d.role),
    summary: s(d.summary),
    location: s(d.location),
    skills,
    roles,
    projects: fitProjects(projects, MAX_SHEET_PROJECTS),
    education,
    certifications,
    recognition,
    contact: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
      linkedin: webLink(d.linkedin),
      github: webLink(d.github),
      site: webLink(d.siteUrl),
    },
  };
}

export const CHAPTER = {
  intro: "Introduction",
  skills: "Technical expertise",
  roles: "Professional experience",
  work: "Selected work",
  credentials: "Education & credentials",
  contact: "Contact",
} as const;

/** The chapters printed on the paper, in order; empty blocks are skipped (Introduction always prints). */
export function resumeChapters(sheet: ResumeSheet, hasResumeLink = false): string[] {
  const c = sheet.contact;
  return [
    CHAPTER.intro,
    sheet.skills.length ? CHAPTER.skills : "",
    sheet.roles.length ? CHAPTER.roles : "",
    sheet.projects.length ? CHAPTER.work : "",
    sheet.education.length + sheet.certifications.length + sheet.recognition.length ? CHAPTER.credentials : "",
    c.email || c.linkedin || c.github || c.site || hasResumeLink ? CHAPTER.contact : "",
  ].filter(Boolean);
}
