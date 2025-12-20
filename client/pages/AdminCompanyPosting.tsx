import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminCompanyGet } from "@/lib/adminCompanies";
import { useParams, Link } from "react-router-dom";
import * as React from "react";

export default function AdminCompanyPosting() {
  const { companyId, postId } = useParams();
  const company = React.useMemo(() => (companyId ? adminCompanyGet(companyId) : undefined), [companyId]);
  const posting = company?.postings.find((p)=> p.id === postId);

  if (!company || !posting) {
    return (
      <Layout>
        <Seo title="Posting not found – Admin" description="Missing posting" canonical={window.location.href} />
        <section className="container py-10">
          <div className="text-sm">Posting not found.</div>
          <div className="mt-3"><Button asChild><Link to="/admin/companies">Back to companies</Link></Button></div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title={`Admin – ${company.name}: ${posting.title}`} description="Posting details" canonical={window.location.href} />
      <section className="container py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{posting.title}</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to={`/admin/companies/${company.id}`}>Back to company</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/companies">Back to list</Link></Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-sm space-y-2">
            <div><span className="font-medium">Company:</span> {company.name}</div>
            <div><span className="font-medium">Status:</span> {posting.status}</div>
            <div className="text-xs text-muted-foreground">Posting ID: {posting.id}</div>
            <div className="pt-2 text-muted-foreground">This view can be extended to include richer posting details and link to review flows.</div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
