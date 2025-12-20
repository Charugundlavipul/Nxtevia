import { supabase } from "./supabase";

export type CompanyRequirements = {
  require_resume: boolean;
  require_linkedin: boolean;
  require_cover_letter: boolean;
  require_portfolio: boolean;
  require_availability: boolean;
  require_contact: boolean;
  preferred_messaging_method: string;
  custom_questions: any[];
};

export const DEFAULT_REQUIREMENTS: CompanyRequirements = {
  require_resume: true,
  require_linkedin: false,
  require_cover_letter: false,
  require_portfolio: false,
  require_availability: false,
  require_contact: false,
  preferred_messaging_method: "messaging",
  custom_questions: [],
};

export async function fetchCompanyRequirements(): Promise<CompanyRequirements> {
  const { data: sessionData, error: authError } = await supabase.auth.getSession();
  if (authError || !sessionData.session?.user) throw authError || new Error("Not signed in");
  const userId = sessionData.session.user.id;
  const { data, error } = await supabase
    .from("company_requirements")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_REQUIREMENTS, ...(data || {}) };
}
