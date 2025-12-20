import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as React from "react";
import { toast } from "@/components/ui/use-toast";
import { fetchAllOpportunities, updateOpportunityStatus, type Opportunity } from "@/lib/opportunities";
import { fetchApplicationsForOpportunity, type Application } from "@/lib/applications";
import {
  fetchEmployeeRecordsForOpportunity,
  createEmployeeRecord,
  updateEmployeeRecord,
  deleteEmployeeRecord,
  type EmployeeRecord
} from "@/lib/employeeRecords";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  UserPlus,
  Users,
  History,
  FileText,
  HelpCircle,
  Building2,
  Globe,
  Mail,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminJobReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = React.useState<Opportunity | null>(null);
  const [companyProfile, setCompanyProfile] = React.useState<any>(null);
  const [companyLoading, setCompanyLoading] = React.useState(false);
  const [apps, setApps] = React.useState<Application[]>([]);
  const [records, setRecords] = React.useState<EmployeeRecord[]>([]);
  const [attestation, setAttestation] = React.useState<any>(null);
  const [attestationLoading, setAttestationLoading] = React.useState(false);

  // Pipeline State
  const [saving, setSaving] = React.useState(false);
  const [newInterview, setNewInterview] = React.useState({ applicant_id: "", round: "", schedule: "", interviewer: "", notes: "" });
  const [newHire, setNewHire] = React.useState({ applicant_id: "", role: "", start_date: "", end_date: "" });
  const [showHireForm, setShowHireForm] = React.useState(false);
  const [showInterviewForm, setShowInterviewForm] = React.useState(false);

  // Edit forms
  const [editInterviewOpen, setEditInterviewOpen] = React.useState(false);
  const [editInterview, setEditInterview] = React.useState<EmployeeRecord | null>(null);

  const [editHireOpen, setEditHireOpen] = React.useState(false);
  const [editHire, setEditHire] = React.useState<EmployeeRecord | null>(null);

  React.useEffect(() => {
    const loadJob = async () => {
      try {
        const list = await fetchAllOpportunities();
        setJob(list.find((j) => j.id === id) || null);
      } catch (error) {
        setJob(null);
      }
    };
    loadJob();
  }, [id]);

  React.useEffect(() => {
    if (id) {
      const loadData = async () => {
        try {
          const [appsRes, recsRes] = await Promise.all([
            fetchApplicationsForOpportunity(id),
            fetchEmployeeRecordsForOpportunity(id)
          ]);
          setApps(appsRes);
          setRecords(recsRes);
        } catch (error) {
          setApps([]);
          setRecords([]);
        }
      };
      loadData();
    }
  }, [id]);

  React.useEffect(() => {
    const fetchCompany = async () => {
      if (job?.user_id) {
        setCompanyLoading(true);
        try {
          const { data } = await supabase
            .from("company_profiles")
            .select("*")
            .eq("user_id", job.user_id)
            .maybeSingle();
          setCompanyProfile(data);
        } finally {
          setCompanyLoading(false);
        }
      }
    };

    const fetchAttestation = async () => {
      if (job?.stipend === "unpaid") {
        setAttestationLoading(true);
        try {
          const { data } = await supabase
            .from("legal_attestations")
            .select("*")
            .eq("job_id", job.id)
            .eq("attestation_type", "ESA_STUDENT_EXEMPTION")
            .order("timestamp", { ascending: false })
            .limit(1)
            .maybeSingle();
          setAttestation(data);
        } finally {
          setAttestationLoading(false);
        }
      } else {
        setAttestation(null);
      }
    };

    fetchCompany();
    fetchAttestation();
  }, [job?.user_id, job?.stipend, job?.id]);

  const refreshRecords = async () => {
    if (!id) return;
    const recs = await fetchEmployeeRecordsForOpportunity(id);
    setRecords(recs);
  };

  const createInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !job?.user_id || !newInterview.applicant_id) {
      toast({ title: "Select applicant", description: "Choose an applicant to add to interviewing.", duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      await createEmployeeRecord({
        company_id: job.user_id,
        opportunity_id: id,
        applicant_id: newInterview.applicant_id,
        status: "interviewing",
        round: newInterview.round || null,
        schedule: newInterview.schedule ? new Date(newInterview.schedule).toISOString() : null,
        interviewer: newInterview.interviewer || null,
        notes: newInterview.notes || null,
      });
      await supabase
        .from("applications")
        .update({ status: "interviewing" })
        .eq("opportunity_id", id)
        .eq("applicant_id", newInterview.applicant_id);
      setNewInterview({ applicant_id: "", round: "", schedule: "", interviewer: "", notes: "" });
      await refreshRecords();
      toast({ title: "Saved", description: "Added to interviewing.", duration: 1600 });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not add interviewing", duration: 2200 });
    } finally {
      setSaving(false);
    }
  };

  const updateInterview = async () => {
    if (!editInterview) return;
    setSaving(true);
    try {
      await updateEmployeeRecord(editInterview.id, {
        round: editInterview.round,
        schedule: editInterview.schedule,
        interviewer: editInterview.interviewer,
        notes: editInterview.notes
      });
      await refreshRecords();
      setEditInterviewOpen(false);
      setEditInterview(null);
      toast({ title: "Updated", description: "Interview details updated.", duration: 1800 });
    } catch (err) {
      toast({ title: "Update failed", description: "Could not update interview", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const createHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !job?.user_id || !newHire.applicant_id) {
      toast({ title: "Select applicant", description: "Choose an applicant to mark as hired.", duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      await createEmployeeRecord({
        company_id: job.user_id,
        opportunity_id: id,
        applicant_id: newHire.applicant_id,
        status: "hired",
        role: newHire.role || null,
        start_date: newHire.start_date || null,
        end_date: newHire.end_date || null,
      });
      await supabase
        .from("applications")
        .update({ status: "hired" })
        .eq("opportunity_id", id)
        .eq("applicant_id", newHire.applicant_id);
      setNewHire({ applicant_id: "", role: "", start_date: "", end_date: "" });
      await refreshRecords();
      toast({ title: "Saved", description: "Hire recorded.", duration: 1600 });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not add hire", duration: 2200 });
    } finally {
      setSaving(false);
    }
  };

  const updateHire = async () => {
    if (!editHire) return;
    setSaving(true);
    try {
      await updateEmployeeRecord(editHire.id, {
        role: editHire.role,
        start_date: editHire.start_date,
        end_date: editHire.end_date
      });
      await refreshRecords();
      setEditHireOpen(false);
      setEditHire(null);
      toast({ title: "Updated", description: "Hire details updated.", duration: 1800 });
    } catch (err) {
      toast({ title: "Update failed", description: "Could not update hire", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteEmployeeRecord(recordId);
      await refreshRecords();
      toast({ title: "Removed", duration: 1400 });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Could not delete", duration: 2200 });
    }
  };

  const act = async (type: "approve" | "reject" | "revision" | "close") => {
    if (!job) return;
    if (type === "close" && job.status !== "approved") {
      toast({ title: "Cannot close", description: "Only active jobs can be closed.", duration: 1500 });
      return;
    }
    let note: string | undefined;
    if (type === "revision") {
      note = window.prompt("Add revision comments (required):") || "";
      if (!note.trim()) return;
    }
    if (type === "reject") {
      note = window.prompt("Add reason for rejection (optional):") || undefined;
    }
    if (type === "close") {
      note = window.prompt("Add note for closing (optional):") || undefined;
    }
    const status =
      type === "approve"
        ? "approved"
        : type === "reject"
          ? "rejected"
          : type === "close"
            ? "closed"
            : "revision_required";
    try {
      await updateOpportunityStatus(job.id, status as any, note, "admin");
      toast({ title: "Status updated", description: `Marked as ${status}.`, duration: 1500 });
      navigate("/admin/jobs", { replace: true });
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Unexpected error", duration: 2000 });
    }
  };

  if (!job) {
    return (
      <Layout>
        <Seo title="Not Found" description="Review opportunity" canonical={window.location.href} />
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full inline-flex">
              <AlertCircle className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Opportunity not found</h2>
            <p className="text-slate-500 dark:text-slate-400">The job you are looking for does not exist or has been removed.</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/admin/jobs">Back to Jobs</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  const requirements = job.requirements || {};
  const reqFlags = [
    ["Resume", requirements.require_resume],
    ["LinkedIn", requirements.require_linkedin],
    ["Cover letter", requirements.require_cover_letter],
    ["Portfolio", requirements.require_portfolio],
    ["Availability", requirements.require_availability],
    ["Contact info", requirements.require_contact],
  ];
  const customQs = Array.isArray(requirements.custom_questions) ? requirements.custom_questions : [];
  const isApproved = job.status === "approved";
  const isClosed = job.status === "closed";
  const isPending = job.status === "pending";
  const isRevision = job.status === "revision_required";

  const interviewing = records.filter((r) => r.status === "interviewing");
  const hired = records.filter((r) => r.status === "hired");

  const applicantOptions = apps.map((a) => {
    const snap = a.applicant_snapshot || {};
    const seeker = snap.seeker || {};
    const profile = snap.profile || {};
    const name = profile.display_name || seeker.contact_email || a.applicant_id;
    return { value: a.applicant_id, label: name };
  });

  const statusLabel = job.status === "approved" ? "active" : job.status;

  return (
    <Layout>
      <Seo title={job.title} description="Review opportunity" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative pb-20 transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/5 dark:from-primary/10 to-transparent pointer-events-none" />

        <section className="container py-10 relative z-10 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8">
            <div className="space-y-2">
              <Button variant="ghost" className="pl-0 hover:bg-transparent text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors" asChild>
                <Link to="/admin/jobs">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Jobs
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{job.title}</h1>
                <Badge variant={job.status === "approved" ? "default" : "secondary"} className="capitalize text-sm px-3 py-1">
                  {statusLabel}
                </Badge>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">ID: {job.id}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"><Link to={`/admin/jobs/${job.id}/applicants`}><Users className="mr-2 h-4 w-4" /> View Applicants</Link></Button>
              {(isPending || isRevision) && <Button onClick={() => act("approve")} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">Approve</Button>}
              {(isPending || isRevision || isApproved) && !isClosed && (
                <Button variant="outline" onClick={() => act("revision")} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">Request Revision</Button>
              )}
              {(isPending || isRevision) && <Button variant="destructive" onClick={() => act("reject")} className="shadow-md shadow-red-500/20">Reject</Button>}
              {isApproved && !isClosed && <Button variant="secondary" onClick={() => act("close")} className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white">Close Job</Button>}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Job Overview */}
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <FileText className="h-5 w-5 text-primary" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider">Problem Statement</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{job.problem}</p>
                  </div>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider">Scope of Work</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{job.scope}</p>
                  </div>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Skills Required</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map(s => (
                          <Badge key={s} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Requirements</h3>
                      <div className="flex flex-wrap gap-2">
                        {reqFlags.filter(([, val]) => val).map(([label]) => (
                          <Badge key={label as string} variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {label as string}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hiring Pipeline */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" /> Hiring Pipeline
                </h2>

                {/* Interviewing */}
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-3 px-6">
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Interviewing Candidates
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-primary/10 dark:text-blue-400 dark:hover:bg-blue-900/20" onClick={() => setShowInterviewForm((v) => !v)}>
                      {showInterviewForm ? "Cancel" : "Add Candidate"}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {showInterviewForm && (
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={createInterview}>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Applicant</label>
                            <select
                              className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              value={newInterview.applicant_id}
                              onChange={(e) => setNewInterview((s) => ({ ...s, applicant_id: e.target.value }))}
                            >
                              <option value="">Select Applicant...</option>
                              {applicantOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Round</label>
                            <Input placeholder="e.g. Technical" value={newInterview.round} onChange={(e) => setNewInterview((s) => ({ ...s, round: e.target.value }))} className="bg-white dark:bg-slate-950" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Schedule</label>
                            <Input type="datetime-local" value={newInterview.schedule} onChange={(e) => setNewInterview((s) => ({ ...s, schedule: e.target.value }))} className="bg-white dark:bg-slate-950" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Interviewer</label>
                            <Input placeholder="Interviewer Name" value={newInterview.interviewer} onChange={(e) => setNewInterview((s) => ({ ...s, interviewer: e.target.value }))} className="bg-white dark:bg-slate-950" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Notes</label>
                            <Input placeholder="Notes" value={newInterview.notes} onChange={(e) => setNewInterview((s) => ({ ...s, notes: e.target.value }))} className="bg-white dark:bg-slate-950" />
                          </div>
                          <div className="md:col-span-2 flex justify-end pt-2">
                            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white">Add to Interview</Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {interviewing.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">No candidates currently interviewing.</div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                          <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className="pl-6 font-medium text-slate-500 dark:text-slate-400">Candidate</TableHead>
                            <TableHead className="font-medium text-slate-500 dark:text-slate-400">Round</TableHead>
                            <TableHead className="font-medium text-slate-500 dark:text-slate-400">Schedule</TableHead>
                            <TableHead className="text-right pr-6 font-medium text-slate-500 dark:text-slate-400">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {interviewing.map((r) => {
                            const applicant = applicantOptions.find((opt) => opt.value === r.applicant_id);
                            return (
                              <TableRow key={r.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <TableCell className="pl-6 font-medium text-slate-900 dark:text-white">{applicant?.label || "Unknown"}</TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{r.round || "—"}</TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{r.schedule ? new Date(r.schedule).toLocaleString() : "—"}</TableCell>
                                <TableCell className="text-right pr-6 space-x-2">
                                  <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800 h-8 w-8 p-0" onClick={() => { setEditInterview(r); setEditInterviewOpen(true); }}>
                                    <Pencil className="h-4 w-4 text-slate-500" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0" onClick={() => onDelete(r.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Hired */}
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-3 px-6">
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Hired Employees
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20" onClick={() => setShowHireForm((v) => !v)}>
                      {showHireForm ? "Cancel" : "Record Hire"}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {showHireForm && (
                      <div className="p-6 bg-green-50/30 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/30">
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={createHire}>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Applicant</label>
                            <select
                              className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                              value={newHire.applicant_id}
                              onChange={(e) => setNewHire((s) => ({ ...s, applicant_id: e.target.value }))}
                            >
                              <option value="">Select Applicant...</option>
                              {applicantOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Role Title</label>
                            <Input placeholder="Role Title" value={newHire.role} onChange={(e) => setNewHire((s) => ({ ...s, role: e.target.value }))} className="bg-white dark:bg-slate-950" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Start Date</label>
                            <Input type="date" value={newHire.start_date} onChange={(e) => setNewHire((s) => ({ ...s, start_date: e.target.value }))} className="bg-white dark:bg-slate-950" />
                          </div>

                          <div className="md:col-span-2 flex justify-end pt-2">
                            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">Confirm Hire</Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {hired.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">No hires recorded yet.</div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                          <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className="pl-6 font-medium text-slate-500 dark:text-slate-400">Employee</TableHead>
                            <TableHead className="font-medium text-slate-500 dark:text-slate-400">Role</TableHead>
                            <TableHead className="font-medium text-slate-500 dark:text-slate-400">Start Date</TableHead>
                            <TableHead className="text-right pr-6 font-medium text-slate-500 dark:text-slate-400">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hired.map((r) => {
                            const applicant = applicantOptions.find((opt) => opt.value === r.applicant_id);
                            return (
                              <TableRow key={r.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <TableCell className="pl-6 font-medium text-slate-900 dark:text-white">{applicant?.label || "Unknown"}</TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{r.role || "—"}</TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{r.start_date || "—"}</TableCell>
                                <TableCell className="text-right pr-6 space-x-2">
                                  <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800 h-8 w-8 p-0" onClick={() => { setEditHire(r); setEditHireOpen(true); }}>
                                    <Pencil className="h-4 w-4 text-slate-500" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0" onClick={() => onDelete(r.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* History - Collapsible */}
              <Accordion type="single" collapsible className="w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/50 dark:border-slate-800 rounded-xl shadow-sm">
                <AccordionItem value="history" className="border-none">
                  <AccordionTrigger className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      View Activity History
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4 pt-2">
                      {(job.history || []).map((h: any, idx: number) => (
                        <div key={idx} className="flex gap-4 text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1">
                          <div className="min-w-[140px] text-slate-400 dark:text-slate-500 text-xs pt-0.5 font-mono">
                            {new Date(h.at).toLocaleString()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{h.action}</div>
                            {h.note && <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">{h.note}</div>}
                            {h.by && <div className="text-slate-400 dark:text-slate-500 text-xs italic mt-1">by {h.by}</div>}
                          </div>
                        </div>
                      ))}
                      {(!job.history || job.history.length === 0) && (
                        <div className="text-sm text-slate-500 dark:text-slate-400 italic">No history available.</div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company Info */}
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    Company
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {companyLoading && <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary" /> Loading...</div>}
                  {!companyLoading && companyProfile && (
                    <div className="text-sm space-y-4">
                      <div>
                        <div className="font-bold text-lg text-slate-900 dark:text-white">{companyProfile.name || "Company"}</div>
                        {companyProfile.base_location && (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {companyProfile.base_location}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {companyProfile.website && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Globe className="h-3.5 w-3.5 text-slate-400" />
                            <a className="text-primary dark:text-blue-400 hover:underline truncate" href={companyProfile.website} target="_blank" rel="noreferrer">
                              Website
                            </a>
                          </div>
                        )}
                        {companyProfile.contact_email && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">{companyProfile.contact_email}</span>
                          </div>
                        )}
                      </div>

                      <Separator className="bg-slate-100 dark:bg-slate-800" />

                      <div className="grid grid-cols-2 gap-4">
                        {companyProfile.industry && (
                          <div>
                            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Industry</div>
                            <div className="text-slate-700 dark:text-slate-300">{companyProfile.industry}</div>
                          </div>
                        )}
                        {companyProfile.size_range && (
                          <div>
                            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Size</div>
                            <div className="text-slate-700 dark:text-slate-300">{companyProfile.size_range}</div>
                          </div>
                        )}
                      </div>

                      {companyProfile.about && (
                        <div>
                          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">About</div>
                          <div className="text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4 text-xs">{companyProfile.about}</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                      <Briefcase className="h-4 w-4 text-primary dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Modality</div>
                      <div className="text-slate-500 dark:text-slate-400 capitalize">{job.modality}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Duration</div>
                      <div className="text-slate-500 dark:text-slate-400">{job.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Hours</div>
                      <div className="text-slate-500 dark:text-slate-400">{job.hours} / week</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
                    <div className="flex items-start gap-3 text-sm mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">ESA Attestation</div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {attestationLoading ? "Checking..." : attestation ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Verified {attestation.timestamp ? new Date(attestation.timestamp).toLocaleDateString() : ""}
                              </span>
                              <span className="text-xs text-slate-400">v{attestation.version} (IP: {attestation.ip_address || "N/A"})</span>
                            </div>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Missing Attestation</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {customQs.length > 0 && (
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Custom Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {customQs.map((q: any, idx: number) => (
                      <div key={idx} className="text-sm space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="font-medium text-slate-900 dark:text-white">{q.prompt}</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">{q.type}</Badge>
                          {q.options?.map((opt: string, i: number) => (
                            <span key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{opt}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Edit Interview Dialog */}
        <Dialog open={editInterviewOpen} onOpenChange={setEditInterviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Interview Details</DialogTitle>
              <DialogDescription>Update schedule, round info, or notes.</DialogDescription>
            </DialogHeader>
            {editInterview && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Round</label>
                  <Input value={editInterview.round || ""} onChange={(e) => setEditInterview({ ...editInterview, round: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Schedule</label>
                  <Input type="datetime-local" value={editInterview.schedule ? new Date(editInterview.schedule).toISOString().slice(0, 16) : ""} onChange={(e) => setEditInterview({ ...editInterview, schedule: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Interviewer</label>
                  <Input value={editInterview.interviewer || ""} onChange={(e) => setEditInterview({ ...editInterview, interviewer: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea value={editInterview.notes || ""} onChange={(e) => setEditInterview({ ...editInterview, notes: e.target.value })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditInterviewOpen(false)}>Cancel</Button>
              <Button onClick={updateInterview} disabled={saving}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Hire Dialog */}
        <Dialog open={editHireOpen} onOpenChange={setEditHireOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Hire Details</DialogTitle>
              <DialogDescription>Update role, dates, or feedback.</DialogDescription>
            </DialogHeader>
            {editHire && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input value={editHire.role || ""} onChange={(e) => setEditHire({ ...editHire, role: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input type="date" value={editHire.start_date || ""} onChange={(e) => setEditHire({ ...editHire, start_date: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input type="date" value={editHire.end_date || ""} onChange={(e) => setEditHire({ ...editHire, end_date: e.target.value })} />
                  </div>
                </div>

              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditHireOpen(false)}>Cancel</Button>
              <Button onClick={updateHire} disabled={saving}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
