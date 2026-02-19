import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToastAction } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fetchApplicationsForOpportunity,
  type Application,
} from "@/lib/applications";
import {
  fetchEmployeeRecordsForOpportunity,
  createEmployeeRecord,
  updateEmployeeRecord,
  deleteEmployeeRecordAndRevertApplication,
  transitionToHired,
  type EmployeeRecord,
} from "@/lib/employeeRecords";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  findOrCreateConversation,
} from "@/lib/messaging";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as React from "react";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Trash2,
  FileText,
  Clock,
  Pencil,
  ArrowRight,
  UserCheck,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HireDisclaimerModal } from "@/components/modals/HireDisclaimerModal";

export default function CompanyJobApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleMessage = async (applicantId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const conversationId = await findOrCreateConversation(user.id, "company", applicantId, "seeker");
      navigate(`/company/chats/${conversationId}`);
    } catch (error) {
      console.error("Failed to start conversation", error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive",
      });
    }
  };
  const [apps, setApps] = React.useState<Application[]>([]);
  const [records, setRecords] = React.useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ownerId, setOwnerId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // New forms
  const [newInterview, setNewInterview] = React.useState({ applicant_id: "", round: "", schedule: "", interviewer: "", notes: "" });
  const [newHire, setNewHire] = React.useState({ applicant_id: "", role: "", start_date: "", end_date: "" });

  // Edit forms
  const [editInterviewOpen, setEditInterviewOpen] = React.useState(false);
  const [editInterview, setEditInterview] = React.useState<EmployeeRecord | null>(null);

  const [editHireOpen, setEditHireOpen] = React.useState(false);
  const [editHire, setEditHire] = React.useState<EmployeeRecord | null>(null);

  const [disclaimerOpen, setDisclaimerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [appRes, oppRes] = await Promise.all([
          fetchApplicationsForOpportunity(id),
          supabase.from("opportunities").select("id,user_id").eq("id", id).maybeSingle(),
        ]);
        setApps(appRes);
        if (oppRes.data?.user_id) setOwnerId(oppRes.data.user_id as string);
        const recs = await fetchEmployeeRecordsForOpportunity(id);
        setRecords(recs);
      } catch {
        setApps([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const refreshRecords = async () => {
    if (!id) return;
    const recs = await fetchEmployeeRecordsForOpportunity(id);
    setRecords(recs);
  };

  const applicantOptions = React.useMemo(
    () =>
      apps.map((a) => {
        const snap = a.applicant_snapshot || {};
        const seeker = snap.seeker || {};
        const profile = snap.profile || {};
        const name = profile.display_name || seeker.contact_email || a.applicant_id;
        return { value: a.applicant_id, label: name };
      }),
    [apps],
  );

  const interviewApplicantOptions = React.useMemo(
    () =>
      applicantOptions.filter((opt) => {
        // Exclude if find usage in records (interviewing or hired)
        const hasRecord = records.some((r) => r.applicant_id === opt.value);
        return !hasRecord;
      }),
    [applicantOptions, records]
  );

  const hireApplicantOptions = React.useMemo(
    () =>
      applicantOptions.filter((opt) => {
        // Exclude only if already hired
        const isHired = records.some((r) => r.applicant_id === opt.value && r.status === 'hired');
        return !isHired;
      }),
    [applicantOptions, records]
  );

  const createInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ownerId || !newInterview.applicant_id) {
      toast({ title: "Missing info", description: "Select an applicant to add.", duration: 2000 });
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
      toast({ title: "Saved", description: "Interviewing candidate added.", duration: 1800 });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not add", duration: 2200 });
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

  const preValidateHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ownerId || !newHire.applicant_id) {
      toast({ title: "Missing info", description: "Select an applicant to add.", duration: 2000 });
      return;
    }
    setDisclaimerOpen(true);
  };

  const handleHireConfirmed = async (notes: string) => {
    setDisclaimerOpen(false);
    setSaving(true);
    try {
      if (!ownerId || !id) return; // Should be checked by preValidate but safe guard
      await transitionToHired(ownerId, id, newHire.applicant_id, {
        role: newHire.role,
        start_date: newHire.start_date,
        end_date: newHire.end_date,
        notes: notes
      });
      setNewHire({ applicant_id: "", role: "", start_date: "", end_date: "" });
      await refreshRecords();
      toast({ title: "Saved", description: "Hire recorded and pipeline updated.", duration: 1800 });
      // Refresh apps to show updated status
      const updatedApps = await fetchApplicationsForOpportunity(id);
      setApps(updatedApps);
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not add", duration: 2200 });
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
      await deleteEmployeeRecordAndRevertApplication(recordId);
      await refreshRecords();
      if (id) {
        const updatedApps = await fetchApplicationsForOpportunity(id);
        setApps(updatedApps);
      }
      toast({ title: "Removed", duration: 1500 });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Could not delete", duration: 2200 });
    }
  };

  const rejectApplicant = async (applicationId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", applicationId);

      if (error) throw error;

      setApps((prev) => prev.map(a => a.id === applicationId ? { ...a, status: "rejected" } : a));
      toast({ title: "Applicant rejected", duration: 2000 });
    } catch (err) {
      toast({ title: "Action failed", description: "Could not reject applicant", variant: "destructive", duration: 2000 });
    } finally {
      setSaving(false);
    }
  };

  const confirmReject = (applicationId: string, name: string) => {
    toast({
      title: `Reject ${name}?`,
      description: "This will mark the application as rejected. The candidate will see this status.",
      action: (
        <ToastAction altText="Confirm rejection" onClick={() => rejectApplicant(applicationId)}>
          Reject
        </ToastAction>
      ),
    });
  };

  const interviewing = records.filter((r) => r.status === "interviewing");
  const hired = records.filter((r) => r.status === "hired");

  return (
    <Layout>
      <Seo title="Hiring Pipeline - NxteVia" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
        <section className="container py-10 space-y-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Link to="/company/dashboard" className="hover:text-primary dark:hover:text-white transition-colors">Dashboard</Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-medium">Hiring Pipeline</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Candidates & Hires</h1>
              <p className="text-slate-500 dark:text-slate-400">Manage your applicants, interviews, and active team.</p>
            </div>
            <Button asChild variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Link to={`/company/jobs/${id}`}>Back to Job Details</Link>
            </Button>
          </div>

          {/* Applicants List */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg"><Users className="h-5 w-5 text-primary dark:text-primary" /></div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Applicants</h2>
              </div>

              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : apps.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                  No new applicants yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4">Candidate</th>
                        <th className="px-6 py-4">Submitted</th>
                        <th className="px-6 py-4">Documents</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/50">
                      {apps.map((a) => {
                        const snap = a.applicant_snapshot || {};
                        const seeker = snap.seeker || {};
                        const profile = snap.profile || {};
                        const name = profile.display_name || seeker.contact_email || "Applicant";
                        const contact = seeker.contact_email || a.contact;
                        return (
                          <tr key={a.id} className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900 dark:text-white">{name}</div>
                              <div className="text-xs text-slate-500">{contact}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(a.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 space-x-2">
                              {a.resume_url ? <a className="text-primary dark:text-blue-400 hover:underline" href={a.resume_url} target="_blank" rel="noreferrer">Resume</a> : <span className="text-slate-400">-</span>}
                              {a.cover_letter_url ? <a className="text-primary dark:text-blue-400 hover:underline" href={a.cover_letter_url} target="_blank" rel="noreferrer">Cover</a> : null}
                            </td>
                            <td className="px-6 py-4"><Badge variant="outline" className="capitalize">{a.status}</Badge></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" asChild className="rounded-lg h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700">
                                  <Link to={`/company/applications/${a.id}`}>Review</Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-primary dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                  onClick={() => handleMessage(a.applicant_id)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1.5" />
                                  Message
                                </Button>
                                {(a.status === 'submitted' || a.status === 'pending' || a.status === 'interviewing') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    onClick={() => confirmReject(a.id, name)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1.5" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hired Employees */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg"><UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Hires</h2>
                  <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{hired.length}</Badge>
                </div>
              </div>

              {hired.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Start Date</th>

                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/50">
                      {hired.map((r) => {
                        const applicant = applicantOptions.find((opt) => opt.value === r.applicant_id);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{applicant?.label || r.applicant_id}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.role || "—"}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.start_date || "—"}</td>

                            <td className="px-6 py-4 text-right space-x-2">
                              <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setEditHire(r); setEditHireOpen(true); }}>
                                <Pencil className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Button size="sm" variant="outline" className="bg-white dark:bg-slate-800 text-primary dark:text-white border-primary/20 dark:border-slate-600 hover:bg-primary/5 dark:hover:bg-slate-700" asChild>
                                <Link to={`/company/employees/${r.id}/tenure`}>Manage</Link>
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onDelete(r.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Hire Form */}
              <div id="hire-form" className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Select Applicant</h3>
                <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={preValidateHire}>
                  <select className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" value={newHire.applicant_id} onChange={(e) => setNewHire((s) => ({ ...s, applicant_id: e.target.value }))}>
                    <option value="">Select Candidate...</option>
                    {hireApplicantOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <Input placeholder="Role Title" value={newHire.role} onChange={(e) => setNewHire((s) => ({ ...s, role: e.target.value }))} className="bg-white dark:bg-slate-950" />
                  <Input type="date" value={newHire.start_date} onChange={(e) => setNewHire((s) => ({ ...s, start_date: e.target.value }))} className="bg-white dark:bg-slate-950" />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Select</Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Interviewing Pipeline */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg"><Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Interviews</h2>
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{interviewing.length}</Badge>
                </div>
              </div>

              {interviewing.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4">Candidate</th>
                        <th className="px-6 py-4">Round</th>
                        <th className="px-6 py-4">Schedule</th>
                        <th className="px-6 py-4">Interviewer</th>
                        <th className="px-6 py-4">Notes</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/50">
                      {interviewing.map((r) => {
                        const applicant = applicantOptions.find((opt) => opt.value === r.applicant_id);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{applicant?.label || r.applicant_id}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.round || "—"}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.schedule ? new Date(r.schedule).toLocaleString() : "—"}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.interviewer || "—"}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{r.notes || "—"}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-900/20"
                                onClick={() => {
                                  setNewHire(prev => ({ ...prev, applicant_id: r.applicant_id }));
                                  document.getElementById('hire-form')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                title="Select this candidate"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Select
                              </Button>
                              <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setEditInterview(r); setEditInterviewOpen(true); }}>
                                <Pencil className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleMessage(r.applicant_id)} title="Message Candidate">
                                <MessageSquare className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onDelete(r.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Interview Form */}
              <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Schedule Interview</h3>
                <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-5" onSubmit={createInterview}>
                  <select className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" value={newInterview.applicant_id} onChange={(e) => setNewInterview((s) => ({ ...s, applicant_id: e.target.value }))}>
                    <option value="">Select Candidate...</option>
                    {interviewApplicantOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <Input placeholder="Round (e.g. Technical)" value={newInterview.round} onChange={(e) => setNewInterview((s) => ({ ...s, round: e.target.value }))} className="bg-white dark:bg-slate-950" />
                  <Input type="datetime-local" value={newInterview.schedule} onChange={(e) => setNewInterview((s) => ({ ...s, schedule: e.target.value }))} className="bg-white dark:bg-slate-950" />
                  <Input placeholder="Interviewer Name" value={newInterview.interviewer} onChange={(e) => setNewInterview((s) => ({ ...s, interviewer: e.target.value }))} className="bg-white dark:bg-slate-950" />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving} className="flex-1">Add Interview</Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

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

          <HireDisclaimerModal
            open={disclaimerOpen}
            onOpenChange={setDisclaimerOpen}
            onConfirm={handleHireConfirmed}
          />
        </section>
      </div>
    </Layout>
  );
}
