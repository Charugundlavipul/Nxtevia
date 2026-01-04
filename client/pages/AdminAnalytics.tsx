import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { BarChart3, TrendingUp, Users, Clock, MousePointerClick, Eye, FileText, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Metric = { count: number; change: number };

function useAdminAnalytics(range: string) {
  const [loading, setLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState({
    users: { count: 0, change: 0 },
    companies: { count: 0, change: 0 },
    newHires: { count: 0, change: 0 },
    apps: { count: 0, change: 0 },
    jobs: { count: 0, change: 0 },
    mostApplied: [] as { title: string; apps: number }[],
    recentJobs: [] as { title: string; date: string }[],
    responseRate: 0,
    conversion: 0
  });

  React.useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
        const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
        const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000).toISOString();
        const previousEnd = currentStart;

        // Helpers
        const getCount = async (table: string, filter?: (q: any) => any) => {
          let q = supabase.from(table).select("*", { count: "exact", head: true });
          if (filter) q = filter(q);
          const { count } = await q;
          return count || 0;
        };

        const getGrowth = async (table: string, dateCol = "created_at", extraFilter?: any) => {
          // Current period
          let q1 = supabase.from(table).select("*", { count: "exact", head: true }).gte(dateCol, currentStart);
          if (extraFilter) q1 = q1.match(extraFilter);
          const count1 = (await q1).count || 0;

          // Previous period
          let q2 = supabase.from(table).select("*", { count: "exact", head: true }).gte(dateCol, previousStart).lt(dateCol, previousEnd);
          if (extraFilter) q2 = q2.match(extraFilter);
          const count2 = (await q2).count || 0;

          const change = count2 === 0 ? (count1 > 0 ? 100 : 0) : Math.round(((count1 - count2) / count2) * 100);
          return { count: count1, change };
        };

        // 1. Users (Learners + Companies) - approximated by profiles
        const users = await getGrowth("profiles");

        // 2. Companies specifically
        const companies = await getGrowth("company_profiles");

        // 3. Jobs (Opportunities)
        const jobs = await getGrowth("opportunities");

        // 4. Applications
        const apps = await getGrowth("applications");

        // 5. Hires
        const hires = await getGrowth("applications", "updated_at", { status: "hired" });

        // 6. Most Applied Opportunities
        const { data: topJobs } = await supabase
          .from("opportunities")
          .select("title, applications(count)")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50);

        const sortedByApps = (topJobs || [])
          .map(j => ({ title: j.title, apps: (j.applications as any)?.[0]?.count || 0 }))
          .sort((a, b) => b.apps - a.apps)
          .slice(0, 5);

        // 7. Recent Jobs
        const { data: recents } = await supabase
          .from("opportunities")
          .select("title, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        const recentFormatted = (recents || []).map(r => ({ title: r.title, date: r.created_at }));

        // 8. Conversion
        const conversionVal = users.count > 0 ? Math.round((apps.count / users.count) * 10) / 10 : 0;

        // 9. Response Rate
        const { count: totalApps } = await supabase.from("applications").select("*", { count: "exact", head: true });
        const { count: pendingApps } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending");
        const processed = (totalApps || 0) - (pendingApps || 0);
        const responseRate = (totalApps && totalApps > 0) ? Math.round((processed / totalApps) * 100) : 0;

        setMetrics({
          users,
          companies,
          newHires: hires,
          apps,
          jobs,
          mostApplied: sortedByApps,
          recentJobs: recentFormatted,
          responseRate,
          conversion: conversionVal
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [range]);

  return { metrics, loading };
}

export default function AdminAnalytics() {
  const [range, setRange] = React.useState("7d");
  const fmt = (n: number) => new Intl.NumberFormat().format(n);



  const { metrics, loading } = useAdminAnalytics(range);

  return (
    <Layout>
      <Seo title="Admin – Analytics" description="Platform analytics" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />

        <section className="container py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Platform performance metrics and user engagement insights.
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-sm">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    range === r
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {/* New Users */}
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full", metrics.users.change >= 0 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400")}>
                    {metrics.users.change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(metrics.users.change)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">New Users</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{fmt(metrics.users.count)}</div>
              </CardContent>
            </Card>

            {/* New Companies - Replaces Bounce Rate */}
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full", metrics.companies.change >= 0 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400")}>
                    {metrics.companies.change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(metrics.companies.change)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">New Companies</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.companies.count}</div>
              </CardContent>
            </Card>

            {/* Total Applications - Replaces Session Duration */}
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full", metrics.apps.change >= 0 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400")}>
                    {metrics.apps.change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(metrics.apps.change)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">New Applications</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{fmt(metrics.apps.count)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Recent Opportunities */}
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Recent Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {metrics.recentJobs.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</span>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {metrics.recentJobs.length === 0 && <div className="text-sm text-slate-500">No data available.</div>}
                </div>
              </CardContent>
            </Card>

            {/* Most Applied */}
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Most Applied Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {metrics.mostApplied.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</span>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{item.apps}</span>
                    </div>
                  ))}
                  {metrics.mostApplied.length === 0 && <div className="text-sm text-slate-500">No data available.</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Conversion / Apps per User */}
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {/* Just showing static icon or could show trend if we tracked historical avg */}
                  <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Avg
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Applications per New User</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.conversion}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">New Applications / New Users</p>
              </CardContent>
            </Card>

            {/* Hiring Stats - Replaces Response Rate */}
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full", metrics.newHires.change >= 0 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400")}>
                    {metrics.newHires.change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(metrics.newHires.change)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Hires (Period)</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.newHires.count}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Candidates marked as hired</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
