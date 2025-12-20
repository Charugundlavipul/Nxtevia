import { PropsWithChildren, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdminSession } from "@/hooks/useAdminSession";

export default function AdminGate({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const loc = useLocation();
  const { admin, checking } = useAdminSession();

  useEffect(() => {
    if (checking) return;
    if (!admin) {
      const next = encodeURIComponent(loc.pathname + loc.search);
      navigate(`/admin/login?next=${next}`);
    }
  }, [navigate, loc.pathname, loc.search, admin, checking]);

  if (checking) return null;
  return children as any;
}
