import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { Link } from "react-router-dom";
import { fetchMyOpportunities, type Opportunity } from "@/lib/opportunities";
import { Briefcase, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Archive, ArrowRight, LayoutDashboard, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function useCompanyJobs() {
  const [list, setList] = React.useState<Opportunity[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetchMyOpportunities()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);
  return {
    loading,
    all: list,
    underReview: list.filter((s) => s.status === "pending"),
    active: list.filter((s) => s.status === "approved"),
    closed: list.filter((s) => s.status === "closed"),
    revision: list.filter((s) => s.status === "revision_required"),
    rejected: list.filter((s) => s.status === "rejected"),
  };
}

function JobsTable({ rows }: { rows: Opportunity[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3">
          <Briefcase className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-slate-900 dark:text-white font-medium">No jobs found</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">There are no jobs in this category.</p>
      </div>
    );
  }

  const getStatusBadge = (status: Opportunity["status"]) => {
    switch (status) {
      case "approved": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 className="h-3 w-3" /> Active</span>;
      case "pending": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><Clock className="h-3 w-3" /> Under Review</span>;
      case "revision_required": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100"><AlertCircle className="h-3 w-3" /> Revision</span>;
      case "rejected": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100"><XCircle className="h-3 w-3" /> Rejected</span>;
      case "closed": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"><Archive className="h-3 w-3" /> Closed</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{s.title}</td>
                <td className="px-6 py-4">{getStatusBadge(s.status)}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <Button asChild size="sm" variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-white">
                    <Link to={`/company/jobs/${s.id}`}>Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper icon for applicants column
function UserGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export default function CompanyDashboard() {
  const jobs = useCompanyJobs();
  const [tab, setTab] = React.useState<"all" | "pending" | "active" | "revision" | "rejected" | "closed">("all");

  const current = React.useMemo(() => {
    switch (tab) {
      case "all": return jobs.all;
      case "pending": return jobs.underReview;
      case "active": return jobs.active;
      case "revision": return jobs.revision;
      case "closed": return jobs.closed;
      case "rejected": return jobs.rejected;
      default: return [];
    }
  }, [tab, jobs]);

  const tabs = [
    { id: "all", label: "All", count: jobs.all?.length || 0 },
    { id: "pending", label: "Under Review", count: jobs.underReview.length },
    { id: "active", label: "Active", count: jobs.active.length },
    { id: "revision", label: "Needs Revision", count: jobs.revision.length },
    { id: "closed", label: "Closed", count: jobs.closed.length },
    { id: "rejected", label: "Rejected", count: jobs.rejected.length },
  ] as const;

  const handleViewActive = () => {
    setTab("active"); // Switch directly to active tab
    // Small timeout to allow render, then scroll
    setTimeout(() => {
      document.getElementById("jobs-table-section")?.scrollIntoView({ behavior: "smooth" });
    }, 10);
  };

  return (
    <Layout>
      <Seo title="Company Dashboard – NxteVia" description="Manage posted opportunities" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12">
        <div className="container max-w-6xl space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your job postings and view their status.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Link to="/company/faq"><HelpCircle className="mr-2 h-4 w-4" /> FAQ</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Link to="/company/post-opportunity"><Plus className="mr-2 h-4 w-4" /> Post Opportunity</Link>
              </Button>
            </div>
          </div>

          <ActiveJobsShowcase jobs={jobs.active} loading={jobs.loading} onViewAll={handleViewActive} />

          {/* Main Content Card */}
          <Card id="jobs-table-section" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm scroll-mt-24">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg"><LayoutDashboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Your Opportunities</CardTitle>
                  <CardDescription className="dark:text-slate-400">Track and manage your job listings.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl w-fit">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      tab === t.id
                        ? "bg-white dark:bg-slate-950 text-primary dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                        tab === t.id ? "bg-primary/10 text-primary dark:text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      )}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Table */}
              {jobs.loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <JobsTable rows={current} />
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function ActiveJobsShowcase({ jobs, loading, onViewAll }: { jobs: Opportunity[]; loading: boolean; onViewAll: () => void }) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-indigo-50/50 rounded-2xl p-8 border border-primary/10 text-center">
        <div className="bg-white p-3 rounded-full w-fit mx-auto shadow-sm mb-4">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-primary">No active opportunities</h3>
        <p className="text-primary/80 mt-1 mb-6 max-w-md mx-auto">
          You don't have any jobs currently visible to candidates. Post a new opportunity to get started.
        </p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
          <Link to="/company/post-opportunity">Post your first job</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Opportunities</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{jobs.length} opportunities currently live</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.slice(0, 3).map((job) => (
          <Link key={job.id} to={`/company/jobs/${job.id}`} className="group block h-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-primary/50 transition-all h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/20 transition-colors">
                  <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  LIVE
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-primary dark:group-hover:text-white dark:hover:text-white transition-colors">{job.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Posted {new Date(job.created_at).toLocaleDateString()}</p>

              <div className="mt-auto flex flex-wrap gap-2">
                {job.modality && <span className="text-[10px] px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-100 dark:border-slate-700">{job.modality}</span>}
                {job.duration && <span className="text-[10px] px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-100 dark:border-slate-700">{job.duration}</span>}
              </div>
            </div>
          </Link>
        ))}
        {jobs.length > 3 && (
          <button onClick={onViewAll} className="group block h-full text-left w-full">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/40 hover:bg-primary/5 transition-all h-full flex flex-col items-center justify-center text-center">
              <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary dark:group-hover:text-white dark:hover:text-white" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white dark:hover:text-white">View all {jobs.length} jobs</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

