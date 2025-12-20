import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchApplicationsForOpportunity,
  type Application,
} from "@/lib/applications";
import {
  fetchEmployeeRecordsForOpportunity,
  createEmployeeRecord,
  updateEmployeeRecord,
  deleteEmployeeRecord,
  type EmployeeRecord,
} from "@/lib/employeeRecords";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useParams, Link } from "react-router-dom";
import * as React from "react";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Trash2,
  Clock,
  Pencil,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminJobApplicants() {
  const { id } = useParams();
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

  const createHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ownerId || !newHire.applicant_id) {
      toast({ title: "Missing info", description: "Select an applicant to add.", duration: 2000 });
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
      toast({ title: "Saved", description: "Hire recorded.", duration: 1800 });
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
      await deleteEmployeeRecord(recordId);
      await refreshRecords();
      toast({ title: "Removed", duration: 1500 });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Could not delete", duration: 2200 });
    }
  };

  const interviewing = records.filter((r) => r.status === "interviewing");
  const hired = records.filter((r) => r.status === "hired");

  return (
    <Layout>
      <Seo title="Admin Applicants" description="Review applicants and hiring pipeline" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
        <section className="container py-10 space-y-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Link to="/admin/jobs" className="hover:text-blue-600 transition-colors">Jobs</Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-medium">Applicants</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hiring Management</h1>
              <p className="text-slate-500 dark:text-slate-400">Admin view of applicants and pipeline.</p>
            </div>
            <Button asChild variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Link to={`/admin/jobs/${id}`}>Back to Job Details</Link>
            </Button>
          </div>

          {/* Applicants List */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg"><Users className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Applicants</h2>
              </div>

              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : apps.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                  No applicants found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Submitted</th>
                        <th className="px-6 py-4">Documents</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
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
                          <tr key={a.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{name}</td>
                            <td className="px-6 py-4 text-slate-500">{contact}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 space-x-2">
                              {a.resume_url ? <a className="text-blue-600 hover:underline" href={a.resume_url} target="_blank" rel="noreferrer">Resume</a> : <span className="text-slate-400">-</span>}
                              {a.cover_letter_url ? <a className="text-blue-600 hover:underline" href={a.cover_letter_url} target="_blank" rel="noreferrer">Cover</a> : null}
                            </td>
                            <td className="px-6 py-4"><Badge variant="outline" className="capitalize">{a.status}</Badge></td>
                            <td className="px-6 py-4 text-right">
                              <Button size="sm" variant="outline" asChild className="rounded-lg h-8">
                                <Link to={`/admin/applications/${a.id}`}>Review</Link>
                              </Button>
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
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hired Employees</h2>
                  <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{hired.length}</Badge>
                </div>
              </div>

              {hired.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4">Applicant</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Start</th>
                        <th className="px-6 py-4">End</th>

                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/50">
                      {hired.map((r) => {
                        const applicant = applicantOptions.find((opt) => opt.value === r.applicant_id);
                        const appForRecord = apps.find((a) => a.applicant_id === r.applicant_id);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{applicant?.label || r.applicant_id}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.role || "—"}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.start_date || "—"}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.end_date || "—"}</td>

                            <td className="px-6 py-4 text-right space-x-2">
                              {appForRecord && (
                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                  <Link to={`/admin/applications/${appForRecord.id}`}>View App</Link>
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setEditHire(r); setEditHireOpen(true); }}>
                                <Pencil className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(r.id)}>
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
              {/* Admin Add Hire Form */}
              <div id="admin-hire-form" className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Admin: Record Hire</h3>
                <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={createHire}>
                  <select className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" value={newHire.applicant_id} onChange={(e) => setNewHire((s) => ({ ...s, applicant_id: e.target.value }))}>
                    <option value="">Select Candidate...</option>
                    {applicantOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <Input placeholder="Role Title" value={newHire.role} onChange={(e) => setNewHire((s) => ({ ...s, role: e.target.value }))} className="bg-white dark:bg-slate-950" />
                  <Input type="date" value={newHire.start_date} onChange={(e) => setNewHire((s) => ({ ...s, start_date: e.target.value }))} className="bg-white dark:bg-slate-950" />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Record Hire</Button>
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
                              <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setEditInterview(r); setEditInterviewOpen(true); }}>
                                <Pencil className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(r.id)}>
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
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Admin: Schedule Interview</h3>
                <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-5" onSubmit={createInterview}>
                  <select className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" value={newInterview.applicant_id} onChange={(e) => setNewInterview((s) => ({ ...s, applicant_id: e.target.value }))}>
                    <option value="">Select Candidate...</option>
                    {applicantOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
