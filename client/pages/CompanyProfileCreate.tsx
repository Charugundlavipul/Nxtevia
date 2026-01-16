import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Label } from "@/components/ui/label";
import { Building2, CheckCircle2, Globe, Mail, MapPin, Phone, Save, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyProfile {
  name: string;
  about: string;
  reasonsForJoining: string[];
  contactEmail: string;
  telephone?: string;
  industry?: string;
  sizeRange?: string;
  baseLocation?: string;
  website?: string;
  projectTypes: string[];
  projectTypesOther?: string;
  hiringGoal?: string;
  emailVerified: boolean;
  linkedinVerified: boolean;
}

const DEFAULT: CompanyProfile = {
  name: "",
  about: "",
  reasonsForJoining: [],
  contactEmail: "",
  telephone: "",
  industry: "",
  sizeRange: "",
  baseLocation: "",
  website: "",
  projectTypes: [],
  projectTypesOther: "",
  hiringGoal: "",
  emailVerified: false,
  linkedinVerified: false,
};

function EmailVerifyModal({ open, onClose, email, onVerify }: { open: boolean; onClose: () => void; email: string; onVerify: (ok: boolean) => void }) {
  const [stage, setStage] = React.useState<"idle" | "sent" | "entered">("idle");
  const [code, setCode] = React.useState<string>("");
  const [sentCode, setSentCode] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) {
      setStage("idle");
      setCode("");
      setSentCode("");
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="space-y-1">
          <div className="font-bold text-xl text-slate-900 dark:text-white">Verify Email</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">We will send a one-time code to <span className="font-medium text-slate-900 dark:text-white">{email}</span>.</div>
        </div>

        {stage === "idle" && (
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                const c = String(Math.floor(1000 + Math.random() * 9000));
                setSentCode(c);
                setStage("sent");
                alert(`Prototype OTP: ${c}`);
              }}
            >
              Send Code
            </Button>
          </div>
        )}

        {stage === "sent" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Enter Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode((e.target as HTMLInputElement).value)}
                placeholder="0000"
                className="text-center text-2xl tracking-widest font-mono h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white"
                maxLength={4}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Check your spam folder if you don't see it.</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} className="rounded-xl dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
              <Button
                className="rounded-xl bg-primary hover:bg-primary/90 text-white"
                onClick={() => {
                  if (code === sentCode) {
                    onVerify(true);
                    onClose();
                  } else {
                    alert("Incorrect code");
                  }
                }}
              >
                Verify
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompanyProfileCreate() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<CompanyProfile>(DEFAULT);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) {
          setLoading(false);
          return;
        }
        const { data: row, error } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!error && row) {
          const next: CompanyProfile = {
            ...DEFAULT,
            name: row.name ?? "",
            about: row.about ?? "",
            reasonsForJoining: Array.isArray(row.reasons_for_joining) ? row.reasons_for_joining : [],
            contactEmail: row.contact_email ?? "",
            telephone: row.telephone ?? "",
            industry: row.industry ?? "",
            sizeRange: row.size_range ?? "",
            baseLocation: row.base_location ?? "",
            website: row.website ?? "",
            projectTypes: Array.isArray(row.project_types) ? row.project_types : [],
            projectTypesOther: row.project_types_other ?? "",
            hiringGoal: row.hiring_goal ?? "",
            emailVerified: row.email_verified ?? false,
            linkedinVerified: row.linkedin_verified ?? false,
          };
          setProfile(next);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth.user) {
        toast({ title: "Not signed in", description: "Please sign in again.", duration: 3000 });
        return;
      }
      const userId = auth.user.id;
      const payload = {
        user_id: userId,
        name: profile.name,
        about: profile.about,
        contact_email: profile.contactEmail,
        telephone: profile.telephone,
        industry: profile.industry,
        size_range: profile.sizeRange,
        base_location: profile.baseLocation,
        website: profile.website,
        reasons_for_joining: profile.reasonsForJoining,
        project_types: profile.projectTypes,
        project_types_other: profile.projectTypesOther,
        hiring_goal: profile.hiringGoal,
        email_verified: profile.emailVerified,
        linkedin_verified: profile.linkedinVerified,
      };
      const { error } = await supabase.from("company_profiles").upsert(payload);
      if (error) {
        toast({ title: "Could not save profile", description: error.message, duration: 3500 });
        return;
      }
      toast({ title: "Profile created", description: "Welcome to NxteVia!", duration: 2500 });
      navigate(`/company/profile/${profile.name || "company"}`);
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unexpected error", duration: 3500 });
    }
  };

  const toggleSelection = (field: "reasonsForJoining" | "projectTypes", value: string) => {
    setProfile((p) => {
      const current = p[field] || [];
      const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
      return { ...p, [field]: next };
    });
  };

  return (
    <Layout>
      <Seo title="Create Company Profile – NxteVia" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 py-12">
        <div className="container max-w-3xl space-y-8">

          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Create Company Profile</h1>
            <p className="text-slate-500 dark:text-slate-400">Tell us about your organization to get started.</p>
          </div>

          {loading ? (
            <div className="h-64 bg-white dark:bg-slate-800 rounded-xl shadow-sm animate-pulse" />
          ) : (
            <form onSubmit={save} className="space-y-8">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Organization Name</Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Brane Group"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Industry</Label>
                      <Input
                        value={profile.industry}
                        onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
                        placeholder="e.g., Software, Education"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">About the Organization</Label>
                      <Textarea
                        rows={4}
                        value={profile.about}
                        onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
                        placeholder="Share a brief overview of your company..."
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Company Size</Label>
                      <Select value={profile.sizeRange} onValueChange={(v) => setProfile((p) => ({ ...p, sizeRange: v }))}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1–10 employees</SelectItem>
                          <SelectItem value="11-50">11–50 employees</SelectItem>
                          <SelectItem value="51-200">51–200 employees</SelectItem>
                          <SelectItem value="200+">200+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Base Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          value={profile.baseLocation}
                          onChange={(e) => setProfile((p) => ({ ...p, baseLocation: e.target.value }))}
                          placeholder="City, Country"
                          className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          value={profile.website}
                          onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                          placeholder="https://example.com"
                          className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hiring Goal</Label>
                      <Select value={profile.hiringGoal} onValueChange={(v) => setProfile((p) => ({ ...p, hiringGoal: v }))}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hire_full_time">Hire full-time later</SelectItem>
                          <SelectItem value="project_support">Gain project support</SelectItem>
                          <SelectItem value="explore_talent">Explore talent</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Email</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            value={profile.contactEmail}
                            onChange={(e) => setProfile((p) => ({ ...p, contactEmail: e.target.value }))}
                            placeholder="contact@company.com"
                            className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setModalOpen(true)}
                          disabled={!profile.contactEmail || profile.emailVerified}
                          className={cn(
                            "dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
                            profile.emailVerified && "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                          )}
                        >
                          {profile.emailVerified ? <CheckCircle2 className="h-4 w-4 mr-2" /> : null}
                          {profile.emailVerified ? "Verified" : "Verify"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          value={profile.telephone}
                          onChange={(e) => setProfile((p) => ({ ...p, telephone: e.target.value }))}
                          placeholder="+1 555 555 5555"
                          className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">LinkedIn Verification</Label>
                      <div
                        onClick={() => setProfile((p) => ({ ...p, linkedinVerified: !p.linkedinVerified }))}
                        className={cn(
                          "cursor-pointer flex items-center gap-3 rounded-xl border p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                          profile.linkedinVerified ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                          profile.linkedinVerified ? "border-primary bg-primary text-white" : "border-slate-400 dark:border-slate-600"
                        )}>
                          {profile.linkedinVerified && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">My LinkedIn profile is verified (Optional)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Preferences & Interests</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reasons for Joining</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "On-board skilled talent for quick turn around",
                        "Access motivated students and career changers",
                        "Support workforce development and learning",
                        "Collaborate with emerging professionals",
                        "Save time with pre-scoped, outcomes-based opportunities",
                        "Gain fresh perspectives and innovative ideas",
                      ].map((r) => (
                        <div
                          key={r}
                          onClick={() => toggleSelection("reasonsForJoining", r)}
                          className={cn(
                            "cursor-pointer rounded-xl border p-4 text-sm transition-all hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10",
                            profile.reasonsForJoining.includes(r)
                              ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary ring-1 ring-primary"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              profile.reasonsForJoining.includes(r) ? "border-primary bg-primary text-white" : "border-slate-400 dark:border-slate-600"
                            )}>
                              {profile.reasonsForJoining.includes(r) && <CheckCircle2 className="h-3 w-3" />}
                            </div>
                            <span className="font-medium leading-tight">{r}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Project/Work Types of Interest</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Tech", "Marketing", "Design", "Operations", "Product", "Other"
                      ].map((t) => (
                        <div
                          key={t}
                          onClick={() => toggleSelection("projectTypes", t)}
                          className={cn(
                            "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all",
                            profile.projectTypes.includes(t)
                              ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                    {profile.projectTypes.includes("Other") && (
                      <Input
                        value={profile.projectTypesOther}
                        onChange={(e) => setProfile((p) => ({ ...p, projectTypesOther: e.target.value }))}
                        placeholder="Please specify other Project/Work Types"
                        className="mt-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium text-base transition-all hover:scale-[1.02]">
                  Create Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/company/home')}
                  className="h-12 px-6 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <EmailVerifyModal open={modalOpen} onClose={() => setModalOpen(false)} email={profile.contactEmail} onVerify={(ok) => setProfile((p) => ({ ...p, emailVerified: ok }))} />
        </div>
      </div>
    </Layout>
  );
}
