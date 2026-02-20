import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchEmployeeRecordById, updateEmployeeRecord, deleteEmployeeRecordAndRevertApplication, type EmployeeRecord } from "@/lib/employeeRecords";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Briefcase, Calendar, FileText, Flag, Save, ShieldAlert, Trash2 } from "lucide-react";

export default function CompanyEmployeeTenure() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = React.useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Form Fields
  const [role, setRole] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  // Feedback removed
  const [notes, setNotes] = React.useState("");
  const [certificateUrl, setCertificateUrl] = React.useState("");
  const [flagged, setFlagged] = React.useState(false);
  const [flagReason, setFlagReason] = React.useState("");

  React.useEffect(() => {
    if (!id) return;
    fetchEmployeeRecordById(id)
      .then((rec) => {
        setRecord(rec);
        if (rec) {
          setRole(rec.role || "");
          setStartDate(rec.start_date || "");
          setEndDate(rec.end_date || "");
          // Feedback removed
          setNotes(rec.tenure_notes || "");
          setCertificateUrl(rec.certificate_url || "");
          setFlagged(!!rec.flagged);
          setFlagReason(rec.flag_reason || "");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await updateEmployeeRecord(id, {
        role: role || null,
        start_date: startDate || null,
        end_date: endDate || null,
        // feedback removed
        tenure_notes: notes || null,
        certificate_url: certificateUrl || null,
        flagged,
        flag_reason: flagReason || null,
      });
      toast({ title: "Saved", description: "Employment record updated successfully.", duration: 1800 });
      navigate(`/company/seekers`);
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not update", duration: 2200, variant: "destructive" });
    };
  };

  const deleteRecord = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to remove this seeker? This will also reset their application status.")) return;

    try {
      await deleteEmployeeRecordAndRevertApplication(id);
      toast({ title: "Deleted", description: "Seeker removed and application status reverted.", duration: 2000 });
      navigate("/company/seekers");
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Could not delete", duration: 2200, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!record) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center p-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Record Not Found</h1>
          <Button asChild variant="outline"><Link to="/company/seekers">Back to Seekers</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title="Edit Employment Record - NxteVia" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative pb-20 transition-colors duration-300">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/5 dark:from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

        <section className="container py-10 relative z-10 max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm">
              <Link to="/company/seekers"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Employment Record</h1>
              <p className="text-slate-500 dark:text-slate-400">Update contract details, feedback, and tenure info.</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-6">
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardContent className="p-8 grid gap-6">

                {/* Contract Specs */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <Briefcase className="h-4 w-4 text-primary" /> Position Details
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role Title</label>
                      <Input
                        placeholder="e.g. Senior Frontend Developer"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Certificate URL (Optional)</label>
                      <Input
                        type="url"
                        placeholder="https://"
                        value={certificateUrl}
                        onChange={(e) => setCertificateUrl(e.target.value)}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Dates */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-indigo-500" /> Tenure Duration
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Feedback Section Removed, keeping Internal Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <FileText className="h-4 w-4 text-emerald-500" /> Internal Notes
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {/* Label and Textarea for Performance Feedback removed */}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Internal Notes</label>
                      <Textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Private internal notes regarding this tenure..."
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Flagging */}
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-white dark:bg-red-900/20 p-2 rounded-lg shadow-sm">
                      <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-red-200">Report Issue</h4>
                        <p className="text-sm text-slate-500 dark:text-red-300/70">Flag this record for admin review if there are disputes.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="flagged"
                            checked={flagged}
                            onChange={(e) => setFlagged(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                          <label htmlFor="flagged" className="text-sm font-medium text-slate-700 dark:text-slate-300">Flag for Review</label>
                        </div>
                        <Input
                          placeholder="Reason for flagging..."
                          value={flagReason}
                          onChange={(e) => setFlagReason(e.target.value)}
                          disabled={!flagged}
                          className="bg-white dark:bg-slate-950 border-red-200 dark:border-red-900/50 flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <div>
                <Button type="button" variant="ghost" onClick={deleteRecord} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Seeker
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button asChild variant="outline" className="border-slate-200 dark:border-slate-700 rounded-xl px-6">
                  <Link to={`/company/seekers`}>Cancel</Link>
                </Button>
                <Button type="submit" className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}
