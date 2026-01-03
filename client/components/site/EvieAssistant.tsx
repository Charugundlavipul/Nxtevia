import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listProjects,
  getProjectById as coreGetProjectById,
} from "@/lib/projects";
import { trackEvent } from "@/lib/analytics";
import { useLocation, useNavigate } from "react-router-dom";
import { X, MessageCircle, ChevronLeft, Bot, HelpCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type Role = "student" | "company" | null;

// Structured categories with FAQs for tree UI
const FAQ_CATEGORIES: { id: string; label: string; roles: Role[]; faqs: { q: string; a: string }[] }[] = [
  {
    id: "general",
    label: "General Questions",
    roles: ["student", "company", null],
    faqs: [
      { q: "What is NxteVia?", a: "A platform for part-time, real-world projects that help you gain verifiable experience and grow your career." },
      { q: "Where is NxteVia available?", a: "United States, India, and Canada." },
      { q: "How long are projects?", a: "Typically 2–8 weeks with 5–20 hours/week." },
      { q: "How do verified completions work?", a: "When a project is marked completed by the organization, NxteVia records a verified completion on your profile and adds a badge if criteria are met." },
    ],
  },
  {
    id: "projects",
    label: "Projects & Applications",
    roles: ["student", null],
    faqs: [
      { q: "How do I apply?", a: "Open a project and click Apply—complete a short form; the organization reviews weekly." },
      { q: "Are projects paid?", a: "Some projects are paid; each posting displays stipend information like 'none', 'micro', or 'modest'." },
      { q: "Can I apply to multiple projects?", a: "Yes—submit separate applications for each project. Organizations review and respond per their timelines." },
      { q: "What happens after I apply?", a: "The organization reviews applications weekly; status updates appear in your dashboard and you may be invited to interview or start." },
    ],
  },
  {
    id: "company",
    label: "For Companies",
    roles: ["company", null],
    faqs: [
      { q: "How do I post an opportunity?", a: "Use the post form from the company dashboard; include title, scope, duration, and skills." },
      { q: "What are verification rules for hires?", a: "Companies can verify completions; admins may moderate and issue badges based on deliverables." },
      { q: "Attachment limits?", a: "Attachments must be under 10MB per file and common formats (pdf, png, jpg)." },
    ],
  },
  {
    id: "support",
    label: "Support",
    roles: ["student", "company", null],
    faqs: [
      { q: "How do I contact support?", a: "Use the 'Create ticket' action on your profile or email support@nxtevia.com for urgent requests." },
      { q: "How long for a ticket response?", a: "Typical response time is 24–72 hours for pending tickets." },
      { q: "I found a bug—how to report?", a: "Choose 'Bug report' category and include steps to reproduce, browser, and screenshots if possible." },
    ],
  },
];

export function EvieAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState<Role>(null);

  // Navigation State
  const [view, setView] = React.useState<"topics" | "questions" | "answer">("topics");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = React.useState<{ q: string; a: string } | null>(null);

  React.useEffect(() => {
    // Get role from local storage/auth state
    const storedRole = localStorage.getItem("eaas_role") as Role;
    setRole(storedRole);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      trackEvent("assistant_opened");
    } else {
      // Reset state on close
      setTimeout(() => {
        setView("topics");
        setSelectedCategory(null);
        setSelectedQuestion(null);
      }, 300);
    }
  }, [open]);

  const navigateToFaq = () => {
    setOpen(false);
    if (role === 'company') {
      navigate('/company/faq');
      return;
    }

    const targetPath = role === 'student' ? '/seekers/home' : '/home';

    if (location.pathname === targetPath) {
      const el = document.getElementById('faq');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(targetPath);
      // Allow navigation to complete then scroll
      setTimeout(() => {
        const el = document.getElementById('faq');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }

  // Filter categories based on role
  const visibleCategories = FAQ_CATEGORIES.filter(cat => {
    if (!role) return true; // Show all for guests/unknown
    return cat.roles.includes(role) || cat.roles.includes(null);
  });

  const currentCategoryData = FAQ_CATEGORIES.find(c => c.id === selectedCategory);

  const handleCategoryClick = (id: string) => {
    setSelectedCategory(id);
    setView("questions");
    trackEvent("evie_category_selected", { category: id });
  };

  const handleQuestionClick = (q: { q: string; a: string }) => {
    setSelectedQuestion(q);
    setView("answer");
    trackEvent("evie_question_selected", { question: q.q });
  };

  const goBack = () => {
    if (view === "answer") {
      setView("questions");
      setSelectedQuestion(null);
    } else if (view === "questions") {
      setView("topics");
      setSelectedCategory(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {open && (
        <div className="pointer-events-auto w-[90vw] max-w-[360px] h-[500px] max-h-[80vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden mb-4 animate-in slide-in-from-bottom-5 fade-in duration-300">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              {view !== "topics" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2 size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={goBack}
                >
                  <ChevronLeft className="size-5" />
                </Button>
              ) : (
                <div className="relative">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Bot className="size-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
                </div>
              )}

              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {view === "topics" && "Hi, I'm Evie 👋"}
                  {view === "questions" && currentCategoryData?.label}
                  {view === "answer" && "Answer"}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {view === "topics" ? "How can I help you today?" : view === "questions" ? "Select a question" : "Here's what I found"}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-900/50">

            {/* TOPICS VIEW */}
            {view === "topics" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    I can help answer your questions about NxteVia. Choose a topic below to get started.
                  </p>
                </div>
                <div className="grid gap-2">
                  {visibleCategories.map((cat, i) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className="flex items-center justify-between w-full p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:scale-[1.02] hover:shadow-sm text-left group"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{cat.label}</span>
                      <ChevronRight className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUESTIONS VIEW */}
            {view === "questions" && currentCategoryData && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-8 duration-300">
                {currentCategoryData.faqs.map((faq, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuestionClick(faq)}
                    className="w-full text-left p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all text-sm text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-indigo-300"
                  >
                    {faq.q}
                  </button>
                ))}
              </div>
            )}

            {/* ANSWER VIEW */}
            {view === "answer" && selectedQuestion && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">
                    {selectedQuestion.q}
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedQuestion.a}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between group bg-white dark:bg-slate-900"
                    onClick={() => setView("questions")}
                  >
                    <span>Back to {currentCategoryData?.label}</span>
                    <ChevronLeft className="size-4 rotate-180 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    onClick={() => setView("topics")}
                  >
                    Start Over
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-center text-slate-500 mb-3">Still have questions?</p>
                  <Button size="sm" variant="secondary" className="w-full" onClick={navigateToFaq}>
                    Browse Full FAQ
                  </Button>
                </div>
              </div>
            )}

          </ScrollArea>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <p className="text-[10px] text-slate-400">Powered by NxteVia Support</p>
          </div>
        </div>
      )}

      {/* Launcher Button */}
      {!open && (
        <button
          aria-label="Open Evie assistant"
          onClick={() => setOpen(true)}
          className="pointer-events-auto size-14 rounded-full bg-[#17048A] hover:bg-[#2A21A5] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20 flex items-center justify-center relative group"
        >
          <span className="sr-only">Open chat</span>
          <HelpCircle className="size-7 animate-in zoom-in duration-300" />

          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-3 bg-green-500"></span>
          </span>
        </button>
      )}
    </div>
  );
}
