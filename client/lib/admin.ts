export type AdminStatus = "pending" | "approved" | "denied" | "resubmitted";

export interface AdminSubmission {
  id: string;
  org_name: string;
  website?: string;
  country: "US" | "IN" | "CA";
  state?: string;
  city?: string;
  postal_code?: string;
  contact_email: string;
  modality: "remote" | "hybrid" | "on-site";
  title: string;
  desired_outcome: string;
  scope: string;
  duration: string;
  hours_per_week: string;
  stipend: string;
  skills_csv: string;
  createdAt: string;
  status: AdminStatus;
  history?: { at: string; action: AdminStatus | "submitted"; comment?: string }[];
}

const KEY = "eaas_admin_submissions";

function seedSubmissions(): AdminSubmission[] {
  const now = Date.now();
  const mk = (i: number, status: AdminStatus, partial?: Partial<AdminSubmission>): AdminSubmission => ({
    id: `sub_seed_${i}`,
    org_name: partial?.org_name ?? ["CivicHub","Acme Labs","Northwind","Global NGO","StartOps","Bright Labs"][i % 6]!,
    website: partial?.website ?? "https://example.org",
    country: partial?.country ?? (["US","IN","CA"][i % 3] as "US"|"IN"|"CA"),
    state: partial?.state ?? undefined,
    city: partial?.city ?? (i % 3 === 0 ? "San Francisco" : i % 3 === 1 ? "Bengaluru" : "Toronto"),
    postal_code: partial?.postal_code ?? undefined,
    contact_email: partial?.contact_email ?? "hr@example.org",
    modality: partial?.modality ?? (["remote","hybrid","on-site"][i % 3] as "remote"|"hybrid"|"on-site"),
    title: partial?.title ?? [
      "Community events map",
      "Onboarding microsite",
      "Local commerce PWA audit",
      "Content localization EN→FR",
      "Volunteer CRM setup",
      "Carbon footprint calculator",
    ][i % 6]!,
    desired_outcome: partial?.desired_outcome ?? "Publish project outcome with clear KPIs.",
    scope: partial?.scope ?? "Milestones, acceptance criteria, and final outputs with QA.",
    duration: partial?.duration ?? (i % 2 === 0 ? "0–3 months" : "4–6 months"),
    hours_per_week: partial?.hours_per_week ?? (i % 2 === 0 ? "5-10" : "10-20"),
    stipend: partial?.stipend ?? (i % 4 === 0 ? "No pay" : "Benefits based"),
    skills_csv: partial?.skills_csv ?? (i % 2 === 0 ? "React, SQL, Data Viz" : "Figma, HTML, SEO"),
    createdAt: new Date(now - i * 60_000).toISOString(),
    status,
    history: [
      { at: new Date(now - i * 60_000).toISOString(), action: "submitted" },
      ...(status !== "pending" ? [{ at: new Date(now - i * 30_000).toISOString(), action: status, comment: status === "resubmitted" ? "Updated scope as requested" : status === "denied" ? "Scope unclear" : undefined }] : []),
    ],
  });
  const arr: AdminSubmission[] = [];
  for (let i = 1; i <= 4; i++) arr.push(mk(i, "pending"));
  for (let i = 5; i <= 8; i++) arr.push(mk(i, "approved"));
  for (let i = 9; i <= 12; i++) arr.push(mk(i, "denied"));
  for (let i = 13; i <= 16; i++) arr.push(mk(i, "resubmitted"));
  return arr;
}

function load(): AdminSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seeded = seedSubmissions();
      save(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as AdminSubmission[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = seedSubmissions();
      save(seeded);
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = seedSubmissions();
    save(seeded);
    return seeded;
  }
}

function save(list: AdminSubmission[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function adminListSubmissions(): AdminSubmission[] {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function adminGetSubmission(id: string): AdminSubmission | undefined {
  return load().find((s) => s.id === id);
}

export function adminUpsertSubmission(sub: AdminSubmission) {
  const list = load();
  const idx = list.findIndex((s) => s.id === sub.id);
  if (idx >= 0) list[idx] = sub; else list.unshift(sub);
  save(list);
}

export function adminUpdateStatus(id: string, status: AdminStatus, comment?: string): AdminSubmission | undefined {
  const list = load();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  const next = { ...list[idx] } as AdminSubmission;
  next.status = status;
  next.history = [...(next.history ?? []), { at: new Date().toISOString(), action: status, comment }];
  list[idx] = next;
  save(list);
  return next;
}
