import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trackEvent } from "@/lib/analytics";
import { toast } from "@/components/ui/use-toast";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchOpportunityPublic, type Opportunity } from "@/lib/opportunities";
import { checkIfApplied } from "@/lib/applications";
import { supabase } from "@/lib/supabase";
import { Clock, MapPin, Briefcase, DollarSign, CheckCircle2, ArrowRight, Building2, Calendar, Link, Bookmark, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleBookmark, checkIsBookmarked } from "@/lib/bookmarks";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = React.useState<Opportunity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const applyRef = useRef<HTMLDivElement | null>(null);

  // ... (keep useEffects) ...
  useEffect(() => {
    if (!id) return;
    fetchOpportunityPublic(id)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));

    checkIfApplied(id).then(setHasApplied);
    checkIsBookmarked(id).then(setIsBookmarked);
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("intent") === "apply" && applyRef.current) {
      applyRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [location.search]);

  useEffect(() => {
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          setProfileLoaded(true);
        }
      } catch { }
    })();
  }, []);

  if (!project) {
    return (
      <Layout>
        <Seo title="Opportunity not found – NxteVia" />
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center transition-colors duration-300">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{loading ? "Loading..." : "Opportunity not found"}</h1>
            {!loading && (
              <>
                <p className="text-slate-500 dark:text-slate-400">This opportunity may have moved or no longer exists.</p>
                <Button asChild variant="outline"><a href="/seekers/opportunities">Browse opportunities</a></Button>
              </>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  const applyNow = () => {
    if (hasApplied) return;
    const authed = typeof window !== "undefined" && localStorage.getItem("eaas_authed") === "true";
    const nextUrl = `${window.location.pathname}?intent=apply`;
    if (!authed) {
      navigate(`/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    navigate(`/apply/form/${encodeURIComponent(project.id)}`);
  };

  return (
    <Layout>
      <Seo title={`${project.title} – NxteVia`} description={project.scope} canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/80 dark:from-blue-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

        <section className="container py-10 relative z-10">
          {/* Header */}
          <div className="max-w-5xl mx-auto mb-8">
            <Button
              variant="ghost"
              className="mb-6 pl-0 hover:bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              onClick={() => navigate("/seekers/opportunities")}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Opportunities
            </Button>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 w-fit px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                    <Building2 className="h-4 w-4" />
                    Company Opportunity
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                    {project.title}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {project.modality}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {project.duration}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      {project.hours} hrs/week
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      {project.stipend === "paid" && project.pay_amount
                        ? `POSTED RATE: ${project.currency || "USD"} ${project.pay_amount} / ${project.pay_type || "hourly"}`
                        : project.stipend === "unpaid" ? "Unpaid (ESA Exempt)"
                          : project.stipend === "none" ? "Unpaid"
                            : "Paid"
                      }
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="icon" className="rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link copied", description: "Share this opportunity with others." });
                  }}>
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    onClick={async () => {
                      try {
                        const newState = await toggleBookmark(project.id);
                        setIsBookmarked(newState);
                        toast({
                          title: newState ? "Saved" : "Removed",
                          description: newState ? "Added to your saved items." : "Removed from saved items."
                        });
                        trackEvent("toggle_bookmark", { projectId: project.id, action: newState ? "add" : "remove" });
                      } catch (err: any) {
                        if (err.message?.includes("Must be logged in")) {
                          navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
                        } else {
                          toast({ title: "Error", description: "Failed to update bookmark", variant: "destructive" });
                        }
                      }
                    }}
                  >
                    <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current text-blue-600 dark:text-blue-400")} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-[1fr_380px] items-start">
            {/* Main Content */}
            <div className="space-y-6">
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardContent className="p-8 space-y-8">
                  <section>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      About this opportunity
                    </h2>
                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Problem Statement</h3>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          if (project.desired_outcome) {
                            // If we have a desired_outcome, the problem field shouldn't contain the combined text.
                            // But if it DOES for some reason (migration edge case), we should still clean it.
                            let cleanProblem = project.problem || "No problem statement provided.";
                            if (cleanProblem.includes("**Problem Statement**")) {
                              cleanProblem = cleanProblem.replace(/\*\*Problem Statement\*\*/g, "").split("**Desired Outcome**")[0];
                            }
                            return cleanProblem.trim();
                          }

                          // Backwards compatibility for old records
                          if (project.problem && project.problem.includes("**Problem Statement**")) {
                            const parts = project.problem.split("**Desired Outcome**");
                            return parts[0].replace(/\*\*Problem Statement\*\*/g, "").trim();
                          }
                          return project.problem;
                        })()}
                      </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Desired Outcome</h3>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          if (project.desired_outcome) {
                            return project.desired_outcome;
                          }
                          // Backwards compatibility
                          if (project.problem && project.problem.includes("**Desired Outcome**")) {
                            const parts = project.problem.split("**Desired Outcome**");
                            return parts[1] ? parts[1].trim() : "";
                          }
                          return "";
                        })()}
                      </div>
                    </div>
                  </section>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  <section>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Skills you'll use</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.skills?.map((s) => (
                        <Badge key={s} variant="secondary" className="px-2.5 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </section>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="md:sticky md:top-24 space-y-6" ref={applyRef}>
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-lg shadow-indigo-900/5 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready to apply?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {hasApplied ? "You have already applied to this opportunity." : "This opportunity is open for applications."}
                    </p>
                  </div>

                  <Button
                    className={`w-full h-12 text-sm font-semibold rounded-xl shadow-md transition-all ${hasApplied
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 hover:scale-[1.02]"
                      }`}
                    onClick={applyNow}
                    disabled={hasApplied}
                  >
                    {hasApplied ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Applied
                      </>
                    ) : (
                      <>
                        Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                      <span>Applications reviewed frequently</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="h-4 w-4 text-slate-400 mt-0.5" />
                      <span>Quick & easy process</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <Popover>
                      <PopoverTrigger className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-4 transition-colors">
                        What happens after I apply?
                      </PopoverTrigger>
                      <PopoverContent align="center" className="w-72 p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="font-semibold mb-2 text-sm text-slate-900 dark:text-white">Application Process</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <li className="flex gap-2"><span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span> Complete the short form</li>
                          <li className="flex gap-2"><span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span> Organization reviews profile</li>
                          <li className="flex gap-2"><span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span> Receive kickoff email if selected</li>
                        </ul>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Mobile Sticky Bar */}
        <div className="fixed inset-x-0 bottom-0 md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg p-4 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <Button
            className={`w-full h-11 rounded-xl text-sm font-semibold shadow-md ${hasApplied
              ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
            onClick={applyNow}
            disabled={hasApplied}
          >
            {hasApplied ? "Applied" : "Apply Now"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
