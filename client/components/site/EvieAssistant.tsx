import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listProjects,
  getProjectById as coreGetProjectById,
} from "@/lib/projects";
import { trackEvent } from "@/lib/analytics";
import { useLocation } from "react-router-dom";

// Intent types from spec
type Intent =
  | "find_projects"
  | "apply_project"
  | "post_opportunity"
  | "faq"
  | "contact_support"
  | "small_talk";

// Entity extraction result
interface Entities {
  skills?: string[];
  country?: "US" | "IN" | "CA";
  work_mode?: "remote" | "hybrid" | "on_site";
  duration_weeks_max?: number;
}

// Data contracts (subset mapped from UiProject)
interface Project {
  id: string;
  title: string;
  organization: string;
  country: "US" | "IN" | "CA";
  city?: string;
  work_mode: "remote" | "hybrid" | "on-site";
  duration_weeks: number;
  hours_per_week: string;
  skills: string[];
  summary: string;
  outcomes: string;
  scope: string;
  stipend: "none" | "micro" | "modest";
  apply_url: string;
}

interface EmployerSubmissionSink {
  org_name: string;
  website?: string;
  country: "US" | "IN" | "CA";
  state?: string;
  city?: string;
  postal_code?: string;
  contact_email: string;
  modality: "remote" | "hybrid" | "on-site";
  title: string;
  desired_outcome: string;
  scope: string;
  duration: string;
  hours_per_week: string;
  stipend: string;
  skills_csv: string;
}

interface CompanyRequirements {
  company_id: string;
  require_resume: boolean;
  require_linkedin: boolean;
  require_cover_letter: boolean;
  require_portfolio: boolean;
  require_availability: boolean;
  custom_question?: string;
}

// Structured categories with FAQs for tree UI
const FAQ_CATEGORIES: { id: string; label: string; faqs: { q: string; a: string }[] }[] = [
  {
    id: "general",
    label: "General",
    faqs: [
      { q: "What is NxteVia?", a: "A platform for part-time, real-world projects that help you gain verifiable experience and grow your career." },
      { q: "Where is NxteVia available?", a: "United States, India, and Canada." },
      { q: "How long are projects?", a: "Typically 2–8 weeks with 5–20 hours/week." },
      { q: "How do I apply?", a: "Open a project and click Apply—complete a short form; the organization reviews weekly." },
      { q: "How do verified completions work?", a: "When a project is marked completed by the organization, NxteVia records a verified completion on your profile and adds a badge if criteria are met." },
    ],
  },
  {
    id: "projects",
    label: "Projects & Applications",
    faqs: [
      { q: "Are projects paid?", a: "Some projects are paid; each posting displays stipend information like 'none', 'micro', or 'modest'." },
      { q: "Can I apply to multiple projects?", a: "Yes—submit separate applications for each project. Organizations review and respond per their timelines." },
      { q: "What happens after I apply?", a: "The organization reviews applications weekly; status updates appear in your dashboard and you may be invited to interview or start." },
    ],
  },
  {
    id: "company",
    label: "For Companies",
    faqs: [
      { q: "How do I post an opportunity?", a: "Use the post form from the company dashboard; include title, scope, duration, and skills." },
      { q: "What are verification rules for hires?", a: "Companies can verify completions; admins may moderate and issue badges based on deliverables." },
      { q: "Attachment limits?", a: "Attachments must be under 10MB per file and common formats (pdf, png, jpg)." },
    ],
  },
  {
    id: "support",
    label: "Support",
    faqs: [
      { q: "How do I contact support?", a: "Use the 'Create ticket' action on your profile or email support@nxtevia.com for urgent requests." },
      { q: "How long for a ticket response?", a: "Typical response time is 24–72 hours for pending tickets." },
      { q: "I found a bug—how to report?", a: "Choose 'Bug report' category and include steps to reproduce, browser, and screenshots if possible." },
    ],
  },
];

function faqLookup(question: string): { q: string; a: string } | null {
  const s = question.toLowerCase();
  for (const cat of FAQ_CATEGORIES) {
    const exact = cat.faqs.find((f) => f.q.toLowerCase() === s);
    if (exact) return exact;
    const fuzzy = cat.faqs.find((f) => s.includes(f.q.toLowerCase().split(" ")[0]!));
    if (fuzzy) return fuzzy;
  }
  return null;
}

// Functions (mocked client-side per spec)
function searchProjects(filters: Entities): Project[] {
  let items = listProjects();
  if (filters.country)
    items = items.filter((p) => p.country === filters.country);
  if (filters.work_mode)
    items = items.filter(
      (p) => p.modality.replace("on-site", "on_site") === filters.work_mode,
    );
  if (typeof filters.duration_weeks_max === "number")
    items = items.filter((p) => p.durationWeeks <= filters.duration_weeks_max!);
  if (filters.skills && filters.skills.length) {
    const sset = new Set(filters.skills.map((s) => s.toLowerCase()));
    items = items.filter((p) =>
      p.skills.some((x) => sset.has(x.toLowerCase())),
    );
  }
  return items.slice(0, 5).map(toContractProject);
}

function getProjectById(id: string): Project | null {
  const p = coreGetProjectById(id);
  return p ? toContractProject(p) : null;
}

function createOpportunitySubmission(payload: EmployerSubmissionSink): {
  id: string;
  status: "draft" | "review";
} {
  // Client-side mock sink; return review to indicate moderation
  const id = `sub_${Date.now()}`;
  void payload; // no-op
  return { id, status: "review" };
}

function getCompanyRequirements(companyId: string): CompanyRequirements | null {
  // Default requirements when no org-specific policy is known
  if (!companyId) return null;
  return {
    company_id: companyId,
    require_resume: true,
    require_linkedin: true,
    require_cover_letter: false,
    require_portfolio: true,
    require_availability: true,
    custom_question: "Describe a similar project you’ve done (100 words).",
  };
}


function openUrl(url: string): void {
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    window.location.assign(url);
  }
}

function toContractProject(
  p: ReturnType<typeof listProjects>[number],
): Project {
  return {
    id: p.id,
    title: p.title,
    organization: p.org,
    country: p.country,
    work_mode: p.modality,
    duration_weeks: p.durationWeeks,
    hours_per_week: p.hoursPerWeek,
    skills: p.skills,
    summary: p.summary,
    outcomes: p.outcomes,
    scope: p.scope,
    stipend: p.stipend,
    apply_url: p.applyUrl,
  };
}

// Helpers: intent + entity parsing
function parseIntent(text: string): Intent {
  const s = text.toLowerCase();
  if (/(post|hire|opportunit(y|ies) for my company|employer)/.test(s))
    return "post_opportunity";
  if (/(apply|submit|application)/.test(s)) return "apply_project";
  if (/(contact|support|email)/.test(s)) return "contact_support";
  if (
    /\b(react|python|design|sql|pwa|remote|hybrid|on[- ]?site|india|canada|united states|us|in|ca|weeks?)\b/.test(
      s,
    )
  )
    return "find_projects";
  if (/(what|how|faq|paid|duration|available|works?)/.test(s)) return "faq";
  return "small_talk";
}

function extractEntities(text: string): Entities {
  const s = text.toLowerCase();
  const country = /\b(canada|ca)\b/.test(s)
    ? "CA"
    : /\b(india|in)\b/.test(s)
      ? "IN"
      : /\b(united states|usa|us)\b/.test(s)
        ? "US"
        : undefined;
  const work_mode = /on[- ]?site/.test(s)
    ? "on_site"
    : /hybrid/.test(s)
      ? "hybrid"
      : /remote/.test(s)
        ? "remote"
        : undefined;
  const dur = s.match(/(under|less than|≤|<=)?\s*(\d+)\s*weeks?/);
  const duration_weeks_max = dur
    ? parseInt(dur[2] || dur[1] || "", 10)
    : undefined;
  const tokens = Array.from(
    new Set(s.split(/[^a-z0-9+.#]/).filter((w) => w.length > 1)),
  );
  const allSkills = new Set(
    listProjects().flatMap((p) => p.skills.map((x) => x.toLowerCase())),
  );
  const skills = tokens.filter((t) => allSkills.has(t));
  return {
    country,
    work_mode,
    duration_weeks_max,
    skills: skills.length ? skills : undefined,
  };
}

// Messages
type Msg = { id: string; role: "user" | "assistant"; content: React.ReactNode };

export function EvieAssistant() {
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [category, setCategory] = React.useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = React.useState<{ q: string; a: string } | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const lastResults = React.useRef<Project[] | null>(null);
  const [msgs, setMsgs] = React.useState<Msg[]>([
    {
      id: "hello",
      role: "assistant",
      content: (
        <div className="space-y-1">
          <div className="font-semibold">Hi, I’m Evie</div>
          <div className="text-sm text-muted-foreground">
            Choose a category and pick a question — I’ll show a standard answer.
          </div>
        </div>
      ),
    },
  ]);

  React.useEffect(() => {
    if (open) trackEvent("assistant_opened");
  }, [open]);

  const scrollToEnd = () => {
    requestAnimationFrame(() =>
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      }),
    );
  };

  function renderResults(list: Project[], filters: Entities) {
    const labelParts: string[] = [];
    if (filters.work_mode) labelParts.push(filters.work_mode.replace("_", " "));
    if (typeof filters.duration_weeks_max === "number")
      labelParts.push(`≤ ${filters.duration_weeks_max} weeks`);
    if (filters.country) labelParts.push(filters.country);
    const header = labelParts.length
      ? `Here’s what matches your filters (${labelParts.join(", ")})`
      : `Here are some opportunities you might like`;
    return (
      <div className="space-y-3">
        <div className="text-sm mb-1">{header}:</div>
        {list.length === 0 ? (
          <div className="text-sm">
            I couldn’t find matches. Try changing filters or exploring remote
            roles.
          </div>
        ) : (
          list.map((p) => (
            <Card key={p.id} className="shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="font-semibold line-clamp-1">
                  {p.title} — {p.organization}
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  <Badge variant="outline">{p.work_mode}</Badge>
                  <Badge variant="outline">{p.duration_weeks} weeks</Badge>
                  {p.skills.slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="rounded-lg"
                    aria-label={`Apply to ${p.title}`}
                    onClick={() => {
                      trackEvent("project_apply_clicked", { projectId: p.id });
                      openUrl(`${p.apply_url}?utm=nxtevia&src=assistant`);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    aria-label="View details"
                    onClick={() => openUrl(`/opportunities/${p.id}`)}
                  >
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        <div className="text-xs text-muted-foreground">
          Want more results or change filters?
        </div>
      </div>
    );
  }

  function renderProjectSummary(p: Project) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-2">
          <div className="font-semibold">
            {p.title} — {p.organization}
          </div>
          <div className="text-xs text-muted-foreground">
            Location/Mode: {p.country} · {p.work_mode}
          </div>
          <div className="text-xs text-muted-foreground">
            Time: {p.duration_weeks} weeks · {p.hours_per_week}
          </div>
          <div className="text-sm">What you’ll do: {p.summary}</div>
          <div className="text-sm">Outcome: {p.outcomes}</div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              aria-label="Apply now"
              onClick={() => {
                trackEvent("project_apply_clicked", { projectId: p.id });
                openUrl(`${p.apply_url}?utm=nxtevia&src=assistant`);
              }}
            >
              Apply now
            </Button>
            {lastResults.current && lastResults.current.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                aria-label="Back to results"
                onClick={() =>
                  setMsgs((m) => [
                    ...m,
                    {
                      id: String(Date.now()) + "b",
                      role: "assistant",
                      content: renderResults(lastResults.current!, {}),
                    },
                  ])
                }
              >
                Back to results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderEmployerGuide() {
    return (
      <div className="text-sm">
        <div className="font-semibold mb-1">
          Great—let’s post your opportunity. You’ll need:
        </div>
        <ul className="list-disc pl-5 mb-2">
          <li>Title, country, city, modality</li>
          <li>Desired outcome & scope (milestones, acceptance criteria)</li>
          <li>Duration & hours/week</li>
          <li>Skills (comma-separated)</li>
          <li>Contact email & website (optional)</li>
        </ul>
        <Button
          asChild
          className="h-10 rounded-xl"
          aria-label="Open Post Form"
          onClick={() => trackEvent("post_opportunity_cta_clicked")}
        >
          <a href="/company/post-opportunity">Open Post Form</a>
        </Button>
      </div>
    );
  }

  function renderFAQAnswer(faq: { q: string; a: string }) {
    return (
      <div className="text-sm">
        <div className="font-semibold">{faq.q}</div>
        <div className="mb-2">{faq.a}</div>
        <Button asChild size="sm" variant="outline" aria-label="Open full FAQ">
          <a href="/#faq">Open full FAQ</a>
        </Button>
      </div>
    );
  }

  function renderHandoff() {
    return (
      <div className="text-sm">
        I might not have that info yet. Want personal help?
        <div className="mt-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            aria-label="Email support"
          >
            <a href="mailto:support@nxtevia.com">Email support</a>
          </Button>
        </div>
      </div>
    );
  }

  const ask = (text: string) => {
    const id = String(Date.now());
    setMsgs((m) => [...m, { id: id + "u", role: "user", content: text }]);

    const intent = parseIntent(text);
    const entities = extractEntities(text);
    trackEvent("intent_resolved", { intent });

    // APPLY on current project page
    if (intent === "apply_project") {
      const match = location.pathname.match(/^\/opportunities\/(\w+)/);
      const p = match ? getProjectById(match[1]!) : null;
      if (p) {
        setMsgs((m) => [
          ...m,
          { id: id + "a", role: "assistant", content: renderProjectSummary(p) },
        ]);
        scrollToEnd();
        return;
      }
      // no context – prompt to browse
      setMsgs((m) => [
        ...m,
        {
          id: id + "a",
          role: "assistant",
          content: (
            <div className="text-sm">
              Open a project to apply, or browse options below.
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  className="rounded-lg"
                  onClick={() => ask("show projects")}
                >
                  Browse projects
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => ask("remote projects under 4 weeks")}
                >
                  Quick search
                </Button>
              </div>
            </div>
          ),
        },
      ]);
      scrollToEnd();
      return;
    }

    if (intent === "post_opportunity") {
      setMsgs((m) => [
        ...m,
        { id: id + "a", role: "assistant", content: renderEmployerGuide() },
      ]);
      scrollToEnd();
      return;
    }

    if (intent === "find_projects") {
      const results = searchProjects(entities);
      lastResults.current = results;
      setMsgs((m) => [
        ...m,
        {
          id: id + "a",
          role: "assistant",
          content: renderResults(results, entities),
        },
      ]);
      scrollToEnd();
      return;
    }

    if (intent === "faq") {
      // Special-company requirements
      if (
        /(require|need).*(resume|linkedin|portfolio|cover|submit)/.test(
          text.toLowerCase(),
        )
      ) {
        const req = getCompanyRequirements("org_default");
        if (req) {
          trackEvent("faq_viewed", { topic: "requirements" });
          setMsgs((m) => [
            ...m,
            {
              id: id + "a",
              role: "assistant",
              content: (
                <div className="text-sm">
                  <div className="font-semibold mb-1">
                    Typical application requirements
                  </div>
                  <ul className="list-disc pl-5 mb-2">
                    <li>
                      Resume: {req.require_resume ? "Required" : "Optional"}
                    </li>
                    <li>
                      LinkedIn: {req.require_linkedin ? "Required" : "Optional"}
                    </li>
                    <li>
                      Portfolio:{" "}
                      {req.require_portfolio ? "Required" : "Optional"}
                    </li>
                    <li>
                      Availability:{" "}
                      {req.require_availability ? "Required" : "Optional"}
                    </li>
                    {req.custom_question && (
                      <li>Question: {req.custom_question}</li>
                    )}
                  </ul>
                  <Button asChild size="sm" variant="outline">
                    <a href="/faq">Open full FAQ</a>
                  </Button>
                </div>
              ),
            },
          ]);
          scrollToEnd();
          return;
        }
      }

      const f = faqLookup(text) || {
        q: "FAQ",
        a: "I can share how NxteVia works, regions, and timelines.",
      };
      trackEvent("faq_viewed", { topic: f.q });
      setMsgs((m) => [
        ...m,
        { id: id + "a", role: "assistant", content: renderFAQAnswer(f) },
      ]);
      scrollToEnd();
      return;
    }

    if (intent === "contact_support") {
      trackEvent("handoff_triggered");
      setMsgs((m) => [
        ...m,
        { id: id + "a", role: "assistant", content: renderHandoff() },
      ]);
      scrollToEnd();
      return;
    }

    // small talk / default deflection
    setMsgs((m) => [
      ...m,
      {
        id: id + "a",
        role: "assistant",
        content: (
          <div className="text-sm">
            I can help you find projects or post an opportunity.
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => ask("show projects")}
              >
                Browse projects
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => ask("I want to post an opportunity")}
              >
                Post an opportunity
              </Button>
            </div>
          </div>
        ),
      },
    ]);
    scrollToEnd();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    ask(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e as any);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Launcher */}
      {!open && (
        <button
          aria-label="Open Evie assistant"
          onClick={() => setOpen(true)}
          className="size-14 rounded-full bg-[#17048A] hover:bg-[#2A21A5] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-center"
        >
          <span className="sr-only">Open chat</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-4 4V5Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}

      {open && (
        <div className="w-[90vw] max-w-[420px] rounded-2xl border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-card/60 backdrop-blur">
            <div className="font-semibold flex items-center gap-2">
              Evie{" "}
              <span className="ml-1 inline-flex items-center text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-green-500 mr-1" />{" "}
                Online
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="What I can do"
                className="text-sm underline"
                onClick={() => ask("what can you do")}
              >
                What I can do
              </button>
              <button
                aria-label="Close"
                className="rounded-md px-2 py-1 text-sm hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>
          <div
            ref={listRef}
            className="max-h-[60vh] overflow-auto p-3 space-y-3"
          >
            {msgs.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "inline-block max-w-[85%] rounded-2xl bg-[#17048A] text-white px-3 py-2"
                      : "inline-block max-w-[85%] rounded-2xl bg-card px-3 py-2 border"
                  }
                >
                  {typeof m.content === "string" ? (
                    <span className="text-sm leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </span>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 pb-3">
            {/* Tree UI: category -> question -> answer */}
            <div className="mb-2">
              {!category && (
                <div className="flex flex-wrap gap-2">
                  {FAQ_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCategory(c.id);
                        setSelectedQuestion(null);
                      }}
                      className="text-xs rounded-full border px-3 py-1.5 hover:border-[#17048A] hover:text-[#17048A] transition-colors"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              {category && !selectedQuestion && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{FAQ_CATEGORIES.find((c) => c.id === category)?.label}</div>
                    <button className="text-sm underline" onClick={() => setCategory(null)}>Back</button>
                  </div>
                  <div className="space-y-2">
                    {FAQ_CATEGORIES.find((c) => c.id === category)?.faqs.map((f) => (
                      <button
                        key={f.q}
                        onClick={() => {
                          // push assistant answer message and close category
                          setMsgs((m) => [
                            ...m,
                            { id: String(Date.now()) + "faq", role: "assistant", content: renderFAQAnswer(f) },
                          ]);
                          setCategory(null);
                          scrollToEnd();
                        }}
                        className="w-full text-left rounded-md bg-muted/40 p-2"
                      >
                        {f.q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
