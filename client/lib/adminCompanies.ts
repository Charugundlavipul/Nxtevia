export type CompanyStatus = "active" | "banned";
export type PostingStatus = "pending" | "approved" | "denied" | "resubmitted";

export interface AdminCompanyPosting { id: string; title: string; status: PostingStatus; submissionId: string }
export interface AdminCompany {
  id: string;
  name: string;
  email: string;
  country: "US" | "IN" | "CA" | string;
  website?: string;
  joinedAt: string;
  status: CompanyStatus;
  about?: string;
  postings: AdminCompanyPosting[];
}

const KEY = "eaas_admin_companies";

function seed(): AdminCompany[] {
  const now = Date.now();
  const names = ["Acme Labs","Northwind","StartOps","Global NGO","Open Skills","Bright Labs","CivicHub","GreenWorks"];
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `org_${i+1}`,
    name: names[i % names.length]!,
    email: `hr${i+1}@example.com`,
    country: (["US","IN","CA"][i % 3] as "US"|"IN"|"CA"),
    website: "https://example.org",
    joinedAt: new Date(now - i*172800000).toISOString(),
    status: "active" as const,
    about: "We collaborate with emerging talent to deliver scoped outcomes.",
    postings: Array.from({ length: 4 }).map((__, j) => {
      const seq = ((i)*4 + j) % 16; // 0..15
      const submissionId = `sub_seed_${seq + 1}`;
      return {
        id: `post_${i+1}_${j+1}`,
        title: ["Onboarding microsite","Local commerce PWA audit","Volunteer CRM setup","Localization EN→FR"][j % 4]!,
        status: (["pending","approved","denied","resubmitted"] as const)[(i+j)%4],
        submissionId,
      } as const;
    }),
  }));
}

function load(): AdminCompany[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as AdminCompany[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return parsed;
  } catch {
    const s = seed();
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
}

function save(list: AdminCompany[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function adminCompaniesList(): AdminCompany[] {
  return load().sort((a,b)=> b.joinedAt.localeCompare(a.joinedAt));
}

export function adminCompanyGet(id: string): AdminCompany | undefined {
  return load().find((c)=> c.id === id);
}

export function adminCompanyUpdateStatus(id: string, status: CompanyStatus): AdminCompany | undefined {
  const list = load();
  const idx = list.findIndex((c)=> c.id === id);
  if (idx === -1) return undefined;
  const next = { ...list[idx], status };
  list[idx] = next;
  save(list);
  return next;
}
