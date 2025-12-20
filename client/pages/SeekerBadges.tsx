import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { fetchCompletionsForApplicant, type OpportunityCompletion } from "@/lib/opportunityCompletions";
import { toast } from "@/components/ui/use-toast";
import { Award, Calendar, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SeekerBadges() {
  const [items, setItems] = React.useState<Array<OpportunityCompletion & { opportunity_title?: string | null }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const { data: sessionData, error: authErr } = await supabase.auth.getSession();
        if (authErr || !sessionData.session?.user) {
          toast({ title: "Not signed in", description: "Please sign in to view certifications.", duration: 2000 });
          return;
        }
        const userId = sessionData.session.user.id;
        const completions = await fetchCompletionsForApplicant(userId);
        const oppIds = Array.from(new Set(completions.map((c) => c.opportunity_id))).filter(Boolean);
        let titleMap: Record<string, string> = {};
        if (oppIds.length > 0) {
          const { data, error } = await supabase.from("opportunities").select("id,title").in("id", oppIds);
          if (error) throw error;
          (data || []).forEach((row: any) => { titleMap[row.id] = row.title; });
        }
        setItems(completions.map((c) => ({ ...c, opportunity_title: titleMap[c.opportunity_id] })));
      } catch (err) {
        toast({ title: "Load failed", description: err instanceof Error ? err.message : "Could not load certifications", duration: 2200 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const open = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <Seo title="Certifications - NxteVia" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-amber-50/50 dark:from-amber-900/10 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-amber-100/20 dark:bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

        <section className="container py-10 relative z-10 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Award className="h-8 w-8 text-amber-500" />
              Certifications
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
              Your earned credentials and verified achievements from completed opportunities.
            </p>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-white/40 dark:bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
                  <ShieldCheck className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No certifications yet</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                  Complete opportunities to earn verified certifications and badges.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {items.map((it) => (
                  <Card key={it.id} className="group relative overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-yellow-500" />

                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {it.opportunity_title || "Opportunity Completion"}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {it.start_date ? new Date(it.start_date).toLocaleDateString() : "Start"} – {it.end_date ? new Date(it.end_date).toLocaleDateString() : "End"}
                            </span>
                          </div>
                        </div>
                        {it.certificate_url && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            onClick={() => open(it.certificate_url)}
                            title="View Certificate"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {it.role && (
                          <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-100 dark:border-amber-800">
                            {it.role}
                          </Badge>
                        )}
                        <div className="pt-2">
                          <Button
                            className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                            onClick={() => open(it.certificate_url)}
                            disabled={!it.certificate_url}
                          >
                            {it.certificate_url ? "View Certificate" : "Certificate Pending"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
