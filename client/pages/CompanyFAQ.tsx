import * as React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CompanyFAQ() {
  const navigate = useNavigate();
  useEffect(() => {
    const authed = typeof window !== "undefined" && localStorage.getItem("eaas_authed") === "true";
    const role = typeof window !== "undefined" ? localStorage.getItem("eaas_role") : null;
    if (authed && role === "company") {
      navigate("/company/home#faq", { replace: true });
    } else if (authed && role === "student") {
      navigate("/home#faq", { replace: true });
    } else {
      navigate("/home#faq", { replace: true });
    }
  }, [navigate]);
  return null;
}
