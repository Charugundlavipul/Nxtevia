import { supabase } from "./supabase";

export type OpportunityCompletion = {
  id: string;
  opportunity_id: string;
  applicant_id: string;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  // feedback removed
  certificate_url?: string | null;
};

// Derived from employee_records where status = 'hired'
export async function fetchCompletionsForApplicant(applicantId: string): Promise<OpportunityCompletion[]> {
  const { data, error } = await supabase
    .from("employee_records")
    .select("id,opportunity_id,applicant_id,role,start_date,end_date,certificate_url")
    .eq("applicant_id", applicantId)
    .eq("status", "hired")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data || []) as OpportunityCompletion[];
}
