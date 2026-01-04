import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, Link } from "react-router-dom";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  Building2,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Phone,
  Briefcase,
  Users,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Ban,
  CheckCircle,
  MessageSquare,
  ExternalLink,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Globe2,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

type CompanyProfileRow = {
  user_id: string;
  name?: string | null;
  contact_email?: string | null;
  base_location?: string | null;
  website?: string | null;
  about?: string | null;
  status?: string | null;
  telephone?: string | null;
  industry?: string | null;
  size_range?: string | null;
  created_at?: string | null;
  reasons_for_joining?: string[] | null;
  project_types?: string[] | null;
  project_types_other?: string | null;
  hiring_goal?: string | null;
  email_verified?: boolean;
  linkedin_verified?: boolean;
};

export default function AdminCompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = React.useState<{
    id: string;
    name: string;
    email: string;
    country: string;
    website?: string;
    about?: string;
    status: "active" | "banned";
    telephone?: string | null;
    industry?: string | null;
    size_range?: string | null;
    joinedAt?: string;
    reasonsForJoining?: string[];
    projectTypes?: string[];
    projectTypesOther?: string;
    hiringGoal?: string;
    emailVerified?: boolean;
  } | null>(null);
  const [postings, setPostings] = React.useState<Array<{ id: string; title: string; status: string; created_at: string }>>([]);
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "banned">("active");
  const [statusSupported, setStatusSupported] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const selectCompany = (withStatus: boolean) =>
          supabase
            .from("company_profiles")
            .select(
              withStatus
                ? "*, status"
                : "*"
            )
            .eq("user_id", id)
            .maybeSingle();

        let includeStatus = true;
        let companyResp = await selectCompany(true);
        if (companyResp.error?.code === "42703") {
          includeStatus = false;
          companyResp = await selectCompany(false);
        }
        if (companyResp.error) throw companyResp.error;
        if (!companyResp.data) {
          if (active) {
            setCompany(null);
            setPostings([]);
            setError("Company not found");
          }
          return;
        }

        const oppResp = await supabase
          .from("opportunities")
          .select("id, title, status, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false });
        if (oppResp.error) throw oppResp.error;

        if (active) {
          setStatusSupported(includeStatus);
          const row = companyResp.data as unknown as CompanyProfileRow;
          const derivedStatus = includeStatus ? ((row.status as "active" | "banned") || "active") : "active";
          setCompany({
            id: row.user_id,
            name: row.name || "Company",
            email: row.contact_email || "",
            country: row.base_location || "—",
            website: row.website || undefined,
            about: row.about || undefined,
            status: derivedStatus,
            telephone: row.telephone,
            industry: row.industry,
            size_range: row.size_range,
            joinedAt: row.created_at || undefined,
            reasonsForJoining: row.reasons_for_joining || [],
            projectTypes: row.project_types || [],
            projectTypesOther: row.project_types_other || undefined,
            hiringGoal: row.hiring_goal || undefined,
            emailVerified: row.email_verified,
          });
          setStatus(derivedStatus);
          setPostings(
            (oppResp.data ?? []).map((opp) => ({
              id: opp.id,
              title: opp.title || "Opportunity",
              status: opp.status,
              created_at: opp.created_at,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load company", err);
        if (active) setError("Unable to load company details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const updateStatus = async (nextStatus: "active" | "banned") => {
    if (!id) return;
    if (!statusSupported) {
      toast({
        title: "Status not supported",
        description: "Run the latest database migration to enable status controls.",
      });
      return;
    }
    try {
      const { error: updateErr } = await supabase
        .from("company_profiles")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("user_id", id);
      if (updateErr) {
        if (updateErr.code === "42703") {
          setStatusSupported(false);
          toast({
            title: "Migration required",
            description: "Add the company status column to enable banning.",
            variant: "destructive",
          });
          return;
        }
        throw updateErr;
      }
      setStatus(nextStatus);
      toast({
        title: `Company ${nextStatus === "banned" ? "banned" : "reinstated"}`,
        description: `Status changed to ${nextStatus}.`,
      });
    } catch (err) {
      console.error("Failed to update status", err);
      toast({
        title: "Failed to update status",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = () => {
    toast({ title: "Notification sent", description: "The company has been notified." });
    setNotifyOpen(false);
    setMessage("");
  };

  const initials = (company?.name ?? "").slice(0, 2).toUpperCase();

  if (!loading && (!company || error)) {
    return (
      <Layout>
        <Seo title="Company not found – Admin" description="Missing company" canonical={typeof window !== "undefined" ? window.location.href : ""} />
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full inline-flex">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{error ?? "Company not found"}</h2>
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/admin/companies">Back to Companies</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading || !company) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
          <section className="container py-12 space-y-6 max-w-7xl mx-auto">
            <div className="h-64 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 h-96 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
              <div className="h-64 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title={`Admin – ${company.name}`} description="Company profile" canonical={typeof window !== "undefined" ? window.location.href : ""} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative pb-20 transition-colors duration-300">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/80 dark:from-blue-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

        <section className="container py-10 relative z-10 max-w-5xl space-y-8">
          {/* Top Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Button variant="ghost" asChild className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-800/50 h-auto py-2 px-3 -ml-2">
              <Link to="/admin/companies" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Companies
              </Link>
            </Button>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <AlertDialog open={notifyOpen} onOpenChange={setNotifyOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-xl">
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send Notification</AlertDialogTitle>
                    <AlertDialogDescription>
                      This message will be sent to <strong>{company.name}</strong> ({company.email}).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-2">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Type your message here..."
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Send Message
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {status === "active" ? (
                <Button
                  variant="destructive"
                  onClick={() => updateStatus("banned")}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl"
                >
                  <Ban className="mr-2 h-4 w-4" /> Ban Company
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => updateStatus("active")}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 rounded-xl"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Reinstate Company
                </Button>
              )}
            </div>
          </div>

          {/* Company Header (Glassmorphic) */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/20">
                    {initials}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-3">
                      {company.name}
                      {status === "banned" && (
                        <Badge variant="destructive" className="text-xs">Banned</Badge>
                      )}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                        Company
                      </Badge>
                      {company.emailVerified && (
                        <Badge variant="outline" className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  {company.country && (
                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      {company.country}
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <Globe2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      Website Available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm border-none bg-transparent shadow-none p-0">
                <CardContent className="p-0 space-y-8">
                  <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-8 space-y-8">
                      {/* About */}
                      <section>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-500" /> About Company
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                          {company.about || "No description provided."}
                        </p>
                      </section>

                      <div className="grid sm:grid-cols-2 gap-6">
                        {company.industry && (
                          <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Industry</div>
                            <div className="font-medium text-slate-900 dark:text-white">{company.industry}</div>
                          </div>
                        )}
                        {company.size_range && (
                          <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Size</div>
                            <div className="font-medium text-slate-900 dark:text-white">{company.size_range}</div>
                          </div>
                        )}
                      </div>

                      {company.projectTypes && company.projectTypes.length > 0 && (
                        <section>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Project Types</h3>
                          <div className="flex flex-wrap gap-2">
                            {company.projectTypes.map((p) => (
                              <Badge key={p} variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-100 dark:border-blue-800">
                                {p}
                              </Badge>
                            ))}
                            {company.projectTypesOther && (
                              <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-100 dark:border-blue-800">
                                {company.projectTypesOther}
                              </Badge>
                            )}
                          </div>
                        </section>
                      )}

                      {company.hiringGoal && (
                        <section className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                          <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">Hiring Goal</h3>
                          <p className="text-sm text-indigo-700 dark:text-indigo-400">{company.hiringGoal}</p>
                        </section>
                      )}
                    </CardContent>
                  </Card>

                  {/* Job Postings */}
                  <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-8">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-slate-500" /> Job Postings
                      </h2>
                      {postings.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                          <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                          <p>No job postings found.</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {postings.map((p) => (
                            <div
                              key={p.id}
                              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md hover:bg-white dark:hover:bg-slate-800"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-300">
                                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div className="space-y-1">
                                  <div className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {p.title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className={cn(
                                      "capitalize text-xs font-medium border px-2 py-0.5 h-auto",
                                      p.status === 'open'
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                    )}>
                                      {p.status === 'open' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                                      {p.status.replace("_", " ")}
                                    </Badge>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                      <span className="w-0.5 h-0.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Button asChild size="sm" variant="ghost" className="shrink-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 group-hover:translate-x-1 transition-all">
                                <Link to={`/admin/jobs/${p.id}`} className="flex items-center gap-1">
                                  Review <ArrowRight className="w-4 h-4" />
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white">Contact & Info</h3>
                  <div className="space-y-3">
                    {company.email && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                        <span className="truncate" title={company.email}>{company.email}</span>
                      </div>
                    )}
                    {company.telephone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                        <span>{company.telephone}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Globe2 className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                        <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[200px]">
                          {company.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                      <span>Joined {company.joinedAt ? new Date(company.joinedAt).getFullYear() : "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {company.reasonsForJoining && company.reasonsForJoining.length > 0 && (
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">Why Join Us?</h3>
                    <ul className="space-y-2">
                      {company.reasonsForJoining.map((r) => (
                        <li key={r} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {status === "banned" && (
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 border-l-4 shadow-none">
                  <CardContent className="p-4 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-200">Company Banned</h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        This company is banned and cannot take actions.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
