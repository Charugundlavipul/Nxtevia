import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SkillsCombobox } from "@/components/site/SkillsCombobox";
import { fetchCompanyRequirements } from "@/lib/companyRequirements";
import { fetchOpportunityForOwner, updateOpportunity } from "@/lib/opportunities";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SelectItem as UISelectItem } from "@/components/ui/select";
import { ArrowLeft, Save, X, Plus, Trash2, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ESAExemptionModal } from "@/components/modals/ESAExemptionModal";
import { createAttestation, ATTESTATION_TYPES } from "@/lib/attestations";

type QuestionType = "text" | "dropdown" | "multiselect";
type CustomQuestion = { id: string; prompt: string; type: QuestionType; options: string[] };

interface RequirementsState {
  require_resume: boolean;
  require_linkedin: boolean;
  require_cover_letter: boolean;
  require_portfolio: boolean;
  require_availability: boolean;
  require_contact: boolean;
  preferred_messaging_method: string;
  custom_questions: CustomQuestion[];
}

interface EditValues {
  modality: "remote" | "hybrid" | "on-site";
  title: string;
  problem: string;
  scope: string;
  duration: "0-3m" | "4-6m" | "7-9m" | "10-12m" | ">12m";
  hours: "5-10" | "10-20" | "20+" | string;
  stipend: "paid" | "unpaid";
  pay_amount: number;
  currency: string;
  pay_type: "hourly" | "fixed" | "annually";
  skills: string;
}

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

export default function CompanyEditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requirements, setRequirements] = React.useState<RequirementsState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reqOpen, setReqOpen] = React.useState(true);

  const [esaModalOpen, setEsaModalOpen] = React.useState(false);
  const [esaVerified, setEsaVerified] = React.useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EditValues>({
    defaultValues: {
      title: "",
      problem: "",
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

  React.useEffect(() => {
    const load = async () => {
      try {
        const job = id ? await fetchOpportunityForOwner(id) : null;
        if (!job) {
          toast({ title: "Not found", description: "Opportunity not found.", duration: 2000 });
          navigate("/company/dashboard", { replace: true });
          return;
        }
        reset({
          title: job.title,
          problem: job.problem,
          scope: job.scope,
          skills: (job.skills || []).join(", "),
          modality: job.modality as any,
          duration: job.duration as any,
          hours: job.hours as any,
          stipend: (job.stipend === "none" ? "unpaid" : job.stipend) as any,
          pay_amount: job.pay_amount || 0,
          currency: job.currency || "USD",
          pay_type: (job.pay_type || "hourly") as any,
        });
        const baseReq = await fetchCompanyRequirements().catch(() => null);
        const req = { ...(baseReq || {}), ...(job.requirements || {}) } as RequirementsState;
        req.custom_questions = (req.custom_questions || []).map((q: any) =>
          q.type === "text" ? { ...q, options: [] } : { ...q, options: ensureOptions(q.options || []) },
        );
        setRequirements(req);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, reset]);

  const upsertQuestion = (id: string, changes: Partial<CustomQuestion>) =>
    setRequirements((p) =>
      !p ? p : { ...p, custom_questions: p.custom_questions.map((q) => (q.id === id ? { ...q, ...changes } : q)) },
    );
  const addQuestion = () => setRequirements((p) => (!p ? p : { ...p, custom_questions: [...p.custom_questions, newQuestion()] }));
  const removeQuestion = (id: string) =>
    setRequirements((p) => (!p ? p : { ...p, custom_questions: p.custom_questions.filter((q) => q.id !== id) }));
  const addOption = (qid: string) =>
    setRequirements((p) =>
      !p
        ? p
        : {
          ...p,
          custom_questions: p.custom_questions.map((q) =>
            q.id === qid ? { ...q, options: [...ensureOptions(q.options), `Option ${q.options.length + 1}`] } : q,
          ),
        },
    );
  const updateOption = (qid: string, idx: number, val: string) =>
    setRequirements((p) =>
      !p
        ? p
        : {
          ...p,
          custom_questions: p.custom_questions.map((q) =>
            q.id === qid ? { ...q, options: q.options.map((o, i) => (i === idx ? val : o)) } : q,
          ),
        },
    );
  const removeOption = (qid: string, idx: number) =>
    setRequirements((p) =>
      !p
        ? p
        : {
          ...p,
          custom_questions: p.custom_questions.map((q) => {
            if (q.id !== qid) return q;
            const next = q.options.filter((_, i) => i !== idx);
            return { ...q, options: ensureOptions(next) };
          }),
        },
    );

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

  const onSubmit = async (values: EditValues) => {
    if (!requirements) return;
    const skills = values.skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skills.length < 1) {
      toast({ title: "Add skills", description: "Please add at least one skill.", duration: 2000 });
      return;
    }
    try {
      await updateOpportunity(
        id!,
        {
          title: values.title,
          problem: values.problem,
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
          status: "pending",
        } as any,
        { action: "resubmitted", note: "Edited by company" },
      );

      if (values.stipend === "unpaid" && id) {
        await createAttestation(id, ATTESTATION_TYPES.ESA_STUDENT_EXEMPTION, "v1.0 (Placeholder Text)");
      }

      toast({ title: "Resubmitted", description: "Updated and sent for review.", duration: 2000 });
      navigate(`/company/jobs/${id}`, { replace: true });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unexpected error", duration: 2500 });
    }
  };

  return (
    <Layout>
      <Seo title="Edit Opportunity" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 py-12">
        <div className="container max-w-4xl space-y-8">

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link to={`/company/jobs/${id}`} className="hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Job
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">Edit Opportunity</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Opportunity</h1>
            <p className="text-slate-500">Update job details and resubmit for approval.</p>
          </div>

          {loading || !requirements ? (
            <div className="h-64 bg-white rounded-xl shadow-sm animate-pulse" />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

              <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900">Opportunity Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Modality</Label>
                      <Select value={watch("modality")} onValueChange={(v) => setValue("modality", v as any)}>
                        <SelectTrigger className="bg-white border-slate-200">
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
                      <Label className="text-sm font-semibold text-slate-700">Opportunity Title</Label>
                      <Input {...register("title", { required: true })} placeholder="e.g. Design an onboarding microsite" className="bg-white border-slate-200" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Desired Outcome (Problem Statement)</Label>
                      <Textarea rows={4} {...register("problem", { required: true })} placeholder="What outcome do you want to achieve?" className="bg-white border-slate-200 resize-none" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Scope of Work</Label>
                      <Textarea rows={4} {...register("scope", { required: true })} placeholder="Describe milestones, acceptance criteria, and final outputs" className="bg-white border-slate-200 resize-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Duration</Label>
                      <Select value={watch("duration")} onValueChange={(v) => setValue("duration", v as any)}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-3m">0–3 months</SelectItem>
                          <SelectItem value="4-6m">4–6 months</SelectItem>
                          <SelectItem value="7-9m">7–9 months</SelectItem>
                          <SelectItem value="10-12m">10–12 months</SelectItem>
                          <SelectItem value=">12m">More than 12 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Hours / Week</Label>
                      <Select value={watch("hours")} onValueChange={(v) => setValue("hours", v as any)}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Hours/week" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5-10">5–10</SelectItem>
                          <SelectItem value="10-20">10–20</SelectItem>
                          <SelectItem value="20+">20+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Compensation</Label>
                        <Select
                          value={watch("stipend")}
                          onValueChange={handleStipendChange}
                        >
                          <SelectTrigger className="bg-white border-slate-200">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="unpaid">Unpaid (Pro-bono/Academic)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {watch("stipend") === "paid" && (
                        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="col-span-1 space-y-2">
                            <Label className="text-xs font-medium text-slate-500">Amount</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...register("pay_amount", { required: watch("stipend") === "paid", min: 0 })}
                              className="bg-white"
                            />
                          </div>
                          <div className="col-span-1 space-y-2">
                            <Label className="text-xs font-medium text-slate-500">Currency</Label>
                            <Select value={watch("currency")} onValueChange={(v) => setValue("currency", v)}>
                              <SelectTrigger className="bg-white">
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
                              <SelectTrigger className="bg-white">
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
                      <Label className="text-sm font-semibold text-slate-700">Skills (comma-separated)</Label>
                      <SkillsCombobox selected={watch("skills").split(",").map((s) => s.trim()).filter(Boolean)} onChange={(arr) => setValue("skills", arr.join(", "))} placeholder="e.g., Customer Success Management, UX Design" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900">Application Requirements</CardTitle>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setReqOpen((v) => !v)} className="text-slate-500">
                    {reqOpen ? "Hide" : "Show"}
                  </Button>
                </CardHeader>
                {reqOpen && (
                  <CardContent className="p-6 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        ["require_resume", "Resume / CV"],
                        ["require_linkedin", "LinkedIn link"],
                        ["require_cover_letter", "Cover letter"],
                        ["require_portfolio", "Portfolio"],
                        ["require_availability", "Availability"],
                        ["require_contact", "Contact info"],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-3 text-sm p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                            checked={(requirements as any)[key]}
                            onChange={() => setRequirements((p) => (p ? { ...p, [key]: !(p as any)[key] } as any : p))}
                          />
                          <span className="font-medium text-slate-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-slate-500" />
                          Custom Questions
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="bg-white border-slate-200">
                          <Plus className="h-4 w-4 mr-2" /> Add Question
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {requirements.custom_questions.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <p className="text-sm text-slate-500">No custom questions added yet.</p>
                          </div>
                        )}
                        {requirements.custom_questions.map((q) => {
                          const displayedOptions = ensureOptions(q.options);
                          return (
                            <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50/30 p-4 space-y-4 relative group">
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Question Prompt</Label>
                                <Input
                                  value={q.prompt}
                                  onChange={(e) => upsertQuestion(q.id, { prompt: e.target.value })}
                                  placeholder="e.g., Why are you a great fit for this role?"
                                  className="bg-white border-slate-200"
                                />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-slate-700">Answer Type</Label>
                                  <Select
                                    value={q.type}
                                    onValueChange={(value) => {
                                      const nextType = value as QuestionType;
                                      const options = nextType === "text" ? [] : ensureOptions(q.options);
                                      upsertQuestion(q.id, { type: nextType, options });
                                    }}
                                  >
                                    <SelectTrigger className="bg-white border-slate-200">
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
                                    <Label className="text-sm font-medium text-slate-700">Options</Label>
                                    <div className="space-y-2">
                                      {displayedOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <Input
                                            value={opt}
                                            onChange={(e) => updateOption(q.id, idx, e.target.value)}
                                            placeholder={`Option ${idx + 1}`}
                                            className="bg-white border-slate-200 h-9 text-sm"
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
                                      <p className="text-xs text-slate-500">
                                        {q.type === "multiselect" ? "Applicants can pick multiple." : "Applicants pick one."}
                                      </p>
                                      <Button type="button" variant="ghost" size="sm" onClick={() => addOption(q.id)} className="text-primary hover:text-primary dark:hover:text-white hover:bg-primary/10 h-8 text-xs">
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
                )}
              </Card>

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium text-base transition-all hover:scale-[1.02]">
                  <Save className="mr-2 h-4 w-4" /> Save & Resubmit
                </Button>
                <Button type="button" variant="ghost" onClick={() => navigate(`/company/jobs/${id}`)} className="h-12 px-6 rounded-xl text-slate-600 hover:bg-slate-100">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      <ESAExemptionModal
        open={esaModalOpen}
        onOpenChange={(open) => {
          if (!open && !esaVerified) { }
          setEsaModalOpen(open);
        }}
        onVerify={handleESAVerified}
      />
    </Layout>
  );
}
