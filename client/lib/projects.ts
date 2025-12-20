export type WorkMode = "remote" | "hybrid" | "on-site";
export type StipendTier = "none" | "micro" | "modest";

export interface SpecProject {
  id: string;
  title: string;
  organization: string;
  country: "US" | "IN" | "CA";
  city?: string;
  work_mode: WorkMode;
  duration_weeks: number;
  hours_per_week: "5-10" | "10-15" | "15-20" | "20+" | "5–10" | "10–20" | "20+" | string;
  skills: string[];
  summary: string;
  outcomes: string;
  scope: string;
  stipend: StipendTier; // no pay|micro|modest -> mapped to none|micro|modest
  badge?: string;
  apply_url: string;
  logo_url?: string;
  region_tag: "us" | "in" | "ca";
  posted_at: string; // ISO date
}

export interface UiProject {
  id: string;
  title: string;
  org: string;
  country: SpecProject["country"];
  modality: WorkMode;
  durationWeeks: number;
  stipend: StipendTier;
  skills: string[];
  slug: string;
  hoursPerWeek: string;
  summary: string;
  outcomes: string;
  scope: string;
  badge?: string;
  logoUrl?: string;
  applyUrl: string;
  region: SpecProject["region_tag"];
  createdAt: string;
  applicants: number;
}

function toSlug(input: string, id: string) {
  return `${input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id}`;
}

function mapToUi(p: SpecProject, applicants = 0): UiProject {
  return {
    id: p.id,
    title: p.title,
    org: p.organization,
    country: p.country,
    modality: p.work_mode,
    durationWeeks: p.duration_weeks,
    stipend: p.stipend === "no pay" ? "none" : p.stipend, // tolerate older source
    skills: p.skills,
    slug: toSlug(p.title, p.id),
    hoursPerWeek: (p.hours_per_week as string).replace("–", "-"),
    summary: p.summary,
    outcomes: p.outcomes,
    scope: p.scope,
    badge: p.badge,
    logoUrl: p.logo_url,
    applyUrl: p.apply_url,
    region: p.region_tag,
    createdAt: p.posted_at,
    applicants,
  };
}

// Seed projects for prototype. Replace with DB fetch (Supabase/Builder CMS) when connected.
const SPEC_SEED: SpecProject[] = [
  {
    id: "1",
    title: "Social impact data dashboard",
    organization: "Global NGO",
    country: "US",
    work_mode: "remote",
    duration_weeks: 4,
    hours_per_week: "5-10",
    skills: ["React", "Data Viz", "SQL"],
    summary: "Build a small dashboard to visualize 3–5 KPIs for impact reporting.",
    outcomes: "A responsive dashboard with filters and 3 charts; doc on setup.",
    scope: "Week 1: requirements + mock; Week 2: charts; Week 3: QA; Week 4: handoff.",
    stipend: "none",
    badge: "Impact Analyst",
    apply_url: "https://example.com/apply/impact-dashboard",
    logo_url: "https://cdn.builder.io/api/v1/image/assets/placeholder",
    region_tag: "us",
    posted_at: "2025-02-01",
  },
  {
    id: "2",
    title: "Local commerce PWA audit",
    organization: "StartOps",
    country: "IN",
    work_mode: "remote",
    duration_weeks: 2,
    hours_per_week: "5-10",
    skills: ["Audit", "Lighthouse", "PWA"],
    summary: "Evaluate a PWA for performance and offline readiness.",
    outcomes: "Scorecard with 10+ recs prioritized; before/after metrics.",
    scope: "Collect traces, diagnose issues, propose and test fixes.",
    stipend: "none",
    apply_url: "https://example.com/apply/pwa-audit",
    region_tag: "in",
    posted_at: "2025-02-10",
  },
  {
    id: "3",
    title: "Content localization EN→FR",
    organization: "Northwind",
    country: "CA",
    work_mode: "hybrid",
    duration_weeks: 3,
    hours_per_week: "10-15",
    skills: ["Translation", "Copy", "QA"],
    summary: "Translate and QA 10 pages of marketing copy to FR-CA.",
    outcomes: "Localized copy with glossary; QA checklist signed off.",
    scope: "Create glossary, batch translate, review with stakeholder.",
    stipend: "none",
    badge: "Localization Lead",
    apply_url: "https://example.com/apply/localization",
    region_tag: "ca",
    posted_at: "2025-01-28",
  },
];

export const PROJECTS: UiProject[] = SPEC_SEED.map((p, i) => mapToUi(p, [32, 20, 18][i] ?? 0));

export function getProjectById(id: string): UiProject | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function getProjectBySlug(slug: string): UiProject | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function listProjects(): UiProject[] {
  return [...PROJECTS];
}
