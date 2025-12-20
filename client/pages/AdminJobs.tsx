import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAllOpportunities, type Opportunity } from "@/lib/opportunities";
import { Link } from "react-router-dom";
import * as React from "react";
import { Search, Filter, Briefcase, Eye, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Opportunity["status"], string> = {
  pending: "Pending",
  approved: "Active",
  rejected: "Rejected",
  revision_required: "Revision",
  closed: "Closed",
};

const STATUS_STYLES: Record<Opportunity["status"], string> = {
  pending: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  approved: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  rejected: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  revision_required: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  closed: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const STATUS_ICONS: Record<Opportunity["status"], React.ElementType> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  revision_required: AlertCircle,
  closed: XCircle,
};

export default function AdminJobs() {
  const [jobs, setJobs] = React.useState<Opportunity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  React.useEffect(() => {
    fetchAllOpportunities()
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter((j) => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <Seo title="Admin – Jobs" description="Manage all job postings" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />

        <section className="container py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                All Jobs
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage and review all job opportunities across the platform.
              </p>
            </div>
          </div>

          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Job Postings</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      placeholder="Search jobs..."
                      className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:ring-blue-500/20"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <select
                      className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white appearance-none cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Active</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="h-4 w-4 rotate-90 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-full mb-4">
                    <Briefcase className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">No jobs found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-500 dark:text-slate-400 font-medium pl-6">Title</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Status</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Details</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Posted</TableHead>
                        <TableHead className="text-right text-slate-500 dark:text-slate-400 font-medium pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((job) => {
                        const StatusIcon = STATUS_ICONS[job.status] || Clock;
                        return (
                          <TableRow key={job.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-white">{job.title}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{job.id.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("pl-2 pr-2.5 py-0.5 font-medium border", STATUS_STYLES[job.status])}>
                                <StatusIcon className="w-3 h-3 mr-1.5" />
                                {STATUS_LABEL[job.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 text-xs">
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700">{job.modality}</Badge>
                                <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">{job.duration}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                              {new Date(job.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="ghost" size="sm" asChild className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <Link to={`/admin/jobs/${job.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Review
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
