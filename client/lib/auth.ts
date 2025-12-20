import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const APP_KEYS = [
  "eaas_authed",
  "eaas_role",
  "eaas_name",
  "eaas_email",
  "eaas_user_id",
  "supabase_access_token",
  "supabase_refresh_token",
];

const PENDING_SIGNUP_KEY = "eaas_pending_signup";

export async function appSignOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  try {
    [...APP_KEYS, PENDING_SIGNUP_KEY].forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

type UiRole = "student" | "company";

export function persistAppSession(
  session: Pick<Session, "access_token" | "refresh_token"> | null,
  role: UiRole,
  userName?: string,
  userEmail?: string,
  userId?: string,
) {
  try {
    localStorage.setItem("eaas_authed", "true");
    localStorage.setItem("eaas_role", role);
    if (userName) localStorage.setItem("eaas_name", userName);
    if (userEmail) localStorage.setItem("eaas_email", userEmail);
    if (userId) localStorage.setItem("eaas_user_id", userId);
    if (session?.access_token) {
      localStorage.setItem("supabase_access_token", session.access_token);
      localStorage.setItem("supabase_refresh_token", session.refresh_token ?? "");
    }
  } catch {
    // storage unavailable, ignore
  }
}

export type PendingSignup = {
  role: UiRole;
  name: string;
  email: string;
};

export function savePendingSignup(data: PendingSignup) {
  try {
    localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function readPendingSignup(): PendingSignup | null {
  try {
    const raw = localStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}

export function clearPendingSignup() {
  try {
    localStorage.removeItem(PENDING_SIGNUP_KEY);
  } catch {
    // ignore
  }
}

export async function ensureSupabaseSession() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    const access_token = localStorage.getItem("supabase_access_token") || "";
    const refresh_token = localStorage.getItem("supabase_refresh_token") || "";
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  } catch {
    // ignore
  }
}
