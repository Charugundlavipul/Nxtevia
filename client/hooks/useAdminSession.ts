import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AdminState = {
  checking: boolean;
  admin: boolean;
  session: Session | null;
};

const isAdminSession = (session: Session | null) => {
  const role = (session?.user?.app_metadata as any)?.role || (session?.user?.user_metadata as any)?.role;
  return role === "admin";
};

export function useAdminSession(): AdminState {
  const [state, setState] = useState<AdminState>({ checking: true, admin: false, session: null });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState({ checking: false, admin: isAdminSession(data.session), session: data.session ?? null });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_evt, session) => {
      setState({ checking: false, admin: isAdminSession(session), session: session ?? null });
    });
    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return state;
}
