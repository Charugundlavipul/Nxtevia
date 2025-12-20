import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkillsCombobox } from "@/components/site/SkillsCombobox";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/lib/supabase";
import { uploadPublicFile } from "@/lib/storage";
import { toast } from "@/components/ui/use-toast";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Trash2, Plus, Save, X, User, Briefcase, GraduationCap, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioItem { name: string; description: string }
interface ExperienceItem { company: string; description: string }
interface SeekerProfile {
  about: string;
  skills: string[];
  portfolio: PortfolioItem[];
  experiences: ExperienceItem[];
  resumeName: string;
  resumeUrl?: string;
  country: string; // ISO code
  state: string;
  preferredState: string;
  // New fields
  isStudent: boolean;
  studentProofName: string;
  studentProofUrl?: string;
  // removed seekingOpportunity; added telephone and careerStage
  contactEmail?: string;
  telephone?: string;
  careerStage?: "student" | "new_graduate" | "career_changer" | "professional" | "";
  emailVerified?: boolean;
  linkedinVerified?: boolean;
}

const DEFAULT_PROFILE: SeekerProfile = {
  about: "",
  skills: [],
  portfolio: [{ name: "", description: "" }],
  experiences: [{ company: "", description: "" }],
  resumeName: "",
  country: "",
  state: "",
  preferredState: "",
  // New defaults
  isStudent: false,
  studentProofName: "",
  contactEmail: "",
  telephone: "",
  careerStage: "",
  emailVerified: false,
  linkedinVerified: false,
};

interface ProfileEditProps { mode?: "edit" | "create"; redirectTo?: string }
export default function ProfileEdit({ mode = "edit", redirectTo = "/profile/me" }: ProfileEditProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<SeekerProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = React.useState(true);
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [studentProofFile, setStudentProofFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

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
          .from("seeker_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) {
          setLoading(false);
          return;
        }
        if (row) {
          const next: SeekerProfile = {
            ...DEFAULT_PROFILE,
            about: row.about ?? "",
            skills: Array.isArray(row.skills) ? row.skills : [],
            portfolio: row.portfolio ?? DEFAULT_PROFILE.portfolio,
            experiences: row.experiences ?? DEFAULT_PROFILE.experiences,
            resumeName: row.resume_name ?? row.resume_url ?? "",
            resumeUrl: row.resume_url ?? "",
            country: row.country ?? "",
            state: row.state ?? "",
            preferredState: row.preferred_location ?? "",
            isStudent: row.student_flag ?? false,
            studentProofName: row.student_proof_name ?? "",
            studentProofUrl: row.student_proof_url ?? "",
            contactEmail: row.contact_email ?? "",
            telephone: row.telephone ?? "",
            careerStage: row.career_stage ?? "",
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

  const updateExperience = (idx: number, key: keyof ExperienceItem, value: string) => {
    setProfile((p) => {
      const next = [...p.experiences];
      next[idx] = { ...next[idx], [key]: value };
      return { ...p, experiences: next };
    });
  };
  const addExperience = () => setProfile((p) => ({ ...p, experiences: [...p.experiences, { company: "", description: "" }] }));
  const removeExperience = (idx: number) => setProfile((p) => ({ ...p, experiences: p.experiences.filter((_, i) => i !== idx) }));

  const onResumeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    setResumeFile(file || null);
    setProfile((p) => ({ ...p, resumeName: file ? file.name : "", resumeUrl: undefined }));
  };

  const onProofChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    setStudentProofFile(file || null);
    setProfile((p) => ({ ...p, studentProofName: file ? file.name : "", studentProofUrl: undefined }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth.user) {
        toast({ title: "Not signed in", description: "Please sign in again.", duration: 3000 });
        return;
      }
      const userId = auth.user.id;

      // Upload files if provided
      let resumeUrl = profile.resumeUrl;
      if (resumeFile) {
        const path = `${userId}/resume-${Date.now()}-${resumeFile.name}`;
        resumeUrl = await uploadPublicFile("profile-files", resumeFile, path);
      }
      let studentProofUrl = profile.studentProofUrl;
      if (studentProofFile) {
        const path = `${userId}/proof-${Date.now()}-${studentProofFile.name}`;
        studentProofUrl = await uploadPublicFile("profile-files", studentProofFile, path);
      }

      const payload = {
        user_id: userId,
        about: profile.about,
        skills: profile.skills,
        contact_email: profile.contactEmail,
        telephone: profile.telephone,
        student_flag: profile.isStudent,
        career_stage: profile.careerStage,
        resume_url: resumeUrl,
        resume_name: profile.resumeName,
        country: profile.country,
        state: profile.state,
        preferred_location: profile.preferredState,
        portfolio: profile.portfolio,
        experiences: profile.experiences,
        student_proof_name: profile.studentProofName,
        student_proof_url: studentProofUrl,
        email_verified: profile.emailVerified ?? false,
        linkedin_verified: profile.linkedinVerified ?? false,
      };
      const { error } = await supabase.from("seeker_profiles").upsert(payload);
      if (error) {
        toast({ title: "Could not save profile", description: error.message, duration: 3500 });
        return;
      }
      if (profile.country) localStorage.setItem("eaas_profile_country", profile.country);
      toast({ title: "Profile saved", description: "Your seeker profile has been updated.", duration: 2500 });
      navigate(redirectTo);
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unexpected error", duration: 3500 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <Seo title={(mode === "create" ? "Complete your profile" : "Edit Profile") + " – NxteVia"} canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 py-12">
        <div className="container max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">{mode === "create" ? "Complete your profile" : "Edit Profile"}</h1>
            <p className="text-slate-500 mt-2">Update your details to help organizations understand your fit.</p>
          </div>

          <form onSubmit={save} className="space-y-8">
            {/* Basic Info Card */}
            <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg"><User className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Basic Information</CardTitle>
                    <CardDescription>Tell us a bit about yourself.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">About (one sentence)</label>
                  <Input
                    value={profile.about}
                    onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
                    placeholder="e.g., Frontend developer focused on UX and accessibility."
                    className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">Skills</label>
                  <SkillsCombobox
                    selected={profile.skills}
                    onChange={(arr) => setProfile((p) => ({ ...p, skills: arr }))}
                    placeholder="Type to add skills..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">Current Country</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={profile.country}
                        onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map(({ code, label }) => (
                          <option key={code} value={code}>{label}</option>
                        ))}
                      </select>
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">State / Province</label>
                    <Input
                      value={profile.state}
                      onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                      placeholder="e.g., California"
                      className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">Preferred Location</label>
                  <Input
                    value={profile.preferredState}
                    onChange={(e) => setProfile((p) => ({ ...p, preferredState: e.target.value }))}
                    placeholder="e.g., Remote, Toronto, New York"
                    className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Experience Card */}
            <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-lg"><Briefcase className="h-5 w-5 text-indigo-600" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Experience</CardTitle>
                    <CardDescription>Add your relevant roles and work history.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {profile.experiences.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-3 relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeExperience(idx)}
                        disabled={profile.experiences.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Company / Organization</label>
                      <Input
                        value={item.company}
                        onChange={(e) => updateExperience(idx, "company", e.target.value)}
                        placeholder="Company Name"
                        className="bg-white border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                      <Textarea
                        rows={3}
                        value={item.description}
                        onChange={(e) => updateExperience(idx, "description", e.target.value)}
                        placeholder="Role description, key outcomes..."
                        className="bg-white border-slate-200 resize-none"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addExperience} className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300">
                  <Plus className="h-4 w-4 mr-2" /> Add Experience
                </Button>
              </CardContent>
            </Card>

            {/* Documents & Contact Card */}
            <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-2 rounded-lg"><FileText className="h-5 w-5 text-amber-600" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Documents & Contact</CardTitle>
                    <CardDescription>Upload your resume and contact details.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Resume / CV</label>
                  {profile.resumeName ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-900">Resume Selected</div>
                          <div className="text-xs text-green-700">{profile.resumeName}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        onClick={() => setProfile(p => ({ ...p, resumeName: "", resumeUrl: undefined }))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:bg-slate-50/50 transition-colors text-center">
                      <Input
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        id="resume-upload"
                        onChange={onResumeChange}
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="bg-blue-50 p-3 rounded-full">
                          <UploadCloud className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Click to upload resume</span>
                        <span className="text-xs text-slate-400">PDF, DOCX up to 5MB</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">Contact Email</label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={profile.contactEmail}
                        onChange={(e) => setProfile((p) => ({ ...p, contactEmail: e.target.value }))}
                        placeholder="you@example.com"
                        className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">Telephone</label>
                    <div className="relative">
                      <Input
                        value={profile.telephone}
                        onChange={(e) => setProfile((p) => ({ ...p, telephone: e.target.value }))}
                        placeholder="+1 555 555 5555"
                        className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-900 mb-3">Student Status</label>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="isStudent" checked={profile.isStudent === true} onChange={() => setProfile((p) => ({ ...p, isStudent: true }))} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                      <span className="text-slate-700">I am currently a student</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="isStudent" checked={profile.isStudent === false} onChange={() => setProfile((p) => ({ ...p, isStudent: false }))} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                      <span className="text-slate-700">I am not a student</span>
                    </label>
                  </div>

                  {profile.isStudent && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-900 mb-2">Upload Student ID / Transcript</label>
                      {profile.studentProofName ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg border border-blue-100">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-blue-900">Proof Selected</div>
                              <div className="text-xs text-blue-700">{profile.studentProofName}</div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => setProfile(p => ({ ...p, studentProofName: "", studentProofUrl: undefined }))}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:bg-slate-50/50 transition-colors text-center">
                          <Input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            id="proof-upload"
                            onChange={onProofChange}
                          />
                          <label htmlFor="proof-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <div className="bg-blue-50 p-3 rounded-full">
                              <UploadCloud className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Click to upload proof</span>
                            <span className="text-xs text-slate-400">PDF, PNG, JPG up to 5MB</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">Career Stage</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={profile.careerStage}
                      onChange={(e) => setProfile((p) => ({ ...p, careerStage: e.target.value as any }))}
                    >
                      <option value="">Select career stage</option>
                      <option value="student">Student</option>
                      <option value="new_graduate">New graduate</option>
                      <option value="career_changer">Career changer</option>
                      <option value="professional">Professional expanding skills</option>
                    </select>
                    <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                disabled={saving}
              >
                {saving ? "Saving..." : (mode === "create" ? "Complete Profile" : "Save Changes")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50"
                onClick={() => navigate(redirectTo)}
                disabled={saving}
              >
                {mode === "create" ? "Skip for now" : "Cancel"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
