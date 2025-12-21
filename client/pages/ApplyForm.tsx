import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import { fetchOpportunityPublic, type Opportunity } from "@/lib/opportunities";
import { supabase } from "@/lib/supabase";
import { uploadPublicFile } from "@/lib/storage";
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { UploadCloud, Linkedin, Link as LinkIcon, FileText, CheckCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type FormState = {
  resumeFile?: File | null;
  resumeUrl?: string;
  linkedin?: string;
  coverLetterFile?: File | null;
  portfolio?: string;
  availability?: string;
  contact?: string;
  customAnswers: Record<number, string | string[]>;
};

export default function ApplyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = React.useState<Opportunity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<FormState>({ customAnswers: {}, resumeFile: null, coverLetterFile: null, resumeUrl: undefined });
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    fetchOpportunityPublic(id)
      .then(setOpportunity)
      .catch(() => setOpportunity(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Prefill from seeker profile if signed in
  React.useEffect(() => {
    (async () => {
      try {
        const { data: sessionData, error: authErr } = await supabase.auth.getSession();
        if (authErr || !sessionData.session?.user) return;
        const userId = sessionData.session.user.id;
        const { data, error } = await supabase
          .from("seeker_profiles")
          .select("resume_url, contact_email, telephone, portfolio, linkedin_verified")
          .eq("user_id", userId)
          .maybeSingle();
        if (error || !data) return;
        const portfolioVal =
          typeof data.portfolio === "string"
            ? data.portfolio
            : data.portfolio && typeof data.portfolio === "object" && "url" in data.portfolio
              ? (data.portfolio as any).url
              : "";
        setForm((f) => ({
          ...f,
          resumeUrl: data.resume_url || f.resumeUrl,
          contact: data.contact_email || data.telephone || f.contact,
          portfolio: portfolioVal || f.portfolio,
        }));
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Layout>
        <Seo title="Apply – NxteVia" />
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
          <div className="animate-pulse text-slate-400 dark:text-slate-500">Loading form...</div>
        </div>
      </Layout>
    );
  }

  if (!opportunity) {
    return (
      <Layout>
        <Seo title="Apply – NxteVia" />
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Opportunity not found</h1>
            <Button variant="link" onClick={() => navigate("/seekers/opportunities")} className="text-primary">Back to Opportunities</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const req = opportunity.requirements || {};
  const customQs = Array.isArray(req.custom_questions) ? req.custom_questions : [];

  const updateCustom = (idx: number, value: string | string[]) => {
    setForm((f) => ({ ...f, customAnswers: { ...f.customAnswers, [idx]: value } }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunity) return;
    setSubmitting(true);

    const { data: sessionData, error: authErr } = await supabase.auth.getSession();
    if (authErr || !sessionData.session?.user) {
      toast({ title: "Not signed in", description: "Please sign in to apply.", duration: 2000 });
      setSubmitting(false);
      return;
    }
    const userId = sessionData.session.user.id;

    // Prevent duplicate applications unless the previous one was withdrawn/deleted
    const { data: existingApp, error: existingErr } = await supabase
      .from("applications")
      .select("id,status")
      .eq("opportunity_id", opportunity.id)
      .eq("applicant_id", userId)
      .maybeSingle();
    if (existingErr) {
      toast({ title: "Application check failed", description: existingErr.message, duration: 2000 });
      setSubmitting(false);
      return;
    }
    if (existingApp && existingApp.status !== "withdrawn") {
      toast({ title: "Already applied", description: "Withdraw your existing application before applying again.", duration: 2200 });
      setSubmitting(false);
      return;
    }
    if (existingApp && existingApp.status === "withdrawn") {
      await supabase.from("applications").delete().eq("id", existingApp.id);
    }

    let resumeUrl: string | undefined = form.resumeUrl;
    let coverLetterUrl: string | undefined;

    try {
      if (req.require_resume && form.resumeFile) {
        const path = `applications/${opportunity.id}/${userId}-resume-${form.resumeFile.name}`;
        resumeUrl = await uploadPublicFile("profile-files", form.resumeFile, path);
      }
      if (req.require_cover_letter && form.coverLetterFile) {
        const path = `applications/${opportunity.id}/${userId}-cover-${form.coverLetterFile.name}`;
        coverLetterUrl = await uploadPublicFile("profile-files", form.coverLetterFile, path);
      }
    } catch (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr instanceof Error ? uploadErr.message : "Resume/Cover upload failed", duration: 2500 });
      setSubmitting(false);
      return;
    }

    const { data: seekerProfile } = await supabase
      .from("seeker_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("display_name, role, country")
      .eq("user_id", userId)
      .maybeSingle();

    const answers = customQs.map((q: any, idx: number) => ({
      prompt: q.prompt,
      type: q.type,
      answer: form.customAnswers[idx] ?? null,
      options: q.options || [],
    }));

    const nowIso = new Date().toISOString();
    const { error: insertErr } = await supabase.from("applications").upsert(
      {
        opportunity_id: opportunity.id,
        applicant_id: userId,
        status: "submitted",
        created_at: nowIso,
        updated_at: nowIso,
        answers,
        resume_url: resumeUrl,
        cover_letter_url: coverLetterUrl,
        portfolio_url: form.portfolio,
        linkedin_url: form.linkedin,
        availability: form.availability,
        contact: form.contact,
        applicant_snapshot: {
          profile: profileRow,
          seeker: seekerProfile,
        },
      },
      { onConflict: "opportunity_id,applicant_id" },
    );
    if (insertErr) {
      toast({ title: "Application failed", description: insertErr.message, duration: 2500 });
      setSubmitting(false);
      return;
    }

    trackEvent("apply_clicked", { projectId: opportunity.id, source: "apply_form" });
    toast({ title: "Application recorded", description: "We’ll forward this to the company.", duration: 2000 });
    navigate({ pathname: "/apply/thank-you", search: `?projectId=${encodeURIComponent(opportunity.id)}` });
    setSubmitting(false);
  };

  return (
    <Layout>
      <Seo title={`Apply – ${opportunity.title}`} canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-12 transition-colors duration-300">
        <div className="container max-w-2xl">
          <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary dark:hover:text-white dark:hover:text-primary dark:hover:text-white text-slate-600 dark:text-slate-400" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Opportunity
          </Button>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-xl shadow-indigo-900/5">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Apply to {opportunity.title}</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
                Complete the form below to submit your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {!profileLoaded && (
                <div className="mb-6 p-3 bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary text-sm rounded-lg flex items-center gap-2 border border-primary/10 dark:border-primary/30">
                  <div className="h-4 w-4 border-2 border-primary dark:border-primary border-t-transparent rounded-full animate-spin" />
                  Loading your profile data...
                </div>
              )}

              <form className="space-y-8" onSubmit={submit}>
                {/* Standard Fields Section */}
                <div className="space-y-6">
                  {req.require_resume && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Resume / CV <span className="text-red-500">*</span>
                      </label>

                      {form.resumeUrl ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-green-100 dark:border-green-800">
                              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-900 dark:text-green-300">Resume on file</div>
                              <a href={form.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-green-700 dark:text-green-400 hover:underline">View current resume</a>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                            onClick={() => setForm(f => ({ ...f, resumeUrl: undefined }))}
                          >
                            Replace
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-center">
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            required={!form.resumeUrl}
                            className="hidden"
                            id="resume-upload"
                            onChange={(e) => setForm((f) => ({ ...f, resumeFile: e.target.files?.[0] || null }))}
                          />
                          <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <div className="bg-primary/5 dark:bg-primary/20 p-3 rounded-full">
                              <UploadCloud className="h-6 w-6 text-primary dark:text-primary" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload resume</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">PDF, DOC, DOCX up to 5MB</span>
                          </label>
                          {form.resumeFile && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary rounded-full text-sm">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {form.resumeFile.name}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {req.require_linkedin && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        LinkedIn Profile <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="url"
                        required
                        value={form.linkedin || ""}
                        onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                        placeholder="https://www.linkedin.com/in/username"
                        className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all h-11"
                      />
                    </div>
                  )}

                  {req.require_cover_letter && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Cover Letter <span className="text-red-500">*</span>
                      </label>

                      {form.coverLetterFile ? (
                        <div className="flex items-center justify-between p-3 bg-primary/5 dark:bg-primary/20 border border-primary/10 dark:border-primary/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-primary/10 dark:border-primary/50">
                              <FileText className="h-5 w-5 text-primary dark:text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-primary dark:text-primary/70">Cover Letter Selected</div>
                              <div className="text-xs text-primary/80 dark:text-primary">{form.coverLetterFile.name}</div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-primary dark:text-primary/80 hover:text-primary dark:hover:text-white dark:hover:text-primary dark:hover:text-white hover:bg-primary/10 dark:hover:bg-primary/30"
                            onClick={() => setForm(f => ({ ...f, coverLetterFile: null }))}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-center">
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            required
                            className="hidden"
                            id="cover-upload"
                            onChange={(e) => setForm((f) => ({ ...f, coverLetterFile: e.target.files?.[0] || null }))}
                          />
                          <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <div className="bg-primary/5 dark:bg-primary/20 p-3 rounded-full">
                              <UploadCloud className="h-6 w-6 text-primary dark:text-primary" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload cover letter</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">PDF, DOC, DOCX up to 5MB</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {req.require_portfolio && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Portfolio Link <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="url"
                        required
                        value={form.portfolio || ""}
                        onChange={(e) => setForm((f) => ({ ...f, portfolio: e.target.value }))}
                        placeholder="https://yourportfolio.com"
                        className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all h-11"
                      />
                    </div>
                  )}

                  {req.require_availability && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white">Availability <span className="text-red-500">*</span></label>
                      <Input
                        value={form.availability || ""}
                        onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
                        placeholder="e.g., Immediate start, 20 hrs/week"
                        className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all h-11"
                      />
                    </div>
                  )}

                  {req.require_contact && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white">Preferred Contact <span className="text-red-500">*</span></label>
                      <Input
                        value={form.contact || ""}
                        onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                        placeholder="Email or phone number"
                        className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all h-11"
                      />
                    </div>
                  )}
                </div>

                {/* Custom Questions Section */}
                {customQs.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Additional Questions</h3>
                    {customQs.map((q: any, idx: number) => {
                      const isChoice = q.type === "dropdown" || q.type === "multiselect";
                      return (
                        <div key={idx} className="space-y-2">
                          <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                            {q.prompt || `Question ${idx + 1}`}
                          </label>
                          {isChoice && Array.isArray(q.options) ? (
                            q.type === "dropdown" ? (
                              <div className="relative">
                                <select
                                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                                  value={(form.customAnswers[idx] as string) || ""}
                                  onChange={(e) => updateCustom(idx, e.target.value)}
                                >
                                  <option value="">Select an option...</option>
                                  {q.options.map((opt: string, i: number) => (
                                    <option key={i} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <ChevronLeft className="h-4 w-4 -rotate-90 text-slate-400" />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                {q.options.map((opt: string, i: number) => {
                                  const selected = Array.isArray(form.customAnswers[idx]) ? (form.customAnswers[idx] as string[]).includes(opt) : false;
                                  return (
                                    <label key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-white dark:hover:bg-slate-900 p-2 rounded-lg transition-colors">
                                      <input
                                        type="checkbox"
                                        className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary bg-white dark:bg-slate-950"
                                        checked={selected}
                                        onChange={(e) => {
                                          const prev = Array.isArray(form.customAnswers[idx]) ? (form.customAnswers[idx] as string[]) : [];
                                          const next = e.target.checked ? [...prev, opt] : prev.filter((v) => v !== opt);
                                          updateCustom(idx, next);
                                        }}
                                      />
                                      {opt}
                                    </label>
                                  );
                                })}
                              </div>
                            )
                          ) : (
                            <Textarea
                              rows={4}
                              value={(form.customAnswers[idx] as string) || ""}
                              onChange={(e) => updateCustom(idx, e.target.value)}
                              className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all resize-none"
                              placeholder="Type your answer here..."
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-6 flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => navigate(-1)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
