import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { fetchApplicationsForApplicant, type Application, withdrawApplication } from "@/lib/applications";
import { supabase } from "@/lib/supabase";
import { getApplicationStatusLabel, toTitleCase } from "@/lib/uiText";
import { toast } from "@/components/ui/use-toast";

type OppMap = Record<string, { title: string }>;

export default function Dashboard() {
  const [apps, setApps] = React.useState<Application[]>([]);
  const [oppMap, setOppMap] = React.useState<OppMap>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const apps = await fetchApplicationsForApplicant();
        setApps(apps);
        const ids = Array.from(new Set(apps.map((a) => a.opportunity_id)));
        if (ids.length) {
          const { data } = await supabase.from("opportunities").select("id,title").in("id", ids);
          const map: OppMap = {};
          (data || []).forEach((o: any) => { map[o.id] = { title: o.title }; });
          setOppMap(map);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onWithdraw = async (id: string) => {
    try {
      await withdrawApplication(id);
      setApps((list) => list.map((a) => (a.id === id ? { ...a, status: "withdrawn" } : a)));
      toast({ title: "Withdrawn", description: "Application withdrawn.", duration: 2000 });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Could not withdraw", duration: 2000 });
    }
  };

  return (
    <Layout>
      <Seo title="Dashboard" description="Track your opportunities, applications, and messages." canonical={window.location.href} />
      <section className="container py-12">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <Tabs defaultValue="applications">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-6">
            {loading ? (
              <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading applications…</CardContent></Card>
            ) : apps.length === 0 ? (
              <Card><CardContent className="p-6 text-sm text-muted-foreground">No applications yet.</CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {apps.map((a) => {
                  const title = oppMap[a.opportunity_id]?.title || "Opportunity";
                  return (
                    <Card key={a.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{title}</div>
                          <Badge variant="outline">{toTitleCase(getApplicationStatusLabel(a.status))}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">Submitted: {new Date(a.created_at).toLocaleString()}</div>
                        <div className="flex gap-2">
                          {a.resume_url && <a className="underline text-sm" href={a.resume_url} target="_blank" rel="noreferrer">Resume</a>}
                          {a.cover_letter_url && <a className="underline text-sm" href={a.cover_letter_url} target="_blank" rel="noreferrer">Cover letter</a>}
                          {a.portfolio_url && <a className="underline text-sm" href={a.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>}
                          {a.linkedin_url && <a className="underline text-sm" href={a.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" asChild><a href={`/apply/thank-you?projectId=${encodeURIComponent(a.opportunity_id)}`}>View</a></Button>
                          {a.status !== "withdrawn" && (
                            <Button size="sm" variant="outline" onClick={() => onWithdraw(a.id)}>Withdraw</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}
