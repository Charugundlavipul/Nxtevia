import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

export type UserRole = "student" | "company" | "admin";

function getAuth() {
  const authed = typeof window !== "undefined" && localStorage.getItem("eaas_authed") === "true";
  const role = (typeof window !== "undefined" && (localStorage.getItem("eaas_role") as UserRole | null)) || null;
  return { authed, role } as const;
}

export function RoleGate({ children, allowed }: PropsWithChildren<{ allowed: UserRole[] }>) {
  const { authed, role } = getAuth();
  const loc = useLocation();

  if (!authed) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace state={{ from: loc }} />;
  }
  if (role && allowed.includes(role)) return children as any;

  // Redirect authed users to their area
  let fallback = "/seekers/home";
  if (role === "company") fallback = "/company/home";
  else if (role === "admin") fallback = "/admin/profile";

  return <Navigate to={fallback} replace state={{ from: loc }} />;
}
