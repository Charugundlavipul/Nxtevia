import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, Calendar, Clock, Briefcase, Search, HelpCircle, Plus, Building2 } from "lucide-react";
import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { findOrCreateConversation } from "@/lib/messaging";
import { supabase } from "@/lib/supabase";
import { fetchAllEmployeeRecords, type EmployeeRecord } from "@/lib/employeeRecords";

function formatDate(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString(undefined, { timeZone: "UTC" });
}

export default function AdminEmployees() {
    const navigate = useNavigate();
    const [list, setList] = React.useState<EmployeeRecord[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [labels, setLabels] = React.useState<Record<string, string>>({});
    const [companyLabels, setCompanyLabels] = React.useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
        (async () => {
            try {
                const recs = await fetchAllEmployeeRecords();
                setList(recs.filter((r) => r.status === "hired"));
            } catch (err) {
                console.error("Failed to fetch employees", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    React.useEffect(() => {
        if (!list.length) return;

        const applicantIds = Array.from(new Set(list.map((e) => e.applicant_id).filter(Boolean)));
        const companyIds = Array.from(new Set(list.map((e) => e.company_id).filter(Boolean)));

        const fetchProfiles = async () => {
            try {
                const { data: applicantData } = await supabase
                    .from("profiles")
                    .select("user_id, display_name")
                    .in("user_id", applicantIds);

                const { data: companyData } = await supabase
                    .from("company_profiles")
                    .select("user_id, name")
                    .in("user_id", companyIds);

                const appMap: Record<string, string> = {};
                applicantData?.forEach((row: any) => {
                    if (row?.user_id) appMap[row.user_id] = row.display_name || row.user_id;
                });
                setLabels(appMap);

                const compMap: Record<string, string> = {};
                companyData?.forEach((row: any) => {
                    // Fallback to profile display name if company name is missing?
                    // Actually company_profiles usually has name.
                    if (row?.user_id) compMap[row.user_id] = row.name || "Unknown Company";
                });
                // Also fetch base profiles for companies just in case
                const { data: baseCompanyData } = await supabase
                    .from("profiles")
                    .select("user_id, display_name")
                    .in("user_id", companyIds);
                baseCompanyData?.forEach((row: any) => {
                    if (!compMap[row.user_id]) compMap[row.user_id] = row.display_name || "Company";
                });

                setCompanyLabels(compMap);

            } catch (error) {
                console.error("Error fetching labels:", error);
            }
        };

        fetchProfiles();
    }, [list]);

    const getEmployeeLabel = (id: string) => labels[id] || id;
    const getCompanyLabel = (id: string) => companyLabels[id] || id;

    const filteredList = list.filter(emp =>
        getEmployeeLabel(emp.applicant_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.role && emp.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
        getCompanyLabel(emp.company_id).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout>
            <Seo title="Admin Employees - NxteVia" canonical={window.location.href} />
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12">
                <div className="container max-w-6xl space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">All Employees</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage employees across all companies.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20">
                                <Link to="/admin/employees/new">
                                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg"><Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Employee Records</CardTitle>
                                        <CardDescription className="dark:text-slate-400">View and manage hired employees.</CardDescription>
                                    </div>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search employees or companies..."
                                        className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all dark:text-white"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : list.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3">
                                        <Users className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-900 dark:text-white font-medium">No employees found</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">No hired records exist in the system.</p>
                                </div>
                            ) : filteredList.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    No employees match your search.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="px-6 py-4">Full Name</th>
                                                <th className="px-6 py-4">Company</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Start Date</th>
                                                <th className="px-6 py-4">End Date</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredList.map((employee) => (
                                                <tr key={employee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                                                {getEmployeeLabel(employee.applicant_id).charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-slate-900 dark:text-white">{getEmployeeLabel(employee.applicant_id)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                            <Building2 className="h-3 w-3 text-slate-400" />
                                                            {getCompanyLabel(employee.company_id)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{employee.role || "-"}</td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500">{formatDate(employee.start_date)}</td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500">{formatDate(employee.end_date)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                                                                onClick={() => navigate(`/admin/employees/${employee.id}`)}
                                                            >
                                                                Manage
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
