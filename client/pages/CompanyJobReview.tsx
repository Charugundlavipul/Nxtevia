import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useParams, Link } from "react-router-dom";
import * as React from "react";
import { fetchMyOpportunities, updateOpportunity, type Opportunity } from "@/lib/opportunities";
import { toast } from "@/components/ui/use-toast";
import {
  fetchEmployeeRecordsForOpportunity,
} from "@/lib/employeeRecords";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  History,
  FileText,
  HelpCircle,
  Edit,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type CustomQuestion = { prompt: string; type: string; options?: string[] };

export default function CompanyJobReview() {
  const { id } = useParams();
  const [job, setJob] = React.useState<Opportunity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [attestation, setAttestation] = React.useState<any>(null);

  React.useEffect(() => {
    fetchMyOpportunities()
      .then((list) => setJob(list.find((j) => j.id === id) || null))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    if (job?.stipend === "unpaid" && job?.id) {
      supabase.from("legal_attestations")
        .select("*")
        .eq("job_id", job.id)
        .eq("attestation_type", "ESA_STUDENT_EXEMPTION")
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setAttestation(data));
    } else {
      setAttestation(null);
    }
  }, [job]);





  const requirements = job?.requirements || {};
  const reqFlags = [
    ["Resume", requirements.require_resume],
    ["LinkedIn", requirements.require_linkedin],
    ["Cover letter", requirements.require_cover_letter],
    ["Portfolio", requirements.require_portfolio],
    ["Availability", requirements.require_availability],
    ["Contact info", requirements.require_contact],
  ];
  const customQs: CustomQuestion[] = Array.isArray(requirements.custom_questions) ? requirements.custom_questions : [];

  const canEdit = job && ["pending", "revision_required", "approved"].includes(job.status);
  const canClose = job && job.status === "approved";
  const canReopen = job && job.status === "closed";
  const statusLabel = job ? (job.status === "approved" ? "active" : job.status) : "";

  const closeJob = async () => {
    if (!job || job.status !== "approved") {
      toast({ title: "Cannot close", description: "Only active jobs can be closed.", duration: 1800 });
      return;
    }
    try {
      await updateOpportunity(job.id, { status: "closed" } as any, { action: "closed", note: "Closed by company" });
      toast({ title: "Closed", description: "Opportunity closed.", duration: 2000 });
      setJob({ ...job, status: "closed" });
    } catch (err) {
      toast({ title: "Close failed", description: err instanceof Error ? err.message : "Unexpected error", duration: 2000 });
    }
  };

  const reopenJob = async () => {
    if (!job) return;
    try {
      await updateOpportunity(job.id, { status: "approved" } as any, { action: "reopened", note: "Reactivated by company" });
      toast({ title: "Reopened", description: "Job set back to active.", duration: 2000 });
      setJob({ ...job, status: "approved" });
    } catch (err) {
      toast({ title: "Reopen failed", description: err instanceof Error ? err.message : "Unexpected error", duration: 2000 });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Seo title="Loading..." description="Opportunity details" canonical={window.location.href} />
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12">
          <div className="container max-w-6xl space-y-6">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-6">
                <div className="h-64 bg-white dark:bg-slate-900 rounded-xl shadow-sm animate-pulse" />
              </div>
              <div className="h-64 bg-white dark:bg-slate-900 rounded-xl shadow-sm animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <Seo title="Not Found" description="Opportunity details" canonical={window.location.href} />
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 grid place-items-center">
          <div className="flex flex-col items-center justify-center space-y-4 text-center p-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
              <AlertCircle className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Opportunity not found</h2>
            <p className="text-slate-500 dark:text-slate-400">The job you are looking for does not exist or has been removed.</p>
            <Button asChild variant="outline" className="mt-4 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"><Link to="/company/dashboard">Back to Dashboard</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title={job.title} description="Opportunity details" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12">
        <div className="container max-w-6xl space-y-8">

          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                <Link to="/company/dashboard" className="hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Dashboard
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-medium">Job Details</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{job.title}</h1>
                <Badge variant={job.status === "approved" ? "default" : "secondary"} className={cn("capitalize", job.status === "approved" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300")}>
                  {statusLabel}
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border shadow-sm">
                <Link to={`/company/jobs/${job.id}/applicants`}>
                  <Users className="mr-2 h-4 w-4" /> View Applicants
                </Link>
              </Button>
              {canEdit && (
                <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Link to={`/company/jobs/${job.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit & Resubmit</Link>
                </Button>
              )}
              {canClose && (
                <Button variant="destructive" onClick={closeJob} className="shadow-lg shadow-red-500/20">
                  <XCircle className="mr-2 h-4 w-4" /> Close Job
                </Button>
              )}
              {canReopen && (
                <Button variant="outline" onClick={reopenJob} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white">
                  <History className="mr-2 h-4 w-4" /> Reopen Job
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Job Overview */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                    <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg"><FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Problem Statement</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{job.problem}</p>
                  </div>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Scope of Work</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{job.scope}</p>
                  </div>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Skills Required</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map(s => (
                          <span key={s} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Requirements</h3>
                      <div className="flex flex-wrap gap-2">
                        {reqFlags.filter(([, val]) => val).map(([label]) => (
                          <span key={label as string} className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-medium border border-indigo-100 dark:border-indigo-900/50">
                            {label as string}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hiring Banner */}
              <Card className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/80 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg"><Users className="h-5 w-5 text-emerald-700 dark:text-emerald-400" /></div>
                      Manage Applicants & Hiring Pipeline
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg">
                      Review new applications, schedule interviews, and manage your hiring pipeline in the dedicated dashboard.
                    </p>
                  </div>
                  <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 whitespace-nowrap">
                    <Link to={`/company/jobs/${job.id}/applicants`}>
                      Go to Applicant Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* History - Collapsible */}
              <Accordion type="single" collapsible className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/60 dark:border-slate-800 shadow-sm">
                <AccordionItem value="history" className="border-none">
                  <AccordionTrigger className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      View Activity History
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-0">
                    <div className="space-y-4 pt-2">
                      {(job.history || []).map((h: any, idx: number) => (
                        <div key={idx} className="flex gap-4 text-sm">
                          <div className="w-[160px] shrink-0 text-slate-400 dark:text-slate-500 text-xs pt-0.5 font-mono">
                            {new Date(h.at).toLocaleDateString()}, {new Date(h.at).toLocaleTimeString()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700 dark:text-slate-300">{h.action}</div>
                            {h.note && <div className="inline-block text-slate-500 dark:text-slate-400 text-xs mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{h.note}</div>}
                          </div>
                        </div>
                      ))}
                      {(!job.history || job.history.length === 0) && (
                        <div className="text-sm text-slate-400 italic">No history available.</div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg">
                      <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Modality</div>
                      <div className="text-slate-500 dark:text-slate-400 capitalize">{job.modality}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Duration</div>
                      <div className="text-slate-500 dark:text-slate-400">{job.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Hours</div>
                      <div className="text-slate-500 dark:text-slate-400">{job.hours} / week</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg">
                      <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Compensation</div>
                      <div className="text-slate-500 dark:text-slate-400 capitalize">
                        {job.stipend === "paid" && job.pay_amount
                          ? `${job.currency} ${job.pay_amount} / ${job.pay_type}`
                          : (job.stipend === "none" ? "Unpaid" : job.stipend)}
                      </div>
                    </div>
                  </div>
                  {job.stipend === "unpaid" && (
                    <div className="flex items-center gap-3 text-sm pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">ESA Compliance</div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {attestation ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle className="h-3 w-3" /> Verified (v{attestation.version})
                            </span>
                          ) : (
                            <span className="text-amber-500 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Pending Record
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {customQs.length > 0 && (
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Custom Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {customQs.map((q, idx) => (
                      <div key={idx} className="text-sm space-y-1.5">
                        <div className="font-medium text-slate-900 dark:text-white">{q.prompt}</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">{q.type}</Badge>
                          {q.options?.map((opt, i) => (
                            <span key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{opt}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

