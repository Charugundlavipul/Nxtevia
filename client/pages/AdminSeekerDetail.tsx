import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import * as React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  ExternalLink,
  Ban,
  CheckCircle,
  CheckCircle2,
  User,
  Phone,
  Calendar,
  ShieldAlert,
  Clock,
  Download,
  Star,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

type SeekerProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  country: string;
  about: string;
  skills: string[];
  portfolio: any;
  experiences: any;
  joinedAt: string;
  contact_email?: string;
  telephone?: string;
  linkedin_verified?: boolean;
  email_verified?: boolean;
  status: "active" | "banned";
  resume_url?: string;
};

export default function AdminSeekerDetail() {
  const { seeker_id } = useParams();
  const navigate = useNavigate();
  const [seeker, setSeeker] = React.useState<SeekerProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const [applications, setApplications] = React.useState<any[]>([]);
  const [statusSupported, setStatusSupported] = React.useState(true);

  React.useEffect(() => {
    if (!seeker_id) return;

    async function load() {
      setLoading(true);
      try {
        // Fetch basic profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, display_name, country, created_at, role")
          .eq("user_id", seeker_id)
          .single();

        if (profileError) throw profileError;

        // Fetch seeker details with status check
        const selectSeeker = (withStatus: boolean) =>
          supabase
            .from("seeker_profiles")
            .select(withStatus ? "*, status" : "*")
            .eq("user_id", seeker_id)
            .maybeSingle();

        let includeStatus = true;
        let seekerResp = await selectSeeker(true);

        if (seekerResp.error?.code === "42703") {
          includeStatus = false;
          seekerResp = await selectSeeker(false);
        }

        if (seekerResp.error && seekerResp.error.code !== "PGRST116") throw seekerResp.error;
        setStatusSupported(includeStatus);

        const seekerDetails = seekerResp.data as any;

        // Fetch applications
        const { data: apps, error: appsError } = await supabase
          .from("applications")
          .select("*, opportunity:opportunities(title)")
          .eq("applicant_id", seeker_id)
          .order("created_at", { ascending: false });

        if (appsError) console.error("Error fetching applications:", appsError);

        setSeeker({
          id: profile.user_id,
          name: profile.display_name,
          email: seekerDetails?.contact_email || "",
          role: seekerDetails?.career_stage || profile.role,
          country: seekerDetails?.country || profile.country || "—",
          about: seekerDetails?.about || "",
          skills: seekerDetails?.skills || [],
          portfolio: seekerDetails?.portfolio || {},
          experiences: seekerDetails?.experiences || [],
          joinedAt: profile.created_at,
          contact_email: seekerDetails?.contact_email,
          telephone: seekerDetails?.telephone,
          linkedin_verified: seekerDetails?.linkedin_verified,
          email_verified: seekerDetails?.email_verified,
          status: includeStatus ? ((seekerDetails?.status as "active" | "banned") || "active") : "active",
          resume_url: seekerDetails?.resume_url,
        });
        setApplications(apps || []);

      } catch (err) {
        console.error("Failed to load seeker", err);
        toast({ title: "Error", description: "Failed to load seeker details", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [seeker_id]);

  const updateStatus = async (nextStatus: "active" | "banned") => {
    if (!seeker) return;
    try {
      const { error: updateErr } = await supabase
        .from("seeker_profiles")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("user_id", seeker.id);

      if (updateErr) {
        if (updateErr.code === "42703") {
          toast({
            title: "Migration required",
            description: "Add the status column to seeker_profiles to enable banning.",
            variant: "destructive",
          });
          return;
        }
        throw updateErr;
      }

      setSeeker({ ...seeker, status: nextStatus });
      toast({
        title: `User ${nextStatus === "banned" ? "banned" : "reinstated"}`,
        description: `Status updated successfully.`,
      });
    } catch (err) {
      console.error("Failed to update status", err);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleSendMessage = () => {
    toast({ title: "Notification Sent", description: `Message sent to ${seeker?.name}` });
    setNotifyOpen(false);
    setMessage("");
  };

  const initials = (seeker?.name ?? "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
          <section className="container py-12 space-y-6 max-w-5xl mx-auto">
            <div className="h-64 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 h-64 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
              <div className="h-64 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  if (!seeker) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full inline-flex">
              <User className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Seeker Not Found</h2>
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/admin/seekers">Back to Seekers</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title={`Admin – ${seeker.name}`} description="Seeker profile" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative pb-20 transition-colors duration-300">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/80 dark:from-blue-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

        <section className="container py-10 relative z-10 max-w-5xl space-y-8">
          {/* Top Actions Bar */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-800/50 -ml-2">
              <Link to="/admin/seekers" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Seekers
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              <AlertDialog open={notifyOpen} onOpenChange={setNotifyOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-xl">
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send notification</AlertDialogTitle>
                    <AlertDialogDescription>Message will be emailed/in-app to {seeker.name}.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="mt-2">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full min-h-[100px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      placeholder="Type your message..."
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">Send</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {seeker.status === "active" ? (
                <Button
                  variant="destructive"
                  onClick={() => updateStatus("banned")}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl"
                >
                  <Ban className="mr-2 h-4 w-4" /> Ban User
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => updateStatus("active")}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 rounded-xl"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Reinstate User
                </Button>
              )}
            </div>
          </div>

          {/* Profile Header (Glassmorphic) */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20">
                    {initials}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-3">
                      {seeker.name}
                      {seeker.status === "banned" && (
                        <Badge variant="destructive" className="text-xs">Banned</Badge>
                      )}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                        {seeker.role}
                      </Badge>
                      {seeker.email_verified && (
                        <Badge variant="outline" className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  {seeker.country && (
                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      {seeker.country}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    Joined {new Date(seeker.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm border-none bg-transparent shadow-none p-0">
                <CardContent className="p-0 space-y-8">
                  <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-8 space-y-8">
                      {/* About */}
                      <section>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-500" /> About Me
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {seeker.about || "No bio provided."}
                        </p>
                      </section>

                      <div className="h-px bg-slate-100 dark:bg-slate-800" />

                      {/* Skills */}
                      <section>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Star className="h-5 w-5 text-amber-500" /> Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {seeker.skills.length > 0 ? (
                            seeker.skills.map((s) => (
                              <Badge key={s} variant="secondary" className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700">
                                {s}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-500 italic">No skills listed.</span>
                          )}
                        </div>
                      </section>

                      <div className="h-px bg-slate-100 dark:bg-slate-800" />

                      {/* Experience */}
                      <section>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-indigo-500" /> Experience & Education
                        </h2>
                        <div className="space-y-6 relative border-l-2 border-slate-100 dark:border-slate-800 ml-2.5 pb-2">
                          {seeker.experiences && Array.isArray(seeker.experiences) && seeker.experiences.length > 0 ? (
                            seeker.experiences.map((exp: any, i: number) => (
                              <div key={i} className="ml-8 relative">
                                <span className={cn(
                                  "absolute -left-[39px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 box-content",
                                  exp.type === 'education' ? "bg-emerald-400" : "bg-blue-500"
                                )} />
                                <h4 className="font-semibold text-slate-900 dark:text-white text-base">{exp.title || exp.degree}</h4>
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{exp.company || exp.school}</div>
                                <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-mono">{exp.duration || exp.year}</div>
                                {exp.description && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {exp.description}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-400 dark:text-slate-500 italic ml-6">No experience or education listed.</div>
                          )}
                        </div>
                      </section>
                    </CardContent>
                  </Card>

                  {/* Applications History - styled like 'Completed Opportunities' */}
                  <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-8">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" /> Application History
                      </h2>
                      {applications.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {applications.map((app) => (
                            <div key={app.id} className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                              <div className="font-semibold text-slate-900 dark:text-white mb-1">{app.opportunity?.title || "Unknown Opportunity"}</div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs border-slate-200 dark:border-slate-700 capitalize",
                                    app.status === 'hired' ? "bg-green-50 text-green-700 dark:text-green-400 dark:bg-green-900/20" :
                                      "text-slate-600 dark:text-slate-300"
                                  )}
                                >
                                  {app.status}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(app.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                          No applications found for this seeker.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white">Contact & Info</h3>
                  <div className="space-y-3">
                    {seeker.email && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                        <span className="truncate" title={seeker.email}>{seeker.email}</span>
                      </div>
                    )}
                    {seeker.telephone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                        <span>{seeker.telephone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                      <span>Joined {new Date(seeker.joinedAt).getFullYear()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {seeker.portfolio && Object.keys(seeker.portfolio).length > 0 && (
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white">Portfolio</h3>
                    <div className="space-y-2">
                      {Object.entries(seeker.portfolio).map(([key, value]: [string, any]) => (
                        value ? (
                          <a
                            key={key}
                            href={value}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 capitalize">
                              <LinkIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                              {key.replace(/_/g, " ")}
                            </span>
                            <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ) : null
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {seeker.resume_url && (
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">Resume</h3>
                    <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800" asChild>
                      <a href={seeker.resume_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-3 h-8 w-8 text-blue-500" />
                        <div className="text-left">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">Download Resume</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">PDF Document</div>
                        </div>
                      </a>
                    </Button>
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
