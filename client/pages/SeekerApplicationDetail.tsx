import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";
import { fetchApplicationById, withdrawApplication, type Application } from "@/lib/applications";
import { supabase } from "@/lib/supabase";
import { getApplicationStatusLabel, toTitleCase } from "@/lib/uiText";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FileText, Link as LinkIcon, Calendar, Clock, CheckCircle,
  XCircle, AlertCircle, ChevronLeft, Download, ExternalLink, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

type OpportunityMeta = { title?: string | null; status?: string | null; problem?: string | null; scope?: string | null };

function formatAnswer(value: any): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "No response";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default function SeekerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = React.useState<Application | null>(null);
  const [opportunity, setOpportunity] = React.useState<OpportunityMeta | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [withdrawing, setWithdrawing] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const app = await fetchApplicationById(id);
        if (!app) {
          setApplication(null);
          return;
        }
        setApplication(app);

        try {
          const { data } = await supabase
            .from("opportunities")
            .select("id,title,status,problem,scope")
            .eq("id", app.opportunity_id)
            .maybeSingle();
          if (data) setOpportunity(data as OpportunityMeta);
        } catch { }
      } catch (err) {
        toast({
          title: "Could not load application",
          description: err instanceof Error ? err.message : "Please try again.",
          duration: 2500,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const confirmWithdraw = () => {
    if (!application) return;
    toast({
      title: "Withdraw application?",
      description: "This will remove your submission. You can apply again anytime.",
      action: (
        <ToastAction altText="Confirm withdraw" onClick={handleWithdraw}>
          Withdraw Application
        </ToastAction>
      ),
    });
  };

  const handleWithdraw = async () => {
    if (!application) return;
    setWithdrawing(true);
    try {
      await withdrawApplication(application.id);
      toast({ title: "Withdrawn", description: "Application removed successfully.", duration: 2000 });
      navigate("/seekers/dashboard");
    } catch (err) {
      toast({ title: "Failed", description: "Could not withdraw application.", duration: 2000 });
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Seo title="Application details - NxteVia" />
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 dark:text-slate-500">Loading details...</div>
        </div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout>
        <Seo title="Not Found - NxteVia" />
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Application not found</h1>
            <Button variant="outline" onClick={() => navigate("/seekers/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const profile = (application.applicant_snapshot as any)?.profile || {};
  const seeker = (application.applicant_snapshot as any)?.seeker || {};

  const attachments = [
    { label: "Resume", url: application.resume_url, icon: FileText },
    { label: "Cover Letter", url: application.cover_letter_url, icon: FileText },
    { label: "Portfolio", url: application.portfolio_url, icon: Briefcase },
    { label: "LinkedIn", url: application.linkedin_url, icon: LinkIcon },
  ].filter(item => !!item.url);

  const answers = Array.isArray(application.answers) ? application.answers : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case 'rejected': return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case 'submitted':
      case 'pending': return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'submitted':
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const canWithdraw = ['pending', 'submitted'].includes(application.status || '');

  return (
    <Layout>
      <Seo title={`Application for ${opportunity?.title || 'Opportunity'}`} canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
        <div className="container max-w-5xl py-8">

          <div className="mb-8">
            <Button variant="ghost" className="pl-0 hover:bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => navigate("/seekers/dashboard")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Button>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mt-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  {opportunity?.title || "Opportunity Application"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Submitted on {new Date(application.created_at).toLocaleDateString()} at {new Date(application.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium", getStatusColor(application.status))}>
                {getStatusIcon(application.status)}
                <span>{toTitleCase(getApplicationStatusLabel(application.status))}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_340px] gap-8 items-start">

            {/* Main Content */}
            <div className="space-y-6">

              {/* Attachments */}
              {attachments.length > 0 && (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-500" />
                      Submitted Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {attachments.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <item.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <span className="font-medium text-sm text-slate-900 dark:text-white">{item.label}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary dark:hover:text-white" asChild>
                            <a href={item.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Questions */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-slate-500" />
                    Application Responses
                  </CardTitle>
                  <CardDescription>
                    Your answers to the screening questions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {answers.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No custom questions were answered.</p>
                  ) : (
                    answers.map((ans: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <label className="text-sm font-medium text-slate-900 dark:text-white block">
                            {ans.prompt || `Question ${idx + 1}`}
                          </label>
                          {ans.type && <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{ans.type}</Badge>}
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {formatAnswer(ans.answer)}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Snapshot Info */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-lg font-semibold">Profile Snapshot</CardTitle>
                  <CardDescription>Contact info shared with the application.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-6 text-sm">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 mb-1">Full Name</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{profile.display_name || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 mb-1">Email</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{seeker.contact_email || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 mb-1">Phone</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{seeker.telephone || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 mb-1">Location</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{profile.country || "N/A"}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500 dark:text-slate-400 mb-1">Availability</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{application.availability || "N/A"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Opportunity Card */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">About Opportunity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-4">
                    {opportunity?.problem || opportunity?.scope || "No description available."}
                  </p>
                  <Button className="w-full" asChild>
                    <Link to={`/opportunities/${application.opportunity_id}`}>View Opportunity</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Withdraw Card */}
              {canWithdraw && (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Manage Application</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      No longer interested? You can withdraw your application. This action can be undone by reapplying.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900"
                      onClick={confirmWithdraw}
                      disabled={withdrawing}
                    >
                      {withdrawing ? "Withdrawing..." : "Withdraw Application"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
