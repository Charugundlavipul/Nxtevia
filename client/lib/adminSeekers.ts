export type SeekerStatus = "active" | "banned";

export interface AdminSeeker {
  id: string;
  name: string;
  email: string;
  role: string;
  country: "US" | "IN" | "CA" | string;
  skills: string[];
  joinedAt: string;
  status: SeekerStatus;
  bio?: string;
}

const KEY = "eaas_admin_seekers";

function seed(): AdminSeeker[] {
  const now = Date.now();
  const names = [
    "Sofia Lopez",
    "Alex Kim",
    "Priya Shah",
    "Daniel Wu",
    "Fatima Ali",
    "Jonas Berg",
    "Mei Chen",
    "Aarav Gupta",
  ];
  const roles = [
    "Frontend Developer",
    "Product Designer",
    "Data Analyst",
    "Full‑stack Developer",
    "Marketing Specialist",
    "Backend Developer",
    "UI Engineer",
    "SEO Specialist",
  ];
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `user_${i + 1}`,
    name: names[i % names.length]!,
    email: `user${i + 1}@example.com`,
    role: roles[i % roles.length]!,
    country: ["US", "IN", "CA"][i % 3]!,
    skills: i % 2 === 0 ? ["React", "SQL", "Data Viz"] : ["Figma", "HTML", "SEO"],
    joinedAt: new Date(now - i * 86400000).toISOString(),
    status: "active",
    bio: "Motivated professional seeking real‑world projects to grow skills.",
  }));
}

function load(): AdminSeeker[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as AdminSeeker[];
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

function save(list: AdminSeeker[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function adminSeekersList(): AdminSeeker[] {
  return load().sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
}

export function adminSeekerGet(id: string): AdminSeeker | undefined {
  return load().find((s) => s.id === id);
}

export function adminSeekerUpdateStatus(id: string, status: SeekerStatus): AdminSeeker | undefined {
  const list = load();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  const next = { ...list[idx], status } as AdminSeeker;
  list[idx] = next;
  save(list);
  return next;
}
