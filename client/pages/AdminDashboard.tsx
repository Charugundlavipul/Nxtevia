import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAllOpportunities, type Opportunity } from "@/lib/opportunities";
import { Link } from "react-router-dom";
import * as React from "react";
import { Activity, CheckCircle, Clock, XCircle, FileText, ArrowRight, LayoutDashboard, Briefcase, Users, Building2, BarChart3, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Opportunity["status"], string> = {
  pending: "Pending",
  approved: "Active",
  rejected: "Rejected",
  revision_required: "Revision Required",
  closed: "Closed",
};

const STATUS_COLOR: Record<Opportunity["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  revision_required: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

export default function AdminDashboard() {
  const [list, setList] = React.useState<Opportunity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchAllOpportunities()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: list.length,
    pending: list.filter((s) => s.status === "pending").length,
    active: list.filter((s) => s.status === "approved").length,
    rejected: list.filter((s) => s.status === "rejected").length,
  };

  const renderList = (status: Opportunity["status"] | "all") => {
    const filtered = status === "all" ? list : list.filter((s) => s.status === status);

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
            <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No jobs found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
            There are no jobs with this status currently.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Card key={s.id} className="group relative overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300">
            <div className={cn("absolute top-0 left-0 w-1 h-full",
              s.status === 'approved' ? 'bg-green-500' :
                s.status === 'pending' ? 'bg-amber-500' :
                  s.status === 'rejected' ? 'bg-red-500' : 'bg-slate-500'
            )} />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {s.title}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline" className={cn("font-medium border", STATUS_COLOR[s.status])}>
                  {STATUS_LABEL[s.status]}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">{s.modality}</Badge>
                <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">{s.duration}</Badge>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-4">
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[100px] font-mono">
                  {s.id.slice(0, 8)}
                </div>
                <Button asChild size="sm" className="h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200">
                  <Link to={`/admin/jobs/${s.id}`}>
                    Review <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <Seo title="Admin Dashboard – NxteVia" description="Overview of job postings and activity" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-slate-100/50 dark:from-slate-900/50 to-transparent pointer-events-none" />

        <section className="container py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <LayoutDashboard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                Admin Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Overview of platform activity and job postings requiring attention.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <Link to="/admin/seekers"><Users className="mr-2 h-4 w-4" /> Seekers</Link>
              </Button>
              <Button asChild variant="outline" className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <Link to="/admin/companies"><Building2 className="mr-2 h-4 w-4" /> Companies</Link>
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Postings</CardTitle>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All time submissions</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Review</CardTitle>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Requires immediate attention</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Jobs</CardTitle>
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Currently live on platform</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Rejected</CardTitle>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.rejected}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Does not meet criteria</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <Tabs defaultValue="pending" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <TabsList className="bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-auto flex-wrap justify-start">
                  <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Pending ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Active ({stats.active})</TabsTrigger>
                  <TabsTrigger value="revision_required" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Revision</TabsTrigger>
                  <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Rejected</TabsTrigger>
                  <TabsTrigger value="closed" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Closed</TabsTrigger>
                  <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">All Jobs</TabsTrigger>
                </TabsList>
              </div>

              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 rounded-3xl bg-white/40 dark:bg-slate-800/40 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="pending" className="mt-0">{renderList("pending")}</TabsContent>
                  <TabsContent value="approved" className="mt-0">{renderList("approved")}</TabsContent>
                  <TabsContent value="revision_required" className="mt-0">{renderList("revision_required")}</TabsContent>
                  <TabsContent value="rejected" className="mt-0">{renderList("rejected")}</TabsContent>
                  <TabsContent value="closed" className="mt-0">{renderList("closed")}</TabsContent>
                  <TabsContent value="all" className="mt-0">{renderList("all")}</TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </section>
      </div>
    </Layout>
  );
}
