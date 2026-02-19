import { supabase } from "./supabase";

export type EmployeeStatus = "interviewing" | "hired";

export type EmployeeRecord = {
  id: string;
  company_id: string;
  opportunity_id: string;
  applicant_id: string;
  status: EmployeeStatus;
  round?: string | null;
  schedule?: string | null;
  interviewer?: string | null;
  notes?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  // feedback removed
  tenure_status?: string | null;
  tenure_notes?: string | null;
  certificate_url?: string | null;
  flagged?: boolean | null;
  flag_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchEmployeeRecordsForOpportunity(opportunityId: string): Promise<EmployeeRecord[]> {
  const { data, error } = await supabase
    .from("employee_records")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as EmployeeRecord[];
}

export async function fetchEmployeeRecordsForCompany(companyId: string): Promise<EmployeeRecord[]> {
  const { data, error } = await supabase
    .from("employee_records")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as EmployeeRecord[];
}

export async function fetchEmployeeRecordById(id: string): Promise<EmployeeRecord | null> {
  const { data, error } = await supabase.from("employee_records").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as EmployeeRecord | null;
}

export async function createEmployeeRecord(payload: Partial<EmployeeRecord>) {
  const { data, error } = await supabase.from("employee_records").insert(payload).select().maybeSingle();
  if (error) throw error;
  return data as EmployeeRecord;
}

export async function updateEmployeeRecord(id: string, patch: Partial<EmployeeRecord>) {
  const { data, error } = await supabase.from("employee_records").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data as EmployeeRecord;
}

export async function deleteEmployeeRecord(id: string) {
  const { error } = await supabase.from("employee_records").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteEmployeeRecordAndRevertApplication(recordId: string) {
  // 1. Get the record to identify opportunity and applicant
  const { data: record, error: fetchError } = await supabase
    .from("employee_records")
    .select("opportunity_id, applicant_id")
    .eq("id", recordId)
    .single();

  if (fetchError || !record) throw new Error("Could not find employee record to delete");

  const { opportunity_id, applicant_id } = record;

  // 2. Delete the record
  const { error: deleteError } = await supabase
    .from("employee_records")
    .delete()
    .eq("id", recordId);

  if (deleteError) throw deleteError;

  // 3. Check for any remaining records to determine correct status
  const { data: remaining } = await supabase
    .from("employee_records")
    .select("status")
    .eq("opportunity_id", opportunity_id)
    .eq("applicant_id", applicant_id);

  let newStatus = "submitted";
  if (remaining && remaining.length > 0) {
    // If they still have a hired record (unlikely but possible), stay hired
    if (remaining.some(r => r.status === "hired")) {
      newStatus = "hired";
    } else if (remaining.some(r => r.status === "interviewing")) {
      newStatus = "interviewing";
    }
  }

  // 4. Update Application status
  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: newStatus })
    .eq("opportunity_id", opportunity_id)
    .eq("applicant_id", applicant_id);

  if (updateError) {
    console.error("Failed to revert application status", updateError);
    // We don't throw here as the primary deletion succeeded
  }
}

export async function fetchAllEmployeeRecords(): Promise<EmployeeRecord[]> {
  const { data, error } = await supabase
    .from("employee_records")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as EmployeeRecord[];
}

export async function transitionToHired(
  companyId: string,
  opportunityId: string,
  applicantId: string,
  details: { role: string; start_date: string; end_date: string; notes?: string }
) {
  // 1. Delete all interviewing records for this applicant/opportunity
  const { error: deleteError } = await supabase
    .from("employee_records")
    .delete()
    .eq("opportunity_id", opportunityId)
    .eq("applicant_id", applicantId)
    .eq("status", "interviewing");

  if (deleteError) throw deleteError;

  // 2. Create the new hired record
  const { data: newRecord, error: createError } = await supabase
    .from("employee_records")
    .insert({
      company_id: companyId,
      opportunity_id: opportunityId,
      applicant_id: applicantId,
      status: "hired",
      role: details.role || null,
      start_date: details.start_date || null,
      end_date: details.end_date || null,
      notes: details.notes || null,
    })
    .select()
    .single();

  if (createError) throw createError;

  // 3. Update application status
  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: "hired" })
    .eq("opportunity_id", opportunityId)
    .eq("applicant_id", applicantId);

  if (updateError) throw updateError;

  return newRecord;
}
