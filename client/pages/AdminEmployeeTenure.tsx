import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchEmployeeRecordById, updateEmployeeRecord, createEmployeeRecord, deleteEmployeeRecordAndRevertApplication, type EmployeeRecord } from "@/lib/employeeRecords";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Briefcase, Calendar, FileText, Flag, Save, ShieldAlert, Building2, User, Trash2 } from "lucide-react";

export default function AdminEmployeeTenure() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [loading, setLoading] = React.useState(!isNew);
    const [record, setRecord] = React.useState<EmployeeRecord | null>(null);

    // Creation State
    const [companies, setCompanies] = React.useState<{ id: string, name: string }[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = React.useState("");
    const [opportunities, setOpportunities] = React.useState<{ id: string, title: string }[]>([]);
    const [selectedOpportunityId, setSelectedOpportunityId] = React.useState("");
    const [applicantSearch, setApplicantSearch] = React.useState("");
    const [applicants, setApplicants] = React.useState<{ id: string, display_name: string }[]>([]);
    const [selectedApplicantId, setSelectedApplicantId] = React.useState("");

    // Form Fields
    const [role, setRole] = React.useState("");
    const [startDate, setStartDate] = React.useState("");
    const [endDate, setEndDate] = React.useState("");
    const [notes, setNotes] = React.useState("");
    const [certificateUrl, setCertificateUrl] = React.useState("");
    const [flagged, setFlagged] = React.useState(false);
    const [flagReason, setFlagReason] = React.useState("");

    // Read-only labels for Edit mode
    const [companyName, setCompanyName] = React.useState("");
    const [applicantName, setApplicantName] = React.useState("");

    // Load initial data for Edit mode
    React.useEffect(() => {
        if (isNew) {
            // Load companies for dropdown
            supabase.from("company_profiles").select("user_id, name").then(({ data }) => {
                if (data) setCompanies(data.map(d => ({ id: d.user_id, name: d.name || "Unknown Company" })));
            });
            return;
        }

        if (!id) return;
        fetchEmployeeRecordById(id)
            .then(async (rec) => {
                setRecord(rec);
                if (rec) {
                    setRole(rec.role || "");
                    setStartDate(rec.start_date || "");
                    setEndDate(rec.end_date || "");
                    setNotes(rec.tenure_notes || "");
                    setCertificateUrl(rec.certificate_url || "");
                    setFlagged(!!rec.flagged);
                    setFlagReason(rec.flag_reason || "");

                    // Fetch names
                    const { data: comp } = await supabase.from("company_profiles").select("name").eq("user_id", rec.company_id).maybeSingle();
                    const { data: app } = await supabase.from("profiles").select("display_name").eq("user_id", rec.applicant_id).maybeSingle();
                    setCompanyName(comp?.name || "Unknown Company");
                    setApplicantName(app?.display_name || "Unknown Applicant");
                }
            })
            .finally(() => setLoading(false));
    }, [id, isNew]);

    // Load opportunities when company selected (Creation)
    React.useEffect(() => {
        if (!isNew || !selectedCompanyId) {
            setOpportunities([]);
            return;
        }
        supabase.from("opportunities")
            .select("id, title")
            .eq("user_id", selectedCompanyId)
            .then(({ data }) => {
                if (data) setOpportunities(data);
            });
    }, [selectedCompanyId, isNew]);

    // Search applicants (Creation)
    React.useEffect(() => {
        if (!isNew || applicantSearch.length < 2) {
            if (applicantSearch.length === 0) setApplicants([]);
            return;
        }
        const timer = setTimeout(() => {
            supabase.from("profiles")
                .select("user_id, display_name")
                .ilike("display_name", `%${applicantSearch}%`)
                .limit(10)
                .then(({ data }) => {
                    if (data) setApplicants(data.map(d => ({ id: d.user_id, display_name: d.display_name })));
                });
        }, 300);
        return () => clearTimeout(timer);
    }, [applicantSearch, isNew]);


    const save = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (isNew) {
                if (!selectedCompanyId || !selectedOpportunityId || !selectedApplicantId) {
                    toast({ title: "Missing fields", description: "Please select Company, Job, and Applicant", variant: "destructive" });
                    return;
                }
                await createEmployeeRecord({
                    company_id: selectedCompanyId,
                    opportunity_id: selectedOpportunityId,
                    applicant_id: selectedApplicantId,
                    status: "hired",
                    role: role || null,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    tenure_notes: notes || null,
                    certificate_url: certificateUrl || null,
                    flagged,
                    flag_reason: flagReason || null,
                });
            } else if (id) {
                await updateEmployeeRecord(id, {
                    role: role || null,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    tenure_notes: notes || null,
                    certificate_url: certificateUrl || null,
                    flagged,
                    flag_reason: flagReason || null,
                });
            }

            toast({ title: "Saved", description: "Employment record updated successfully.", duration: 1800 });
            navigate(`/admin/hires`);
        } catch (err) {
            toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not update", duration: 2200, variant: "destructive" });
        }
    };

    const deleteRecord = async () => {
        if (!id || isNew) return;
        if (!window.confirm("Are you sure you want to remove this seeker? This will also reset their application status.")) return;

        try {
            await deleteEmployeeRecordAndRevertApplication(id);
            toast({ title: "Deleted", description: "Seeker removed and application status reverted.", duration: 2000 });
            navigate("/admin/hires");
        } catch (err) {
            toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Could not delete", duration: 2200, variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    if (!isNew && !record) {
        return (
            <Layout>
                <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center p-4">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Record Not Found</h1>
                    <Button asChild variant="outline"><Link to="/admin/hires">Back to Hires</Link></Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Seo title={`${isNew ? 'New' : 'Edit'} Employment Record - NxteVia`} canonical={window.location.href} />
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative pb-20 transition-colors duration-300">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/80 dark:from-blue-900/20 to-transparent pointer-events-none" />
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

                <section className="container py-10 relative z-10 max-w-3xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm">
                            <Link to="/admin/hires"><ArrowLeft className="h-5 w-5" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isNew ? 'New' : 'Edit'} Employment Record</h1>
                            <p className="text-slate-500 dark:text-slate-400">Manage contract details and tenure info.</p>
                        </div>
                    </div>

                    <form onSubmit={save} className="space-y-6">
                        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                            <CardContent className="p-8 grid gap-6">

                                {/* Initial Selection for New Record */}
                                {isNew ? (
                                    <div className="space-y-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                        <h3 className="text-md font-bold text-indigo-900 dark:text-indigo-300 mb-2">1. Select Entities</h3>
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                                                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Company" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Opportunity (Job)</label>
                                                <Select value={selectedOpportunityId} onValueChange={setSelectedOpportunityId} disabled={!selectedCompanyId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Job" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {opportunities.map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Applicant Search</label>
                                                <Input
                                                    placeholder="Type name to search..."
                                                    value={applicantSearch}
                                                    onChange={e => setApplicantSearch(e.target.value)}
                                                />
                                                {applicants.length > 0 && (
                                                    <div className="mt-2 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto border rounded-md p-2 bg-white dark:bg-slate-900">
                                                        {applicants.map(app => (
                                                            <div
                                                                key={app.id}
                                                                className={`p-2 text-sm cursor-pointer rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${selectedApplicantId === app.id ? 'bg-indigo-100 dark:bg-indigo-900/50 font-medium' : ''}`}
                                                                onClick={() => { setSelectedApplicantId(app.id); setApplicantSearch(app.display_name); }}
                                                            >
                                                                {app.display_name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-6 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Company</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{companyName}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <User className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Seeker</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{applicantName}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                                {/* Contract Specs */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                        <Briefcase className="h-4 w-4 text-blue-500" /> Position Details
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

                                {/* Internal Notes */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                        <FileText className="h-4 w-4 text-emerald-500" /> Internal Notes
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin/Internal Notes</label>
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
                                                <p className="text-sm text-slate-500 dark:text-red-300/70">Flag this record for review if there are disputes.</p>
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
                                {!isNew && (
                                    <Button type="button" variant="ghost" onClick={deleteRecord} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Seeker
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button asChild variant="outline" className="border-slate-200 dark:border-slate-700 rounded-xl px-6">
                                    <Link to={`/admin/hires`}>Cancel</Link>
                                </Button>
                                <Button type="submit" className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
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
