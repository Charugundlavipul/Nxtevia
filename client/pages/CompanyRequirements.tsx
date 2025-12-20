import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Linkedin,
  Mail,
  Briefcase,
  Calendar,
  Phone,
  MessageSquare,
  Settings,
  HelpCircle,
  List,
  CheckSquare,
  Type
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type QuestionType = "text" | "dropdown" | "multiselect";

type CustomQuestion = {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
};

interface Prefs {
  user_id?: string;
  require_resume: boolean;
  require_linkedin: boolean;
  require_cover_letter: boolean;
  require_portfolio: boolean;
  require_availability: boolean;
  require_contact: boolean;
  preferred_messaging_method: string;
  custom_questions: CustomQuestion[];
}

const DEFAULT_PREFS: Prefs = {
  require_resume: true,
  require_linkedin: false,
  require_cover_letter: false,
  require_portfolio: false,
  require_availability: false,
  require_contact: false,
  preferred_messaging_method: "messaging",
  custom_questions: [],
};

const newQuestion = (): CustomQuestion => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random()),
  prompt: "",
  type: "text",
  options: [],
});

export default function CompanyRequirements() {
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = React.useState(false);

  const toggle = (key: keyof Prefs) =>
    setPrefs((p) => ({ ...p, [key]: typeof p[key] === "boolean" ? !p[key] : p[key] }));

  const upsertQuestion = (id: string, changes: Partial<CustomQuestion>) =>
    setPrefs((p) => ({
      ...p,
      custom_questions: p.custom_questions.map((q) => (q.id === id ? { ...q, ...changes } : q)),
    }));

  const ensureOptions = (opts: string[]) => {
    const next = opts.filter(Boolean);
    if (next.length >= 2) return next;
    if (next.length === 1) return [...next, "Option 2"];
    return ["Option 1", "Option 2"];
  };

  const addQuestion = () => setPrefs((p) => ({ ...p, custom_questions: [...p.custom_questions, newQuestion()] }));
  const removeQuestion = (id: string) =>
    setPrefs((p) => ({ ...p, custom_questions: p.custom_questions.filter((q) => q.id !== id) }));

  const addOption = (questionId: string) => {
    setPrefs((p) => ({
      ...p,
      custom_questions: p.custom_questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] } : q,
      ),
    }));
  };

  const updateOption = (questionId: string, idx: number, value: string) => {
    setPrefs((p) => ({
      ...p,
      custom_questions: p.custom_questions.map((q) =>
        q.id === questionId
          ? {
            ...q,
            options: q.options.map((opt, i) => (i === idx ? value : opt)),
          }
          : q,
      ),
    }));
  };

  const removeOption = (questionId: string, idx: number) => {
    setPrefs((p) => ({
      ...p,
      custom_questions: p.custom_questions.map((q) => {
        if (q.id !== questionId) return q;
        const next = q.options.filter((_, i) => i !== idx);
        return { ...q, options: ensureOptions(next) };
      }),
    }));
  };

  React.useEffect(() => {
    const userId =
      (typeof window !== "undefined" && localStorage.getItem("eaas_user_id")) ||
      undefined;
    if (!userId) return;
    const load = async () => {
      try {
        const storedRaw = localStorage.getItem("company_prefs");
        const storedPrefs: Partial<Prefs> | null = storedRaw ? JSON.parse(storedRaw) : null;

        const { data: payload, error } = await supabase
          .from("company_requirements")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        const legacyQuestion =
          storedPrefs && (storedPrefs as any).custom_question
            ? [
              {
                ...newQuestion(),
                prompt: (storedPrefs as any).custom_question,
                type: "text",
                options: [],
              } as CustomQuestion,
            ]
            : [];

        const sourceQuestions =
          payload?.custom_questions?.length
            ? payload.custom_questions
            : storedPrefs?.custom_questions?.length
              ? storedPrefs.custom_questions
              : legacyQuestion;
        const normalizedQuestions = (sourceQuestions ?? []).map((q: any) =>
          q.type === "text" ? { ...q, options: [] } : { ...q, options: ensureOptions(q.options || []) },
        );

        setPrefs({
          ...DEFAULT_PREFS,
          ...storedPrefs,
          ...(payload || {}), // payload form DB takes precedence over defaults, but maybe not local storage if local is "newer"? usually DB wins on load.
          custom_questions: normalizedQuestions,
          user_id: userId,
        } as Prefs); // Cast because payload might not match exactly or have extra fields
      } catch (err) {
        // console.error(err);
        setPrefs((p) => ({ ...p, user_id: userId }));
      }
    };
    load();
  }, []);

  const save = async () => {
    const user_id =
      prefs.user_id ||
      (typeof window !== "undefined" ? localStorage.getItem("eaas_user_id") || undefined : undefined);
    if (!user_id) {
      toast({ title: "Sign in required", description: "Please sign in again to save requirements.", duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      const payload = { ...prefs, user_id };
      localStorage.setItem("company_prefs", JSON.stringify(payload));

      const { error } = await supabase
        .from("company_requirements")
        .upsert(
          {
            ...payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        throw new Error(error.message || "Could not save requirements");
      }
      toast({ title: "Saved", description: "Requirements updated." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unexpected error",
        duration: 3500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Seo title="Application Requirements – NxteVia" canonical={typeof window !== "undefined" ? window.location.href : ""} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/5 dark:from-primary/10 to-transparent pointer-events-none" />

        <section className="container py-12 max-w-4xl relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary dark:text-primary" />
              Application Requirements
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
              Configure what applicants need to submit for your opportunities.
            </p>
          </div>

          <div className="grid gap-8">
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary dark:text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Standard Requirements</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Select the documents and information you need from every applicant.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                    prefs.require_resume
                      ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/50"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/50"
                  )} onClick={() => toggle("require_resume")}>
                    <div className={cn(
                      "mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      prefs.require_resume ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    )}>
                      {prefs.require_resume && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Resume / CV
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF upload required. Accepted formats: .pdf, .docx</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                    prefs.require_linkedin
                      ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/50"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/50"
                  )} onClick={() => toggle("require_linkedin")}>
                    <div className={cn(
                      "mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      prefs.require_linkedin ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    )}>
                      {prefs.require_linkedin && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        LinkedIn Profile
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Require applicants to provide their LinkedIn URL.</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                    prefs.require_cover_letter
                      ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/50"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/50"
                  )} onClick={() => toggle("require_cover_letter")}>
                    <div className={cn(
                      "mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      prefs.require_cover_letter ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    )}>
                      {prefs.require_cover_letter && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Cover Letter
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Short motivation statement explaining why they fit.</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                    prefs.require_portfolio
                      ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/50"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/50"
                  )} onClick={() => toggle("require_portfolio")}>
                    <div className={cn(
                      "mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      prefs.require_portfolio ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    )}>
                      {prefs.require_portfolio && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Portfolio
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Links to previous work, GitHub, or personal website.</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                    prefs.require_availability
                      ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/50"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/50"
                  )} onClick={() => toggle("require_availability")}>
                    <div className={cn(
                      "mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      prefs.require_availability ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    )}>
                      {prefs.require_availability && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Start Date
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">When they can start working.</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                    prefs.require_contact
                      ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/50"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/50"
                  )} onClick={() => toggle("require_contact")}>
                    <div className={cn(
                      "mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      prefs.require_contact ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    )}>
                      {prefs.require_contact && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Contact Info
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Phone number or alternative email.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <Label className="font-medium mb-3 block text-slate-900 dark:text-white">Preferred Communication Method</Label>
                  <div className="max-w-md">
                    <Select
                      value={prefs.preferred_messaging_method}
                      onValueChange={(value) => setPrefs((p) => ({ ...p, preferred_messaging_method: value }))}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Select messaging method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="messaging">Messaging (NxteVia)</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Choose how applicants should contact you regarding opportunities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Custom Questions</CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400">Add specific questions for your candidates.</CardDescription>
                    </div>
                  </div>
                  <Button onClick={addQuestion} className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" /> Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {prefs.custom_questions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-full inline-flex mb-3 shadow-sm">
                      <HelpCircle className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-white">No custom questions yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      Create questions to screen candidates effectively. You can choose text, dropdown, or multi-select formats.
                    </p>
                    <Button variant="outline" onClick={addQuestion} className="mt-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                      Create First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {prefs.custom_questions.map((q, index) => {
                      const displayedOptions = ensureOptions(q.options);
                      return (
                        <div key={q.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20 dark:hover:border-primary/50">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => removeQuestion(q.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mb-4 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Question Configuration</span>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium mb-1.5 block text-slate-900 dark:text-white">Question Prompt</Label>
                              <Input
                                value={q.prompt}
                                onChange={(e) => upsertQuestion(q.id, { prompt: e.target.value })}
                                placeholder="e.g., Why are you a great fit for this role?"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                              />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                              <div>
                                <Label className="text-sm font-medium mb-1.5 block text-slate-900 dark:text-white">Answer Type</Label>
                                <Select
                                  value={q.type}
                                  onValueChange={(value) => {
                                    const nextType = value as QuestionType;
                                    const options =
                                      nextType === "text" ? [] : ensureOptions(q.options.length ? q.options : ["Option 1", "Option 2"]);
                                    upsertQuestion(q.id, { type: nextType, options });
                                  }}
                                >
                                  <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">
                                      <div className="flex items-center gap-2">
                                        <Type className="h-4 w-4 text-slate-400" />
                                        <span>Text Answer</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="dropdown">
                                      <div className="flex items-center gap-2">
                                        <List className="h-4 w-4 text-slate-400" />
                                        <span>Dropdown (Single Select)</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="multiselect">
                                      <div className="flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4 text-slate-400" />
                                        <span>Multi-select Checkboxes</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {(q.type === "dropdown" || q.type === "multiselect") && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-900 dark:text-white">Options</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => addOption(q.id)} className="h-7 text-xs text-primary dark:text-primary hover:text-primary/80 dark:hover:text-primary/70">
                                      <Plus className="h-3 w-3 mr-1" /> Add Option
                                    </Button>
                                  </div>
                                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    {displayedOptions.map((opt, idx) => (
                                      <div key={idx} className="flex items-center gap-2 group/option">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                        <Input
                                          value={opt}
                                          onChange={(e) => updateOption(q.id, idx, e.target.value)}
                                          placeholder={`Option ${idx + 1}`}
                                          className="h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 text-slate-400 hover:text-red-500 opacity-0 group-hover/option:opacity-100 transition-opacity"
                                          disabled={displayedOptions.length <= 2}
                                          onClick={() => removeOption(q.id, idx)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {q.type === "multiselect"
                                      ? "Applicants can select multiple options."
                                      : "Applicants must choose exactly one option."}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4 sticky bottom-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg z-20">
              <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                Changes apply to all future job postings.
              </p>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 min-w-[160px]"
                onClick={save}
                disabled={loading}
              >
                {loading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Save Requirements
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
