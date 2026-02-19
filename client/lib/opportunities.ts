import { supabase } from "./supabase";

export type OpportunityStatus = "pending" | "revision_required" | "rejected" | "approved" | "closed";

export type Opportunity = {
  id: string;
  user_id: string;
  title: string;
  problem: string;
  desired_outcome?: string;
  scope: string;
  modality: string;
  duration: string;
  hours: string;
  stipend: string;
  pay_amount?: number;
  currency?: string;
  pay_type?: string;
  skills: string[];
  status: OpportunityStatus;
  requirements: any;
  history: Array<{ at: string; action: string; by?: string; note?: string }>;
  created_at: string;
  updated_at: string;
  company_name?: string;
  company_id?: string;
};

export async function fetchMyOpportunities(): Promise<Opportunity[]> {
  const { data: sessionData, error: authError } = await supabase.auth.getSession();
  if (authError || !sessionData.session?.user) throw authError || new Error("Not signed in");
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("user_id", sessionData.session.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Opportunity[];
}

export async function createOpportunity(payload: Partial<Opportunity>) {
  const { data: sessionData, error: authError } = await supabase.auth.getSession();
  if (authError || !sessionData.session?.user) throw authError || new Error("Not signed in");
  const baseHistory = [{ at: new Date().toISOString(), action: "submitted" }];
  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      ...payload,
      user_id: sessionData.session.user.id,
      status: "pending",
      history: payload.history ?? baseHistory,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Opportunity;
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus,
  note?: string,
  actor?: string,
) {
  const entry = {
    at: new Date().toISOString(),
    action: status,
    by: actor,
    note,
  };
  const { data: existing, error: fetchErr } = await supabase
    .from("opportunities")
    .select("history")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  const history = Array.isArray(existing?.history) ? [...existing.history, entry] : [entry];
  const { error } = await supabase
    .from("opportunities")
    .update({ status, history })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchAllOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Opportunity[];
}

export async function fetchActiveOpportunities(): Promise<Opportunity[]> {
  const { data: opps, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!opps || opps.length === 0) return [];

  // Fetch company profiles
  const userIds = Array.from(new Set(opps.map((o) => o.user_id)));
  const { data: profiles } = await supabase
    .from("company_profiles")
    .select("user_id, name")
    .in("user_id", userIds);

  const map = new Map<string, string>();
  profiles?.forEach((p) => {
    if (p.name) map.set(p.user_id, p.name);
  });

  return opps.map((o) => ({
    ...o,
    company_name: map.get(o.user_id) || "Unknown Company",
    company_id: o.user_id,
  })) as Opportunity[];
}

export async function fetchOpportunityPublic(id: string): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  return data as Opportunity | null;
}

export async function fetchOpportunityForOwner(id: string): Promise<Opportunity | null> {
  const { data: sessionData, error: authError } = await supabase.auth.getSession();
  if (authError || !sessionData.session?.user) throw authError || new Error("Not signed in");
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("user_id", sessionData.session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data as Opportunity | null;
}

export async function updateOpportunity(
  id: string,
  patch: Partial<Opportunity>,
  historyEntry?: { action: string; note?: string },
) {
  const { data: existing, error: fetchErr } = await supabase
    .from("opportunities")
    .select("history")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  const history = Array.isArray(existing?.history) ? existing.history.slice() : [];
  if (historyEntry) {
    history.push({
      at: new Date().toISOString(),
      action: historyEntry.action,
      note: historyEntry.note,
    });
  }
  const { error } = await supabase
    .from("opportunities")
    .update({ ...patch, history })
    .eq("id", id);
  if (error) throw error;
}
