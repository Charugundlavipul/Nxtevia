import * as React from "react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function CompanyIndex() {
  const navigate = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    const authed = localStorage.getItem("eaas_authed") === "true";
    const role = localStorage.getItem("eaas_role");
    if (authed && role === "company") {
      navigate("/company/get-started", { replace: true, state: { from: loc.pathname } });
    } else {
      navigate("/login?next=/company/get-started", { replace: true, state: { from: loc.pathname } });
    }
  }, [navigate, loc.pathname]);
  return null;
}
