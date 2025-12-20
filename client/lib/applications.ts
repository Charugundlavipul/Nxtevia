import { supabase } from "./supabase";
import { ensureSupabaseSession } from "./auth";

export type Application = {
  id: string;
  opportunity_id: string;
  applicant_id: string;
  status: string;
  answers: any[];
  resume_url?: string | null;
  cover_letter_url?: string | null;
  portfolio_url?: string | null;
  linkedin_url?: string | null;
  availability?: string | null;
  contact?: string | null;
  applicant_snapshot?: any;
  created_at: string;
  updated_at: string;
};

export async function fetchApplicationsForOpportunity(opportunityId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Application[];
}

export async function fetchApplicationById(id: string): Promise<Application | null> {
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Application | null;
}

export async function fetchApplicationsForApplicant(): Promise<Application[]> {
  await ensureSupabaseSession();
  const { data: sessionData, error: authErr } = await supabase.auth.getSession();
  if (authErr || !sessionData.session?.user) throw authErr || new Error("Not signed in");
  const userId = sessionData.session.user.id;
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("applicant_id", userId)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Application[];
}

export async function withdrawApplication(id: string) {
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}

export async function checkIfApplied(opportunityId: string): Promise<boolean> {
  await ensureSupabaseSession();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) return false;

  const { data, error } = await supabase
    .from("applications")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("applicant_id", sessionData.session.user.id)
    .neq("status", "withdrawn")
    .maybeSingle();

  if (error) {
    console.error("Error checking application status:", error);
    return false;
  }
  return !!data;
}
