import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { persistAppSession } from "./auth";

export type UiRole = "student" | "company";

export async function provisionProfileForRole(
  session: Session,
  role: UiRole,
  name: string,
  email: string,
) {
  const userId = session.user.id;
  const apiRole = role === "student" ? "seeker" : "company";

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, role: apiRole, display_name: name });
  if (profileErr) {
    throw profileErr;
  }

  if (role === "student") {
    const { error } = await supabase
      .from("seeker_profiles")
      .upsert({ user_id: userId, contact_email: email });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("company_profiles")
      .upsert({ user_id: userId, name, contact_email: email });
    if (error) throw error;
  }

  persistAppSession(session, role, name, email, userId);
}
