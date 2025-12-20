import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import * as React from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { CompanyStatus } from "@/lib/adminCompanies";
import { Building2, Search, ExternalLink, ArrowRight, MoreHorizontal, Ban, CheckCircle, Mail, MapPin, Globe, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminCompanyPreview = {
  id: string;
  name: string;
  email: string;
  country: string;
  website?: string;
  status: CompanyStatus;
  joinedAt: string;
};

export default function AdminCompanies() {
  const [companies, setCompanies] = React.useState<AdminCompanyPreview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusSupported, setStatusSupported] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const loadCompanies = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectQuery = (withStatus: boolean) =>
        supabase
          .from("company_profiles")
          .select(
            withStatus
              ? "user_id, name, contact_email, base_location, website, created_at, status"
              : "user_id, name, contact_email, base_location, website, created_at",
          )
          .order("created_at", { ascending: false });

      let includeStatus = true;
      let response = await selectQuery(true);
      if (response.error?.code === "42703") {
        includeStatus = false;
        response = await selectQuery(false);
      }
      if (response.error) throw response.error;
      setStatusSupported(includeStatus);
      const hydrated = (response.data ?? []).map((row: any) => ({
        id: row.user_id,
        name: row.name || "Company",
        email: row.contact_email || "",
        country: row.base_location || "—",
        website: row.website || undefined,
        status: includeStatus ? ((row.status as CompanyStatus) || "active") : "active",
        joinedAt: row.created_at || new Date().toISOString(),
      }));
      setCompanies(hydrated);
    } catch (err) {
      console.error("Failed to load companies", err);
      setError("Unable to load companies right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const updateStatus = async (id: string, nextStatus: "active" | "banned") => {
    if (!statusSupported) {
      toast({ title: "Status not supported", description: "Database migration required." });
      return;
    }
    try {
      const { error: updateErr } = await supabase
        .from("company_profiles")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("user_id", id);

      if (updateErr) throw updateErr;

      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
      toast({
        title: `Company ${nextStatus === "banned" ? "banned" : "reinstated"}`,
        description: `Status updated successfully.`,
      });
    } catch (err) {
      console.error("Failed to update status", err);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Seo title="Admin – Companies" description="Manage companies" canonical={typeof window !== "undefined" ? window.location.href : ""} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />

        <section className="container py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                Companies
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage and review company profiles registered on the platform.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Companies</CardTitle>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{companies.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered organizations</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Company Directory</CardTitle>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    placeholder="Search companies..."
                    className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:ring-blue-500/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {error ? (
                <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 m-4 rounded-xl border border-red-100 dark:border-red-900/20">
                  <div className="flex justify-center mb-2"><Building2 className="h-6 w-6" /></div>
                  {error}
                </div>
              ) : loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-full mb-4">
                    <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">No companies found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                        <TableHead className="pl-6 font-medium text-slate-500 dark:text-slate-400">Company</TableHead>
                        <TableHead className="font-medium text-slate-500 dark:text-slate-400">Location</TableHead>
                        <TableHead className="font-medium text-slate-500 dark:text-slate-400">Website</TableHead>
                        <TableHead className="font-medium text-slate-500 dark:text-slate-400">Status</TableHead>
                        <TableHead className="font-medium text-slate-500 dark:text-slate-400">Joined</TableHead>
                        <TableHead className="text-right pr-6 font-medium text-slate-500 dark:text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((company) => (
                        <TableRow key={company.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="pl-6 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                <AvatarFallback className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                                  {company.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-white">{company.name}</span>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <Mail className="h-3 w-3" />
                                  {company.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              {company.country}
                            </div>
                          </TableCell>
                          <TableCell>
                            {company.website ? (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Globe className="h-3.5 w-3.5" />
                                Visit
                              </a>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={company.status === "active" ? "default" : "destructive"} className={cn("capitalize", company.status === 'active' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50" : "")}>
                              {company.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                            {new Date(company.joinedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <DropdownMenuLabel className="text-slate-900 dark:text-white">Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild className="text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                  <Link to={`/admin/companies/${company.id}`}>View Details</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                {company.status === "active" ? (
                                  <DropdownMenuItem onClick={() => updateStatus(company.id, "banned")} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer">
                                    <Ban className="mr-2 h-4 w-4" /> Ban Company
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => updateStatus(company.id, "active")} className="text-green-600 focus:bg-green-50 dark:focus:bg-green-900/20 cursor-pointer">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Reinstate Company
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
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
