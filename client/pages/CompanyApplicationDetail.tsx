import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { fetchApplicationById, type Application } from "@/lib/applications";
import { supabase } from "@/lib/supabase";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  Globe,
  FileText,
  MessageSquare,
  Clock,
  Briefcase,
  ExternalLink,
  MapPin
} from "lucide-react";
import { findOrCreateConversation } from "@/lib/messaging";

type OpportunityMeta = { title?: string | null };

function formatAnswer(value: any): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "No response";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default function CompanyApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = React.useState<Application | null>(null);
  const [opportunity, setOpportunity] = React.useState<OpportunityMeta | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Imports check:
  // import { toast } from "@/components/ui/use-toast"; -> This exports 'toast' function directly usually, or hook. 
  // Checking previous file content: line 6: import { toast } from "@/components/ui/use-toast";
  // So 'toast' is the function.

  const handleMessage = async () => {
    if (!application) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // We can pass opportunity info to contextually link the conversation
      const conversationId = await findOrCreateConversation(
        user.id,
        "company",
        application.applicant_id,
        "seeker",
        application.opportunity_id,
        opportunity?.title || undefined
      );
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
          const { data } = await supabase.from("opportunities").select("id,title").eq("id", app.opportunity_id).maybeSingle();
          if (data) setOpportunity(data as OpportunityMeta);
        } catch {
          // ignore fetch errors
        }
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

  if (loading) {
    return (
      <Layout>
        <Seo title="Application - Company" canonical={window.location.href} />
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <div className="text-slate-500 font-medium">Loading application...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout>
        <Seo title="Application not found" canonical={window.location.href} />
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-slate-100 p-4 rounded-full inline-flex">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold">Application Not Found</h2>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const snap = application.applicant_snapshot || {};
  const profile = snap.profile || {};
  const seeker = snap.seeker || {};
  const attachments = [
    ["Resume", application.resume_url],
    ["Cover letter", application.cover_letter_url],
    ["Portfolio", application.portfolio_url],
    ["LinkedIn", application.linkedin_url],
  ].filter(([, url]) => !!url) as Array<[string, string]>;
  const answers = Array.isArray(application.answers) ? application.answers : [];

  return (
    <Layout>
      <Seo title="Application - Company" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 py-12">
        <div className="container max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <Link to={`/company/jobs/${application.opportunity_id}/applicants`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary dark:hover:text-white transition-colors mb-2">
                <ArrowLeft className="h-3 w-3" /> Back to Applicants
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{profile.display_name || "Applicant"}</h1>
                <Badge variant={
                  application.status === 'hired' ? 'default' :
                    application.status === 'interviewing' ? 'secondary' : 'outline'
                } className="uppercase text-xs tracking-wider px-2 py-0.5 border-slate-200">
                  {application.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  Applying for <span className="font-semibold text-slate-700">{opportunity?.title || "Opportunity"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Submitted {new Date(application.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleMessage} className="gap-2">
                <MessageSquare className="h-4 w-4" /> Message Applicant
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {/* Applicant Profile Card */}
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <div className="bg-primary/10 p-1.5 rounded-md"><User className="h-5 w-5 text-primary" /></div>
                    Applicant Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {seeker.about && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">About</h3>
                      <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">{seeker.about}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Info</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {seeker.contact_email || application.contact || "N/A"}
                        </div>
                        {seeker.telephone && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {seeker.telephone}
                          </div>
                        )}
                        {profile.country && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {profile.country}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Details</h3>
                      <div className="space-y-2 text-sm">
                        {application.availability && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            Available: {application.availability}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {Array.isArray(seeker.skills) && seeker.skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {seeker.skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Questionnaire Answers */}
              <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <div className="bg-indigo-50 p-1.5 rounded-md"><MessageSquare className="h-5 w-5 text-indigo-500" /></div>
                    Application Responses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {answers.length === 0 ? (
                    <div className="text-sm text-slate-500 italic">No custom questions were answered.</div>
                  ) : (
                    <div className="space-y-6">
                      {answers.map((ans: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="font-medium text-slate-900 text-sm">{ans.prompt || `Question ${idx + 1}`}</div>
                            {ans.type && <Badge variant="outline" className="text-[10px] uppercase text-slate-500 border-slate-200">{ans.type}</Badge>}
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                            {formatAnswer(ans.answer)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar: Documents & Actions */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm h-fit">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <div className="bg-emerald-50 p-1.5 rounded-md"><FileText className="h-4 w-4 text-emerald-500" /></div>
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {attachments.length === 0 ? (
                    <div className="text-sm text-slate-500 italic">No attachments provided.</div>
                  ) : (
                    attachments.map(([label, url]) => (
                      <Button asChild key={label} variant="outline" className="w-full justify-start bg-white hover:bg-slate-50 border-slate-200 h-auto py-3 shadow-none">
                        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                          <div className="bg-primary/5 p-2 rounded text-primary">
                            {label === 'LinkedIn' ? <Globe className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-slate-900 text-sm">{label}</div>
                            <div className="text-xs text-slate-500">Click to view</div>
                          </div>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      </Button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
