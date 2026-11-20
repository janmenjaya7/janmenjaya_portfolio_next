import {
  Award,
  Briefcase,
  CodeXml,
  FolderKanban,
  Info,
  Navigation,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import type { PortfolioData } from "../../data";
import type { SectionKey } from "../../lib/portfolio-schema";

export type ContentGroup = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keys: SectionKey[];
  /* Number shown as a badge in the sidebar */
  count?: (d: PortfolioData) => number;
};

/* Sidebar sections of the admin and which data keys each one edits */
export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Name, role, contact details and social links shown across the site.",
    icon: User,
    keys: ["name", "role", "email", "phone", "location", "linkedin", "github", "summary"],
  },
  {
    id: "hero",
    label: "Hero",
    description: "Typewriter words and the stats row in the first screen.",
    icon: Sparkles,
    keys: ["typewriterWords", "stats"],
    count: (d) => d.stats.length,
  },
  {
    id: "navigation",
    label: "Navigation",
    description: "Menu links. Each name must match a section id (About → #about).",
    icon: Navigation,
    keys: ["navLinks"],
    count: (d) => d.navLinks.length,
  },
  {
    id: "about",
    label: "About",
    description: "Intro paragraphs, chips and highlight cards.",
    icon: Info,
    keys: ["about"],
    count: (d) => d.about.cards.length,
  },
  {
    id: "skills",
    label: "Skills",
    description: "Skill clusters with levels (0–100) and the tech pill cloud.",
    icon: CodeXml,
    keys: ["skills", "techPills"],
    count: (d) => d.skills.reduce((n, c) => n + c.items.length, 0),
  },
  {
    id: "experience",
    label: "Experience",
    description: "Work timeline — roles, bullets, live products and tech.",
    icon: Briefcase,
    keys: ["experience"],
    count: (d) => d.experience.length,
  },
  {
    id: "projects",
    label: "Projects",
    description: "Project cards. Status \"live\" shows the green Live badge.",
    icon: FolderKanban,
    keys: ["projects"],
    count: (d) => d.projects.length,
  },
  {
    id: "credentials",
    label: "Credentials",
    description: "Education, certifications and awards.",
    icon: Award,
    keys: ["credentials"],
    count: (d) => d.credentials.length,
  },
];

const LABELS: Record<string, string> = {
  typewriterWords: "Typewriter words",
  navLinks: "Navigation links",
  techPills: "Tech pills",
  linkedin: "LinkedIn URL",
  github: "GitHub URL",
  url: "URL",
  desc: "Description",
  inst: "Institution",
  meta: "Details",
  num: "Number",
  cluster: "Cluster name",
};

export function labelFor(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
