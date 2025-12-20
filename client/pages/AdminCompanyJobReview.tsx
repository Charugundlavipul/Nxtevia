import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase, Calendar, FileText, MessageSquare, Clock } from "lucide-react";
import { adminGetSubmission, adminUpdateStatus } from "@/lib/admin";
import { COUNTRIES } from "@/lib/countries";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminCompanyGet } from "@/lib/adminCompanies";
import * as React from "react";
import { toast } from "@/components/ui/use-toast";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function AdminCompanyJobReview() {
  const navigate = useNavigate();
  const query = useQuery();
  const id = query.get("jobid") || "";

  React.useEffect(() => {
    if (id) navigate(`/admin/jobs/job_id=${id}`, { replace: true });
  }, [id, navigate]);

  const countryLabel = React.useMemo(() => {
    if (!viewSub) return "";
    return COUNTRIES.find((c) => c.code === viewSub.country)?.label || viewSub.country;
  }, [viewSub]);

  return (
    <Layout>
      <Seo title="Redirecting…" description="Redirecting to unified job view" canonical={window.location.href} />
      <section className="container py-10">
        <div className="text-sm text-muted-foreground">Redirecting to job…</div>
        {!id && (
          <div className="mt-3">
            <Button asChild><Link to="/admin/jobs">Back to jobs</Link></Button>
          </div>
        )}
      </section>
    </Layout>
  );
}
