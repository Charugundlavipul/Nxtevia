import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useParams, Link } from "react-router-dom";
import * as React from "react";
import { fetchMyOpportunities, updateOpportunity, type Opportunity } from "@/lib/opportunities";
import { toast } from "@/components/ui/use-toast";
import { fetchApplicationsForOpportunity, type Application } from "@/lib/applications";
import {
  fetchEmployeeRecordsForOpportunity,
  createEmployeeRecord,
  updateEmployeeRecord,
  deleteEmployeeRecord,
  type EmployeeRecord,
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
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";

type CustomQuestion = { prompt: string; type: string; options?: string[] };

export default function CompanyJobReview() {
  const { id } = useParams();
  const [job, setJob] = React.useState<Opportunity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [apps, setApps] = React.useState<Application[]>([]);
  const [records, setRecords] = React.useState<EmployeeRecord[]>([]);
  const [attestation, setAttestation] = React.useState<any>(null);
  const [profileMap, setProfileMap] = React.useState<Record<string, string>>({});
  const [ownerId, setOwnerId] = React.useState<string | null>(null);
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

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [appsRes, ownerRes, recs] = await Promise.all([
          fetchApplicationsForOpportunity(id),
          supabase.from("opportunities").select("user_id").eq("id", id).maybeSingle(),
          fetchEmployeeRecordsForOpportunity(id),
        ]);
        setApps(appsRes);
        if (ownerRes.data?.user_id) setOwnerId(ownerRes.data.user_id as string);
        setRecords(recs);

        // Fetch profiles for any records that might not be in apps (e.g. manually added by admin)
        const applicantIds = Array.from(new Set(recs.map(r => r.applicant_id).filter(Boolean)));
        if (applicantIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", applicantIds);

          const map: Record<string, string> = {};
          profiles?.forEach((p: any) => {
            if (p.user_id) map[p.user_id] = p.display_name || "Unknown";
          });
          setProfileMap(map);
        }
      } catch {
        setApps([]);
        setRecords([]);
      }
    })();
  }, [id]);

  const refreshRecords = async () => {
    if (!id) return;
    const recs = await fetchEmployeeRecordsForOpportunity(id);
    setRecords(recs);
  };

  const applicantOptions = React.useMemo(
    () => {
      const options = apps.map((a) => {
        const snap = a.applicant_snapshot || {};
        const seeker = snap.seeker || {};
        const profile = snap.profile || {};
        const name = profile.display_name || seeker.contact_email || a.applicant_id;
        return { value: a.applicant_id, label: name };
      });

      // Merge in any from profileMap that aren't in apps
      Object.entries(profileMap).forEach(([uid, name]) => {
        if (!options.find(o => o.value === uid)) {
          options.push({ value: uid, label: name });
        }
      });

      return options;
    },
    [apps, profileMap],
  );

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

  const interviewing = records.filter((r) => r.status === "interviewing");
  const hired = records.filter((r) => r.status === "hired");

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

  const createInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ownerId || !newInterview.applicant_id) {
      toast({ title: "Select applicant", description: "Choose an applicant to add to interviewing.", duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      await createEmployeeRecord({
        company_id: ownerId,
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
    if (!id || !ownerId || !newHire.applicant_id) {
      toast({ title: "Select applicant", description: "Choose an applicant to mark as hired.", duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      await createEmployeeRecord({
        company_id: ownerId,
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
    try {
      await deleteEmployeeRecord(recordId);
      await refreshRecords();
      toast({ title: "Removed", duration: 1400 });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Could not delete", duration: 2200 });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Seo title="Loading..." description="Opportunity details" canonical={window.location.href} />
        <div className="min-h-screen bg-slate-50/50 py-12">
          <div className="container max-w-6xl space-y-6">
            <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg" />
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-6">
                <div className="h-64 bg-white rounded-xl shadow-sm animate-pulse" />
              </div>
              <div className="h-64 bg-white rounded-xl shadow-sm animate-pulse" />
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
        <div className="min-h-screen bg-slate-50/50 grid place-items-center">
          <div className="flex flex-col items-center justify-center space-y-4 text-center p-8">
            <div className="bg-slate-100 p-4 rounded-full">
              <AlertCircle className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Opportunity not found</h2>
            <p className="text-slate-500">The job you are looking for does not exist or has been removed.</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/company/dashboard">Back to Dashboard</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title={job.title} description="Opportunity details" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 py-12">
        <div className="container max-w-6xl space-y-8">

          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link to="/company/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Dashboard
                </Link>
                <span>/</span>
                <span className="text-slate-900 font-medium">Job Details</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
                <Badge variant={job.status === "approved" ? "default" : "secondary"} className={cn("capitalize", job.status === "approved" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                  {statusLabel}
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 border shadow-sm">
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
                <Button variant="outline" onClick={reopenJob} className="bg-white border-slate-200 hover:bg-slate-50">
                  <History className="mr-2 h-4 w-4" /> Reopen Job
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Job Overview */}
              <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <div className="bg-primary/10 p-2 rounded-lg"><FileText className="h-5 w-5 text-primary" /></div>
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Problem Statement</h3>
                    <p className="text-slate-600 leading-relaxed">{job.problem}</p>
                  </div>
                  <Separator className="bg-slate-100" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Scope of Work</h3>
                    <p className="text-slate-600 leading-relaxed">{job.scope}</p>
                  </div>
                  <Separator className="bg-slate-100" />
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Skills Required</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map(s => (
                          <span key={s} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Requirements</h3>
                      <div className="flex flex-wrap gap-2">
                        {reqFlags.filter(([, val]) => val).map(([label]) => (
                          <span key={label as string} className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                            {label as string}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hiring Pipeline */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hiring Pipeline</h2>

                {/* Interviewing */}
                <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <div className="bg-amber-50 p-1.5 rounded-md"><Users className="h-4 w-4 text-amber-600" /></div>
                        Interviewing
                      </CardTitle>
                      <Button size="sm" variant={showInterviewForm ? "ghost" : "outline"} onClick={() => setShowInterviewForm((v) => !v)} className={showInterviewForm ? "text-slate-500" : "bg-white border-slate-200"}>
                        {showInterviewForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                        {showInterviewForm ? "Cancel" : "Add Candidate"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {showInterviewForm && (
                      <div className="p-6 bg-amber-50/30 border-b border-amber-100">
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={createInterview}>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Applicant</label>
                            <select
                              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                              value={newInterview.applicant_id}
                              onChange={(e) => setNewInterview((s) => ({ ...s, applicant_id: e.target.value }))}
                            >
                              <option value="">Select Applicant...</option>
                              {applicantOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Round</label>
                            <Input placeholder="e.g. Technical" value={newInterview.round} onChange={(e) => setNewInterview((s) => ({ ...s, round: e.target.value }))} className="bg-white border-slate-200" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Schedule</label>
                            <Input type="datetime-local" value={newInterview.schedule} onChange={(e) => setNewInterview((s) => ({ ...s, schedule: e.target.value }))} className="bg-white border-slate-200" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Interviewer</label>
                            <Input placeholder="Interviewer Name" value={newInterview.interviewer} onChange={(e) => setNewInterview((s) => ({ ...s, interviewer: e.target.value }))} className="bg-white border-slate-200" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Notes</label>
                            <Input placeholder="Notes" value={newInterview.notes} onChange={(e) => setNewInterview((s) => ({ ...s, notes: e.target.value }))} className="bg-white border-slate-200" />
                          </div>
                          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                            <Button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">Add to Interview</Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {interviewing.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">No candidates currently interviewing.</div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="font-semibold text-slate-500">Candidate</TableHead>
                            <TableHead className="font-semibold text-slate-500">Round</TableHead>
                            <TableHead className="font-semibold text-slate-500">Schedule</TableHead>
                            <TableHead className="text-right font-semibold text-slate-500">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {interviewing.map((r) => {
                            const applicant = applicantOptions.find((opt) => opt.value === r.applicant_id);
                            return (
                              <TableRow key={r.id} className="border-slate-100 hover:bg-slate-50/50">
                                <TableCell className="font-medium text-slate-900">{applicant?.label || "Unknown"}</TableCell>
                                <TableCell className="text-slate-600">{r.round || "—"}</TableCell>
                                <TableCell className="text-slate-600">{r.schedule ? new Date(r.schedule).toLocaleString() : "—"}</TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button size="sm" variant="ghost" className="hover:bg-slate-100 h-8 w-8 p-0" onClick={() => { setEditInterview(r); setEditInterviewOpen(true); }}>
                                    <Pencil className="h-4 w-4 text-slate-500" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0" onClick={() => onDelete(r.id)}>
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
                <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <div className="bg-emerald-50 p-1.5 rounded-md"><CheckCircle className="h-4 w-4 text-emerald-600" /></div>
                        Hired Employees
                      </CardTitle>
                      <Button size="sm" variant={showHireForm ? "ghost" : "outline"} onClick={() => setShowHireForm((v) => !v)} className={showHireForm ? "text-slate-500" : "bg-white border-slate-200"}>
                        {showHireForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                        {showHireForm ? "Cancel" : "Record Hire"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {showHireForm && (
                      <div className="p-6 bg-emerald-50/30 border-b border-emerald-100">
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={createHire}>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Applicant</label>
                            <select
                              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              value={newHire.applicant_id}
                              onChange={(e) => setNewHire((s) => ({ ...s, applicant_id: e.target.value }))}
                            >
                              <option value="">Select Applicant...</option>
                              {applicantOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Role Title</label>
                            <Input placeholder="Role Title" value={newHire.role} onChange={(e) => setNewHire((s) => ({ ...s, role: e.target.value }))} className="bg-white border-slate-200" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Start Date</label>
                            <Input type="date" value={newHire.start_date} onChange={(e) => setNewHire((s) => ({ ...s, start_date: e.target.value }))} className="bg-white border-slate-200" />
                          </div>

                          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirm Hire</Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {hired.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">No hires recorded yet.</div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="font-semibold text-slate-500">Employee</TableHead>
                            <TableHead className="font-semibold text-slate-500">Role</TableHead>
                            <TableHead className="font-semibold text-slate-500">Start Date</TableHead>
                            <TableHead className="text-right font-semibold text-slate-500">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hired.map((r) => {
                            const applicant = applicantOptions.find((opt) => opt.value === r.applicant_id);
                            return (
                              <TableRow key={r.id} className="border-slate-100 hover:bg-slate-50/50">
                                <TableCell className="font-medium text-slate-900">{applicant?.label || "Unknown"}</TableCell>
                                <TableCell className="text-slate-600">{r.role || "—"}</TableCell>
                                <TableCell className="text-slate-600">{r.start_date || "—"}</TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button size="sm" variant="ghost" className="hover:bg-slate-100 h-8 w-8 p-0" onClick={() => { setEditHire(r); setEditHireOpen(true); }}>
                                    <Pencil className="h-4 w-4 text-slate-500" />
                                  </Button>
                                  <Button size="sm" variant="outline" asChild className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"><Link to={`/company/employees/${r.id}/tenure`}>Manage</Link></Button>
                                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0" onClick={() => onDelete(r.id)}>
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
              <Accordion type="single" collapsible className="w-full bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
                <AccordionItem value="history" className="border-none">
                  <AccordionTrigger className="px-6 py-4 text-sm font-medium text-slate-600 hover:text-slate-900 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      View Activity History
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-0">
                    <div className="space-y-4 pt-2">
                      {(job.history || []).map((h: any, idx: number) => (
                        <div key={idx} className="flex gap-4 text-sm">
                          <div className="min-w-[140px] text-slate-400 text-xs pt-0.5 font-mono">
                            {new Date(h.at).toLocaleString()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700">{h.action}</div>
                            {h.note && <div className="text-slate-500 text-xs mt-0.5">{h.note}</div>}
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
              <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-bold text-slate-900">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Modality</div>
                      <div className="text-slate-500 capitalize">{job.modality}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Duration</div>
                      <div className="text-slate-500">{job.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Hours</div>
                      <div className="text-slate-500">{job.hours} / week</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Compensation</div>
                      <div className="text-slate-500 capitalize">
                        {job.stipend === "paid" && job.pay_amount
                          ? `${job.currency} ${job.pay_amount} / ${job.pay_type}`
                          : (job.stipend === "none" ? "Unpaid" : job.stipend)}
                      </div>
                    </div>
                  </div>
                  {job.stipend === "unpaid" && (
                    <div className="flex items-center gap-3 text-sm pt-2 mt-2 border-t border-slate-100">
                      <div className="bg-indigo-50 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">ESA Compliance</div>
                        <div className="text-slate-500">
                          {attestation ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-medium">
                              <CheckCircle className="h-3 w-3" /> Verified (v{attestation.version})
                            </span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1">
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
                <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-slate-500" />
                      Custom Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {customQs.map((q, idx) => (
                      <div key={idx} className="text-sm space-y-1.5">
                        <div className="font-medium text-slate-900">{q.prompt}</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-500 border-slate-200">{q.type}</Badge>
                          {q.options?.map((opt, i) => (
                            <span key={i} className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{opt}</span>
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
