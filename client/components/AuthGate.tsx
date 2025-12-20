import { PropsWithChildren, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthGate({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    const authed = typeof window !== "undefined" && localStorage.getItem("eaas_authed") === "true";
    if (!authed) {
      const next = encodeURIComponent(loc.pathname + loc.search);
      navigate(`/signup?next=${next}`, { replace: true });
    }
  }, [navigate, loc.pathname, loc.search]);
  return children as any;
}
