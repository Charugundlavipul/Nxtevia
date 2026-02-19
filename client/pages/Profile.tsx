import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketModal } from "@/components/TicketModal";
import { COUNTRIES } from "@/lib/countries";
import { appSignOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { fetchCompletionsForApplicant, type OpportunityCompletion } from "@/lib/opportunityCompletions";
import { toast } from "@/components/ui/use-toast";
import { Building2, FileText, Globe2, Loader2, MapPin, Phone, Star, Users, Briefcase, GraduationCap, Mail, CheckCircle2, AlertCircle, Trash2, Edit } from "lucide-react";
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
import { cn } from "@/lib/utils";

type UiRole = "student" | "company";

type BaseProfile = {
  displayName: string;
  apiRole: "seeker" | "company" | "admin";
  country?: string | null;
};

type ExperienceItem = { company: string; description?: string };
type OpportunityItem = { title?: string; status?: string; role?: string; issuer?: string; issued_by?: string };
type SeekerProfile = {
  about?: string;
  skills: string[];
  experiences: ExperienceItem[];
  opportunities: OpportunityItem[];
  resumeName?: string;
  resumeUrl?: string;
  contactEmail?: string;
  telephone?: string;
  isStudent?: boolean;
  careerStage?: string;
  country?: string;
  state?: string;
  preferredState?: string;
  emailVerified?: boolean;
  linkedinVerified?: boolean;
};

type CompanyProfile = {
  name?: string;
  about?: string;
  contactEmail?: string;
  telephone?: string;
  industry?: string;
  sizeRange?: string;
  baseLocation?: string;
  website?: string;
  reasonsForJoining?: string[];
  projectTypes?: string[];
  projectTypesOther?: string;
  hiringGoal?: string;
  emailVerified?: boolean;
  linkedinVerified?: boolean;
};

const STORAGE_BUCKETS = ["profile-files"];

const emptySeeker: SeekerProfile = {
  about: "",
  skills: [],
  experiences: [],
  opportunities: [],
};

async function listUserFiles(bucket: string, prefix: string) {
  if (!prefix) return [];
  const files: string[] = [];
  const stack = [prefix];

  while (stack.length > 0) {
    const current = stack.pop()!;
    let page = 0;
    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(current, {
        limit: 100,
        offset: page * 100,
        sortBy: { column: "name", order: "asc" },
      });
      if (error || !data || data.length === 0) break;

      for (const entry of data) {
        const entryPath = current ? `${current}/${entry.name}` : entry.name;
        if (entry.metadata) {
          files.push(entryPath);
        } else {
          stack.push(entryPath);
        }
      }

      if (data.length < 100) break;
      page += 1;
    }
  }

  return files;
}

async function deleteUserFiles(userId: string) {
  for (const bucket of STORAGE_BUCKETS) {
    try {
      const files = await listUserFiles(bucket, userId);
      if (files.length) {
        const { error } = await supabase.storage.from(bucket).remove(files);
        if (error) throw error;
      }
      const { error: rootError } = await supabase.storage.from(bucket).remove([userId]);
      if (rootError && !rootError.message?.toLowerCase().includes("not found")) {
        throw rootError;
      }
    } catch (err) {
      console.error(`Failed to delete files from bucket ${bucket}`, err);
      throw err;
    }
  }
}

const countryLabel = (code?: string | null) => {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code)?.label || code;
};

const formatResumeName = (name?: string) => {
  if (!name) return "";
  const lastDot = name.lastIndexOf(".");
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot > 0 ? name.slice(lastDot) : "";
  if (base.length > 16) {
    return `${base.slice(0, 16)}…${ext}`;
  }
  return name;
};

const deriveRole = (viewParam: string, apiRole?: "seeker" | "company" | "admin"): UiRole => {
  if (viewParam === "company") return "company";
  if (viewParam === "seeker" || viewParam === "student") return "student";
  if (apiRole === "company") return "company";
  return "student";
};

export default function Profile() {
  const { username } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<UiRole>("student");
  const [baseProfile, setBaseProfile] = useState<BaseProfile | null>(null);
  const [seekerProfile, setSeekerProfile] = useState<SeekerProfile>(emptySeeker);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [completions, setCompletions] = useState<OpportunityCompletion[]>([]);
  const [opportunityMap, setOpportunityMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;

        // Determine target user ID
        // If username param is a valid UUID, we are viewing someone else.
        // Otherwise, we viewing ourselves (requires auth).
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username || "");
        let targetUserId = user?.id;

        if (isUuid && username) {
          targetUserId = username;
        } else if (!user) {
          // No user and no UUID profile to view -> show login wall
          setAuthed(false);
          setLoading(false);
          return;
        }

        if (!targetUserId) {
          setAuthed(false);
          setLoading(false);
          return;
        }

        setAuthed(true); // We just treat 'viewing a profile' as 'authorized' to render the component, RLS handles data access
        setUserId(user?.id || null);

        const viewParam = (new URLSearchParams(location.search).get("role") ||
          new URLSearchParams(location.search).get("view") ||
          "").toLowerCase();

        const { data: baseRow, error: baseErr } = await supabase
          .from("profiles")
          .select("display_name, role, country")
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (baseErr) {
          console.error("Profile load error:", baseErr);
          // Don't toast here to avoid spamming if RLS denies
        }

        const resolvedRole = deriveRole(viewParam, baseRow?.role);
        setRole(resolvedRole);

        setBaseProfile({
          displayName: baseRow?.display_name || (targetUserId === user?.id ? (user?.user_metadata as any)?.name || user?.email : "User") || "Profile",
          apiRole: (baseRow?.role as any) || "seeker",
          country: baseRow?.country ?? null,
        });

        if (resolvedRole === "company") {
          const { data: row, error } = await supabase
            .from("company_profiles")
            .select("*")
            .eq("user_id", targetUserId)
            .maybeSingle();
          if (error) {
            console.error("Company profile load error:", error);
          } else if (row) {
            setCompanyProfile({
              name: row.name ?? baseRow?.display_name ?? "",
              about: row.about ?? "",
              contactEmail: row.contact_email ?? "",
              telephone: row.telephone ?? "",
              industry: row.industry ?? "",
              sizeRange: row.size_range ?? "",
              baseLocation: row.base_location ?? "",
              website: row.website ?? "",
              reasonsForJoining: Array.isArray(row.reasons_for_joining) ? row.reasons_for_joining : [],
              projectTypes: Array.isArray(row.project_types) ? row.project_types : [],
              projectTypesOther: row.project_types_other ?? "",
              hiringGoal: row.hiring_goal ?? "",
              emailVerified: row.email_verified ?? false,
              linkedinVerified: row.linkedin_verified ?? false,
            });
          }
        } else {
          const { data: row, error } = await supabase
            .from("seeker_profiles")
            .select("*")
            .eq("user_id", targetUserId)
            .maybeSingle();
          if (error) {
            console.error("Seeker profile load error:", error);
          } else if (row) {
            setSeekerProfile({
              about: row.about ?? "",
              skills: Array.isArray(row.skills) ? row.skills : [],
              experiences: Array.isArray(row.experiences) ? row.experiences : [],
              opportunities: Array.isArray(row.opportunities) ? row.opportunities : [],
              resumeName: row.resume_name ?? row.resume_url ?? "",
              resumeUrl: row.resume_url ?? "",
              contactEmail: row.contact_email ?? "",
              telephone: row.telephone ?? "",
              isStudent: row.student_flag ?? false,
              careerStage: row.career_stage ?? "",
              country: row.country ?? "",
              state: row.state ?? "",
              preferredState: row.preferred_location ?? "",
              emailVerified: row.email_verified ?? false,
              linkedinVerified: row.linkedin_verified ?? false,
            });
          } else {
            setSeekerProfile(emptySeeker);
          }
          try {
            const completionList = await fetchCompletionsForApplicant(targetUserId);
            setCompletions(completionList);
            const oppIds = Array.from(new Set(completionList.map((c) => c.opportunity_id))).filter(Boolean);
            if (oppIds.length > 0) {
              const { data } = await supabase.from("opportunities").select("id,title").in("id", oppIds);
              const map: Record<string, string> = {};
              (data || []).forEach((row: any) => {
                map[row.id] = row.title;
              });
              setOpportunityMap(map);
            } else {
              setOpportunityMap({});
            }
          } catch {
            // ignore review/completion load failures
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [location.search, username]);

  const displayName = baseProfile?.displayName || username || "Profile";
  const resumeLabel = useMemo(() => formatResumeName(seekerProfile.resumeName), [seekerProfile.resumeName]);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username || "");
  const isOwner = userId && (!isUuid || username === userId);

  const opportunities = seekerProfile.opportunities || [];
  const deleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        toast({ title: "Not signed in", description: "Please sign in again to delete your account.", duration: 3500 });
        return;
      }

      await deleteUserFiles(user.id);

      const tables = ["seeker_profiles", "company_profiles", "profiles"];
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq("user_id", user.id);
        if (error) throw error;
      }

      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (authDeleteError) throw authDeleteError;

      toast({ title: "Account deleted", description: "Your profile and files have been removed.", duration: 3000 });
      setDeleteDialogOpen(false);
      await appSignOut();
      window.location.assign("/signup");
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete your account. Please try again.",
        duration: 4000,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!authed && !loading) {
    return (
      <Layout>
        <Seo title="Profile – NxteVia" description="Profile" canonical={window.location.href} />
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center transition-colors duration-300">
          <Card className="max-w-md w-full mx-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-xl">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign in required</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Please sign in to view your profile.</p>
              <Button asChild className="w-full rounded-xl"><a href="/login">Go to login</a></Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title={`${displayName} – Profile`} description="Showcase your profile." canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative pb-20 transition-colors duration-300">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/80 dark:from-blue-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

        <section className="container py-10 relative z-10 max-w-5xl">
          {/* Header Section */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl p-8 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">{displayName}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700">
                        {role === "company" ? "Company" : "Seeker"}
                      </Badge>
                      {role === "student" && seekerProfile.isStudent && (
                        <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                          <GraduationCap className="h-3 w-3 mr-1" /> Student
                        </Badge>
                      )}

                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  {role === "student" && (seekerProfile.country || seekerProfile.state) && (
                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      {countryLabel(seekerProfile.country)}
                      {seekerProfile.state ? `, ${seekerProfile.state}` : ""}
                    </div>
                  )}
                  {role === "company" && companyProfile?.baseLocation && (
                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      {companyProfile.baseLocation}
                    </div>
                  )}
                  {role === "student" && seekerProfile.resumeName && (
                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      Resume Available
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isOwner && (
                  <>
                    <Button asChild variant="default" className="rounded-xl shadow-md shadow-blue-500/20">
                      <a href={role === "company" ? "/company/profile/update" : "/profile/edit"}>
                        <Edit className="h-4 w-4 mr-2" /> Edit Profile
                      </a>
                    </Button>
                    <Button variant="outline" className="rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" onClick={() => setTicketModalOpen(true)}>
                      Create Ticket
                    </Button>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-slate-900 dark:text-white">Delete profile permanently?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                            This will remove your account, profile data, and uploaded files. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleteLoading} className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={deleteAccount}
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {deleteLoading ? "Deleting..." : "Delete forever"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 h-64 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
              <div className="h-64 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
            </div>
          ) : role === "company" ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                <CardContent className="p-8 space-y-8">
                  <section>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-500" /> About Company
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                      {companyProfile?.about || "Add your company overview to help seekers understand your mission."}
                    </p>
                  </section>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {companyProfile?.industry && (
                      <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Industry</div>
                        <div className="font-medium text-slate-900 dark:text-white">{companyProfile.industry}</div>
                      </div>
                    )}
                    {companyProfile?.sizeRange && (
                      <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Size</div>
                        <div className="font-medium text-slate-900 dark:text-white">{companyProfile.sizeRange}</div>
                      </div>
                    )}
                  </div>

                  {companyProfile?.projectTypes && companyProfile.projectTypes.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Project/Work Types</h3>
                      <div className="flex flex-wrap gap-2">
                        {companyProfile.projectTypes.map((p) => (
                          <Badge key={p} variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-100 dark:border-blue-800">
                            {p}
                          </Badge>
                        ))}
                        {companyProfile.projectTypesOther && (
                          <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-100 dark:border-blue-800">
                            {companyProfile.projectTypesOther}
                          </Badge>
                        )}
                      </div>
                    </section>
                  )}

                  {companyProfile?.hiringGoal && (
                    <section className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">Hiring Goal</h3>
                      <p className="text-sm text-indigo-700 dark:text-indigo-400">{companyProfile.hiringGoal}</p>
                    </section>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white">Contact Information</h3>
                    <div className="space-y-3">
                      {companyProfile?.contactEmail && (
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                          <span className="truncate">{companyProfile.contactEmail}</span>
                        </div>
                      )}
                      {companyProfile?.telephone && (
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                          <span>{companyProfile.telephone}</span>
                        </div>
                      )}
                      {companyProfile?.website && (
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Globe2 className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                          <a href={companyProfile.website} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                            {companyProfile.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {companyProfile?.reasonsForJoining && companyProfile.reasonsForJoining.length > 0 && (
                  <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-3">Why Join Us?</h3>
                      <ul className="space-y-2">
                        {companyProfile.reasonsForJoining.map((r) => (
                          <li key={r} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-8 space-y-8">
                    <section>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" /> About Me
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {seekerProfile.about || "Add a short bio to let companies know what you’re looking for."}
                      </p>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    <section>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" /> Skills
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {seekerProfile.skills.length > 0 ? (
                          seekerProfile.skills.map((s) => (
                            <Badge key={s} variant="secondary" className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500 italic">No skills added yet.</span>
                        )}
                      </div>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    <section>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-indigo-500" /> Experience
                      </h2>
                      <div className="space-y-4">
                        {seekerProfile.experiences.length > 0 ? (
                          seekerProfile.experiences.map((exp, idx) => (
                            <div key={idx} className="group relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                              <div className="font-semibold text-slate-900 dark:text-white">{exp.company || "Experience"}</div>
                              {exp.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{exp.description}</p>}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400 dark:text-slate-500 italic">No experience added yet.</div>
                        )}
                      </div>
                    </section>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-bold text-slate-900 dark:text-white">Contact & Info</h3>
                      <div className="space-y-3">
                        {seekerProfile.contactEmail && (
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                            <span className="truncate">{seekerProfile.contactEmail}</span>
                          </div>
                        )}
                        {seekerProfile.telephone && (
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                            <span>{seekerProfile.telephone}</span>
                          </div>
                        )}
                        {resumeLabel && (
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                            {seekerProfile.resumeUrl ? (
                              <a href={seekerProfile.resumeUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                                {resumeLabel}
                              </a>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">{resumeLabel}</span>
                            )}
                          </div>
                        )}
                        {seekerProfile.preferredState && (
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                            <span>Prefers: {seekerProfile.preferredState}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
                <CardContent className="p-8">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" /> Completed Opportunities
                  </h2>

                  {completions.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {completions.map((op) => (
                        <div key={op.id} className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
                          <div className="font-semibold text-slate-900 dark:text-white mb-1">{opportunityMap[op.opportunity_id] || "Opportunity"}</div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {op.role && <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{op.role}</Badge>}
                            {(op.start_date || op.end_date) && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {op.start_date ? new Date(op.start_date).toLocaleDateString() : ""}
                                {op.end_date ? ` - ${new Date(op.end_date).toLocaleDateString()}` : ""}
                              </span>
                            )}
                          </div>
                          {/* Feedback removed */}
                        </div>
                      ))}
                    </div>
                  ) : opportunities.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {opportunities.map((op, idx) => (
                        <div key={idx} className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="font-semibold text-slate-900 dark:text-white">{op.title || "Opportunity"}</div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {op.role && <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{op.role}</Badge>}
                            {op.status && <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{op.status}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="text-slate-400 dark:text-slate-500 mb-2">No opportunities recorded yet</div>
                      <Button variant="link" asChild className="text-blue-600 dark:text-blue-400">
                        <a href="/seekers/opportunities">Browse Opportunities</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>

      {authed && baseProfile && userId ? (
        <TicketModal
          open={ticketModalOpen}
          onOpenChange={setTicketModalOpen}
          userName={baseProfile.displayName}
          userRole={role}
          userId={userId}
        />
      ) : null}
    </Layout>
  );
}
