import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, CheckCircle2, Globe, Mail, MapPin, Phone, Save, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CompanyProfileUpdate() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState({
    name: "",
    about: "",
    reasonsForJoining: [] as string[],
    contactEmail: "",
    telephone: "",
    industry: "",
    sizeRange: "",
    baseLocation: "",
    website: "",
    projectTypes: [] as string[],
    projectTypesOther: "",
    hiringGoal: "",
    emailVerified: false,
    linkedinVerified: false,
    aiScreening: false,
  });
  const [modalOpen, setModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) {
          setLoading(false);
          return;
        }
        const { data: row, error } = await supabase.from("company_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (!error && row) {
          setProfile({
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
            aiScreening: row.ai_screening_enabled ?? false,
          });
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
        ai_screening_enabled: profile.aiScreening,
      };
      const { error } = await supabase.from("company_profiles").upsert(payload);
      if (error) {
        toast({ title: "Could not save profile", description: error.message, duration: 3500 });
        return;
      }
      const slug = (profile.name || "company").toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "company";
      toast({ title: "Profile saved", description: "Your company profile has been updated.", duration: 2500 });
      navigate(`/company/profile/${slug}`);
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
      <Seo title="Update Company Profile – NxteVia" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12">
        <div className="container max-w-3xl space-y-8">

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <Link to={`/company/profile/${(profile.name || "company").toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "company"}`} className="hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Profile
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-medium">Update Profile</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Update Company Profile</h1>
            <p className="text-slate-500 dark:text-slate-400">Edit details about your organization to attract the best talent.</p>
          </div>

          {loading ? (
            <div className="h-64 bg-white rounded-xl shadow-sm animate-pulse" />
          ) : (
            <form onSubmit={save} className="space-y-8">
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Organization Name</Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Brane Group"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Industry</Label>
                      <Input
                        value={profile.industry}
                        onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
                        placeholder="e.g., Software, Education"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">About the Organization</Label>
                      <Textarea
                        rows={4}
                        value={profile.about}
                        onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
                        placeholder="Share a brief overview of your company..."
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Company Size</Label>
                      <Select value={profile.sizeRange} onValueChange={(v) => setProfile((p) => ({ ...p, sizeRange: v }))}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 team members</SelectItem>
                          <SelectItem value="11-50">11-50 team members</SelectItem>
                          <SelectItem value="51-200">51-200 team members</SelectItem>
                          <SelectItem value="200+">200+ team members</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Base Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          value={profile.baseLocation}
                          onChange={(e) => setProfile((p) => ({ ...p, baseLocation: e.target.value }))}
                          placeholder="City, Country"
                          className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          value={profile.website}
                          onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                          placeholder="https://example.com"
                          className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hiring Goal</Label>
                      <Select value={profile.hiringGoal} onValueChange={(v) => setProfile((p) => ({ ...p, hiringGoal: v }))}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white">
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hire_full_time">Hire full-time later</SelectItem>
                          <SelectItem value="project_support">Gain project support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Contact Email</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            value={profile.contactEmail}
                            onChange={(e) => setProfile((p) => ({ ...p, contactEmail: e.target.value }))}
                            placeholder="contact@company.com"
                            className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setModalOpen(true)}
                          disabled={!profile.contactEmail || profile.emailVerified}
                          className={cn(profile.emailVerified && "text-green-600 border-green-200 bg-green-50")}
                        >
                          {profile.emailVerified ? <CheckCircle2 className="h-4 w-4 mr-2" /> : null}
                          {profile.emailVerified ? "Verified" : "Verify"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          value={profile.telephone}
                          onChange={(e) => setProfile((p) => ({ ...p, telephone: e.target.value }))}
                          placeholder="+1 555 555 5555"
                          className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Preferences & Interests</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reasons for Joining</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "Onboard skilled talent for quick turn around",
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
                            "cursor-pointer rounded-xl border p-4 text-sm transition-all hover:border-primary/40 hover:bg-primary/5",
                            profile.reasonsForJoining.includes(r)
                              ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              profile.reasonsForJoining.includes(r) ? "border-primary bg-primary text-white" : "border-slate-400"
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
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Project/Work Types of Interest</Label>
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
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
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
                        className="mt-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-white"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="aiScreening"
                      checked={profile.aiScreening}
                      onChange={(e) => setProfile((p) => ({ ...p, aiScreening: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                    />
                    <Label htmlFor="aiScreening" className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                      Do you use AI to screen candidates?
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium text-base transition-all hover:scale-[1.02]">
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const slug = (profile.name || "company").toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "company";
                    navigate(`/company/profile/${slug}`);
                  }}
                  className="h-12 px-6 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
