import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, Calendar, Clock, Briefcase, Search, MoreHorizontal, UserCheck, TrendingUp, HelpCircle } from "lucide-react";
import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { findOrCreateConversation } from "@/lib/messaging";
import { supabase } from "@/lib/supabase";
import { fetchEmployeeRecordsForCompany, type EmployeeRecord } from "@/lib/employeeRecords";
import { cn } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return "-";
  // Append T00:00:00 to ensure local time interpretation, or use UTC methods.
  // Since the DB returns YYYY-MM-DD, new Date(value) is UTC midnight.
  // We want to display that exact date, so we format it as UTC.
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString(undefined, { timeZone: "UTC" });
}

function EmployeeOverview({
  employees,
  loading,
  getEmployeeLabel,
}: {
  employees: EmployeeRecord[];
  loading: boolean;
  getEmployeeLabel: (id: string) => string;
}) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 text-center">
        <div className="bg-white p-3 rounded-full w-fit mx-auto shadow-sm mb-4">
          <Users className="h-6 w-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-indigo-900">No seekers yet</h3>
        <p className="text-indigo-700/80 mt-1 max-w-md mx-auto">
          Once you select talent through NxteVia, they will appear here automatically.
        </p>
      </div>
    );
  }

  const totalEmployees = employees.length;
  const rolesCovered = new Set(employees.map((e) => e.role || "Unspecified")).size;
  const endingSoon = employees
    .filter((e) => e.end_date)
    .slice()
    .sort((a, b) => new Date(a.end_date || "").getTime() - new Date(b.end_date || "").getTime())
    .slice(0, 3);
  const recentHires = employees
    .slice()
    .sort((a, b) => new Date(b.start_date || "").getTime() - new Date(a.start_date || "").getTime())
    .slice(0, 2);

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Total Employees Card */}
      <div className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 flex flex-col justify-between">
        <div>
          <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Total Team</p>
          <p className="text-4xl font-bold mt-2">{totalEmployees}</p>
          <p className="text-indigo-100/80 text-sm mt-1">Active seekers</p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-medium bg-white/10 w-fit px-2 py-1 rounded-lg">
          <TrendingUp className="h-3 w-3" /> Growing team
        </div>
      </div>

      {/* Stats Cards */}
      <div className="md:col-span-3 grid sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-slate-500">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Roles Covered</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-auto">{rolesCovered}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Distinct positions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-slate-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Ending Soon</span>
          </div>
          {endingSoon.length === 0 ? (
            <p className="text-sm text-slate-400 mt-auto">No upcoming end dates</p>
          ) : (
            <div className="space-y-2 mt-auto">
              {endingSoon.map((emp) => (
                <div key={emp.id} className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{getEmployeeLabel(emp.applicant_id)}</span>
                  <span className="text-slate-500 dark:text-slate-500">{formatDate(emp.end_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-slate-500">
            <UserCheck className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Recent Selections</span>
          </div>
          {recentHires.length === 0 ? (
            <p className="text-sm text-slate-400 mt-auto">No recent activity</p>
          ) : (
            <div className="space-y-2 mt-auto">
              {recentHires.map((emp) => (
                <div key={emp.id} className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{getEmployeeLabel(emp.applicant_id)}</span>
                  <span className="text-slate-500 dark:text-slate-500">{formatDate(emp.start_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CompanyEmployees() {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState<string>("Company");
  const [list, setList] = React.useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [labels, setLabels] = React.useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id || null;
        setCompanyId(userId);
        if (userId) {
          const [recs, companyProfile] = await Promise.all([
            fetchEmployeeRecordsForCompany(userId),
            supabase.from("company_profiles").select("name").eq("user_id", userId).maybeSingle(),
          ]);
          setList(recs.filter((r) => r.status === "hired"));
          if (companyProfile.data?.name) setCompanyName(companyProfile.data.name);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!list.length) {
      setLabels({});
      return;
    }
    const uniqueIds = Array.from(new Set(list.map((e) => e.applicant_id).filter(Boolean)));
    if (uniqueIds.length === 0) {
      setLabels({});
      return;
    }

    const fetchProfiles = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", uniqueIds);

        if (!data) return;
        const map: Record<string, string> = {};
        data.forEach((row: any) => {
          if (row?.user_id) map[row.user_id] = row.display_name || row.user_id;
        });
        setLabels(map);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        setLabels({});
      }
    };

    fetchProfiles();
  }, [list]);

  const getEmployeeLabel = (id: string) => labels[id] || id;

  const startConversation = async (employeeId: string) => {
    if (!companyId) return;
    try {
      const conversationId = await findOrCreateConversation(companyId, "company", employeeId, "seeker");
      navigate(`/company/chats/${conversationId}`);
    } catch (err) {
      console.error("Failed to start conversation", err);
    }
  };

  const filteredList = list.filter(emp =>
    getEmployeeLabel(emp.applicant_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.role && emp.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout>
      <Seo title="Seekers - NxteVia" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12">
        <div className="container max-w-6xl space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Seekers</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your team and view contract details.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Link to="/company/faq"><HelpCircle className="mr-2 h-4 w-4" /> Help</Link>
              </Button>
            </div>
          </div>

          <EmployeeOverview employees={list} loading={loading} getEmployeeLabel={getEmployeeLabel} />

          {/* Main Content Card */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-2 rounded-lg"><Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Selected Seekers</CardTitle>
                    <CardDescription className="dark:text-slate-400">View and manage your selected seekers.</CardDescription>
                  </div>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search seekers..."
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
                  <p className="text-slate-900 dark:text-white font-medium">No seekers found</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">You haven't selected anyone yet.</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No employees match your search.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Full Name</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Start Date</th>
                        <th className="px-6 py-4">End Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredList.map((employee) => (
                        <tr key={employee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                {getEmployeeLabel(employee.applicant_id).charAt(0)}
                              </div>
                              <span className="font-medium text-slate-900 dark:text-slate-200">{getEmployeeLabel(employee.applicant_id)}</span>
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
                                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                                onClick={() => startConversation(employee.applicant_id)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1.5" />
                                Message
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                                onClick={() => navigate(`/company/employees/${employee.id}/tenure`)}
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
