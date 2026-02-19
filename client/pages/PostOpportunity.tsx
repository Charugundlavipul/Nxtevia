import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SkillsCombobox } from "@/components/site/SkillsCombobox";
import { trackEvent } from "@/lib/analytics";
import { createOpportunity } from "@/lib/opportunities";
import { fetchCompanyRequirements } from "@/lib/companyRequirements";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ESAExemptionModal } from "@/components/modals/ESAExemptionModal";
import { createAttestation, ATTESTATION_TYPES } from "@/lib/attestations";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight, Plus, X, Trash2, HelpCircle, Save, Briefcase, FileText, Settings, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormValues {
  modality: "remote" | "hybrid" | "on-site";
  title: string;
  problem_statement: string;
  desired_outcome: string;
  scope: string;
  duration: "0-3m" | "4-6m" | "7-9m" | "10-12m" | ">12m";
  hours: "5-10" | "10-20" | "20+" | string;
  stipend: "paid" | "unpaid";
  pay_amount?: number;
  currency?: string;
  pay_type?: "hourly" | "fixed" | "annually";
  skills: string; // comma-separated
}

type QuestionType = "text" | "dropdown" | "multiselect";
type CustomQuestion = { id: string; prompt: string; type: QuestionType; options: string[] };

const newQuestion = (): CustomQuestion => ({
  id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `q-${Date.now()}`,
  prompt: "",
  type: "text",
  options: [],
});

const ensureOptions = (opts: string[]) => {
  const next = opts.filter(Boolean);
  if (next.length >= 2) return next;
  if (next.length === 1) return [...next, "Option 2"];
  return ["Option 1", "Option 2"];
};

export default function PostOpportunity() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: "",
      problem_statement: "",
      desired_outcome: "",
      scope: "",
      skills: "",
      modality: "remote",
      duration: "0-3m",
      hours: "5-10",
      stipend: "paid",
      pay_amount: 0,
      currency: "USD",
      pay_type: "hourly",
    },
  });
  const [requirements, setRequirements] = React.useState<any | null>(null);
  const [reqLoading, setReqLoading] = React.useState(true);
  const [reqOpen, setReqOpen] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [esaModalOpen, setEsaModalOpen] = React.useState(false);
  const [esaVerified, setEsaVerified] = React.useState(false);

  const handleStipendChange = (val: string) => {
    if (val === "unpaid") {
      setEsaVerified(false);
      setEsaModalOpen(true);
    } else {
      setValue("stipend", "paid");
    }
  };

  const handleESAVerified = () => {
    setEsaVerified(true);
    setValue("stipend", "unpaid");
    setEsaModalOpen(false);
  };

  React.useEffect(() => {
    fetchCompanyRequirements()
      .then((req) => {
        const normalized = {
          ...req,
          custom_questions: (req.custom_questions || []).map((q: any) =>
            q.type === "text" ? { ...q, options: [] } : { ...q, options: ensureOptions(q.options || []) },
          ),
        };
        setRequirements(normalized);
      })
      .catch(() => setRequirements({
        require_resume: true,
        require_linkedin: false,
        require_cover_letter: false,
        require_portfolio: false,
        require_availability: false,
        require_contact: false,
        preferred_messaging_method: "messaging",
        custom_questions: [],
      }))
      .finally(() => setReqLoading(false));
  }, []);

  const upsertQuestion = (id: string, changes: Partial<CustomQuestion>) =>
    setRequirements((p: any) =>
      !p ? p : { ...p, custom_questions: p.custom_questions.map((q: CustomQuestion) => (q.id === id ? { ...q, ...changes } : q)) },
    );
  const addQuestion = () => setRequirements((p: any) => (!p ? p : { ...p, custom_questions: [...p.custom_questions, newQuestion()] }));
  const removeQuestion = (id: string) =>
    setRequirements((p: any) => (!p ? p : { ...p, custom_questions: p.custom_questions.filter((q: CustomQuestion) => q.id !== id) }));
  const addOption = (qid: string) =>
    setRequirements((p: any) =>
      !p
        ? p
        : {
          ...p,
          custom_questions: p.custom_questions.map((q: CustomQuestion) =>
            q.id === qid ? { ...q, options: [...ensureOptions(q.options), `Option ${q.options.length + 1}`] } : q,
          ),
        },
    );
  const updateOption = (qid: string, idx: number, val: string) =>
    setRequirements((p: any) =>
      !p
        ? p
        : {
          ...p,
          custom_questions: p.custom_questions.map((q: CustomQuestion) =>
            q.id === qid ? { ...q, options: q.options.map((o: string, i: number) => (i === idx ? val : o)) } : q,
          ),
        },
    );
  const removeOption = (qid: string, idx: number) =>
    setRequirements((p: any) =>
      !p
        ? p
        : {
          ...p,
          custom_questions: p.custom_questions.map((q: CustomQuestion) => {
            if (q.id !== qid) return q;
            const next = q.options.filter((_: string, i: number) => i !== idx);
            return { ...q, options: ensureOptions(next) };
          }),
        },
    );

  const onSubmit = async (values: FormValues) => {
    const skills = values.skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skills.length < 1) {
      alert("Please add at least one skill.");
      return;
    }
    if (!requirements) {
      alert("Requirements not loaded. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      const combinedProblem = `**Problem Statement**\n${values.problem_statement}\n\n**Desired Outcome**\n${values.desired_outcome}`;

      const newJob = await createOpportunity({
        title: values.title,
        problem: combinedProblem,
        scope: values.scope,
        modality: values.modality,
        duration: values.duration,
        hours: values.hours,
        stipend: values.stipend,
        pay_amount: values.stipend === "paid" ? Number(values.pay_amount) : null,
        currency: values.stipend === "paid" ? values.currency : null,
        pay_type: values.stipend === "paid" ? values.pay_type : null,
        skills,
        requirements,
        history: [{ at: new Date().toISOString(), action: "submitted" }],
      });

      if (values.stipend === "unpaid") {
        await createAttestation(newJob.id, ATTESTATION_TYPES.ESA_STUDENT_EXEMPTION, "v1.0 (Placeholder Text)");
      }

      trackEvent("employer_submit", { modality: values.modality });
      toast({ title: "Posted!", description: "Opportunity is now pending review.", duration: 2000 });
      navigate("/company/post-opportunity/success", {
        state: {
          title: values.title,
          org: "Your company",
          modality: values.modality,
          duration: values.duration,
          city: "",
          country: "US",
        }
      });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to post opportunity.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Seo title="Post an Opportunity - NxteVia" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-12 relative transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/5 dark:from-primary/10 to-transparent pointer-events-none" />

        <div className="container max-w-4xl space-y-8 relative z-10">

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary dark:text-blue-400" />
              Post an Opportunity
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Create a new project opportunity to find the best talent.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Opportunity Details Card */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Opportunity Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Workmode</Label>
                    <Select value={watch("modality")} onValueChange={(v) => setValue("modality", v as any)}>
                      <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Work mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="on-site">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Opportunity Title</Label>
                    <Input
                      {...register("title", { required: true })}
                      placeholder="e.g. Design an onboarding microsite"
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Problem Statement</Label>
                    <Textarea
                      rows={3}
                      {...register("problem_statement", { required: true })}
                      placeholder="What is the problem you are trying to solve?"
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Desired Outcome</Label>
                    <Textarea
                      rows={3}
                      {...register("desired_outcome", { required: true })}
                      placeholder="What is the desired outcome or solution?"
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Scope of Work</Label>
                    <Textarea
                      rows={4}
                      {...register("scope", { required: true })}
                      placeholder="Describe milestones, acceptance criteria, and final outputs"
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Duration</Label>
                    <Select value={watch("duration")} onValueChange={(v) => setValue("duration", v as any)}>
                      <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-3m">0-3 months</SelectItem>
                        <SelectItem value="4-6m">4-6 months</SelectItem>
                        <SelectItem value="7-9m">7-9 months</SelectItem>
                        <SelectItem value="10-12m">10-12 months</SelectItem>
                        <SelectItem value=">12m">More than 12 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hours / Week</Label>
                    <Select value={watch("hours")} onValueChange={(v) => setValue("hours", v as any)}>
                      <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Hours/week" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5-10">5-10</SelectItem>
                        <SelectItem value="10-20">10-20</SelectItem>
                        <SelectItem value="20+">20+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Compensation</Label>
                      <Select
                        value={watch("stipend")}
                        onValueChange={handleStipendChange}
                      >
                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid (Pro-bono/Academic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {watch("stipend") === "paid" && (
                      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 animation-expand">
                        <div className="col-span-1 space-y-2">
                          <Label className="text-xs font-medium text-slate-500">Amount</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...register("pay_amount", { required: watch("stipend") === "paid", min: 0 })}
                            className="bg-white dark:bg-slate-950"
                          />
                        </div>
                        <div className="col-span-1 space-y-2">
                          <Select value={watch("currency")} onValueChange={(v) => setValue("currency", v)}>
                            <SelectTrigger className="bg-white dark:bg-slate-950">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="CAD">CAD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="INR">INR (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 space-y-2">
                          <Label className="text-xs font-medium text-slate-500">Frequency</Label>
                          <Select value={watch("pay_type")} onValueChange={(v) => setValue("pay_type", v as any)}>
                            <SelectTrigger className="bg-white dark:bg-slate-950">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="fixed">Fixed Price</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Skills (comma-separated)</Label>
                    <SkillsCombobox
                      selected={watch("skills").split(",").map((s) => s.trim()).filter(Boolean)}
                      onChange={(arr) => setValue("skills", arr.join(", "))}
                      placeholder="e.g., Customer Success Management, UX Design"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements Card */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Application Requirements
                </CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReqOpen((v) => !v)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                  {reqOpen ? "Hide" : "Show"}
                </Button>
              </CardHeader>
              {reqLoading ? (
                <CardContent className="p-6">
                  <div className="flex items-center justify-center p-8 text-slate-500">Loading requirements...</div>
                </CardContent>
              ) : requirements ? (
                reqOpen && (
                  <CardContent className="p-6 space-y-8">
                    {/* Standard Requirements Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        ["require_resume", "Resume / CV"],
                        ["require_linkedin", "LinkedIn link"],
                        ["require_cover_letter", "Cover letter"],
                        ["require_portfolio", "Portfolio"],
                        ["require_availability", "Availability"],
                        ["require_contact", "Contact info"],
                      ].map(([key, label]) => (
                        <label key={key} className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                          (requirements as any)[key]
                            ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/50"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/30"
                        )}>
                          <div className={cn(
                            "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                            (requirements as any)[key] ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          )}>
                            {(requirements as any)[key] && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={(requirements as any)[key]}
                            onChange={() => setRequirements((p: any) => (p ? { ...p, [key]: !(p as any)[key] } : p))}
                            className="hidden"
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                        </label>
                      ))}
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Custom Questions Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-slate-500" />
                          Custom Questions
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                          <Plus className="h-4 w-4 mr-2" /> Add Question
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {requirements.custom_questions.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                            <p className="text-sm text-slate-500 dark:text-slate-400">No custom questions added yet.</p>
                          </div>
                        )}
                        {requirements.custom_questions.map((q: CustomQuestion) => {
                          const displayedOptions = ensureOptions(q.options);
                          return (
                            <div key={q.id} className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 p-4 space-y-4 group">
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Question Prompt</Label>
                                <Input
                                  value={q.prompt}
                                  onChange={(e) => upsertQuestion(q.id, { prompt: e.target.value })}
                                  placeholder="e.g., Why are you a great fit?"
                                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                                />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label className="text-sm font-medium mb-1 block text-slate-700 dark:text-slate-200">Answer Type</Label>
                                  <Select
                                    value={q.type}
                                    onValueChange={(value) => {
                                      const nextType = value as QuestionType;
                                      const options = nextType === "text" ? [] : ensureOptions(q.options);
                                      upsertQuestion(q.id, { type: nextType, options });
                                    }}
                                  >
                                    <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text answer</SelectItem>
                                      <SelectItem value="dropdown">Dropdown (single select)</SelectItem>
                                      <SelectItem value="multiselect">Multi-select</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {(q.type === "dropdown" || q.type === "multiselect") && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium block text-slate-700 dark:text-slate-200">Options</Label>
                                    <div className="space-y-2">
                                      {displayedOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <Input
                                            value={opt}
                                            onChange={(e) => updateOption(q.id, idx, e.target.value)}
                                            placeholder={`Option ${idx + 1}`}
                                            className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 h-9"
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={displayedOptions.length <= 2}
                                            onClick={() => removeOption(q.id, idx)}
                                            className="h-9 w-9 p-0 text-slate-400 hover:text-red-500"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {q.type === "multiselect"
                                          ? "Applicants can pick more than one."
                                          : "Applicants choose a single option."}
                                      </p>
                                      <Button type="button" variant="ghost" size="sm" onClick={() => addOption(q.id)} className="h-7 text-xs text-primary dark:text-blue-400 hover:text-primary dark:hover:text-white/80 dark:hover:text-blue-300">
                                        <Plus className="h-3 w-3 mr-1" /> Add Option
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )
              ) : (
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground">Requirements unavailable.</div>
                </CardContent>
              )}
            </Card>

            <div className="space-y-4 pt-4 pb-12">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-justify">
                By posting, you confirm this opportunity complies with Ontario&apos;s Employment Standards Act and Human Rights Code. You acknowledge that NxteVia is a technology platform only, not a recruiter or employer, and you are solely responsible for the hiring relationship.
              </p>
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium text-base transition-all hover:scale-[1.02]"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Submit Opportunity
                    </>
                  )}
                </Button>
                <Button type="button" variant="ghost" onClick={() => navigate("/company/dashboard")} className="h-12 px-6 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </Button>
              </div>
            </div>

          </form>
        </div>
      </div>

      <ESAExemptionModal
        open={esaModalOpen}
        onOpenChange={(open) => {
          if (!open && !esaVerified) {
            // If closing without verifying, reset to paid or previous state? 
            // The Select already changed the visual value? 
            // Actually the Select value doesn't change until setValue is called?
            // "value={watch('stipend')}" - so if we don't call setValue, it stays 'paid' (default).
          }
          setEsaModalOpen(open);
        }}
        onVerify={handleESAVerified}
      />
    </Layout >
  );
}
