import { supabase } from "./supabase";

export type TicketCategory = "general" | "bug" | "feature_request" | "billing" | "technical_support" | "other";
export type TicketStatus = "pending" | "resolved";
export type TicketUserRole = "student" | "company" | "admin";

export interface Ticket {
  id: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    role: TicketUserRole;
  };
  category: TicketCategory;
  title: string;
  description: string;
  status: TicketStatus;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolvedByName?: string | null;
  notes?: string | null;
}

type TicketRow = {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_role: TicketUserRole;
  category: TicketCategory;
  title: string;
  description: string;
  status: TicketStatus;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  notes?: string | null;
};

const mapRow = (row: TicketRow): Ticket => ({
  id: row.id,
  createdAt: row.created_at,
  createdBy: {
    id: row.creator_id,
    name: row.creator_name,
    role: row.creator_role,
  },
  category: row.category,
  title: row.title,
  description: row.description,
  status: row.status,
  resolvedAt: row.resolved_at,
  resolvedBy: row.resolved_by,
  resolvedByName: row.resolved_by_name,
  notes: row.notes,
});

export async function fetchTickets(status?: TicketStatus): Promise<Ticket[]> {
  let query = supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data as TicketRow[]).map(mapRow);
}

export async function createTicket(
  category: TicketCategory,
  title: string,
  description: string,
  createdBy: { id: string; name: string; role: TicketUserRole },
): Promise<Ticket> {
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      creator_id: createdBy.id,
      creator_name: createdBy.name,
      creator_role: createdBy.role,
      category,
      title,
      description,
      status: "pending",
    })
    .select()
    .maybeSingle();
  if (error || !data) throw error || new Error("Ticket insert failed");
  return mapRow(data as TicketRow);
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const { data, error } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as TicketRow) : null;
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  options?: { resolvedById?: string; resolvedByName?: string; notes?: string },
): Promise<Ticket | null> {
  const payload: Partial<TicketRow> = {
    status,
    notes: options?.notes ?? null,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
    resolved_by: status === "resolved" ? options?.resolvedById ?? null : null,
    resolved_by_name: status === "resolved" ? options?.resolvedByName ?? null : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("tickets")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as TicketRow) : null;
}

export async function reopenTicket(id: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from("tickets")
    .update({
      status: "pending",
      resolved_at: null,
      resolved_by: null,
      resolved_by_name: null,
      notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as TicketRow) : null;
}

export const TICKET_CATEGORIES = [
  { value: "general" as const, label: "General inquiry" },
  { value: "bug" as const, label: "Bug report" },
  { value: "feature_request" as const, label: "Feature request" },
  { value: "billing" as const, label: "Billing issue" },
  { value: "technical_support" as const, label: "Technical support" },
  { value: "other" as const, label: "Other" },
];
