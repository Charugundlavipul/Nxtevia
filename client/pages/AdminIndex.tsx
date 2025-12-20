import * as React from "react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdminSession } from "@/hooks/useAdminSession";

export default function AdminIndex() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { admin, checking } = useAdminSession();
  useEffect(() => {
    if (checking) return;
    if (admin) {
      navigate("/admin/dashboard", { replace: true, state: { from: loc.pathname } });
    } else {
      navigate("/admin/login", { replace: true, state: { from: loc.pathname } });
    }
  }, [navigate, loc.pathname, admin, checking]);
  return null;
}
