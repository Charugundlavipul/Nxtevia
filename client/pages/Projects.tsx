import { useMemo, useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/analytics";
import { SkillsCombobox } from "@/components/site/SkillsCombobox";
import { fetchActiveOpportunities, type Opportunity } from "@/lib/opportunities";
import { Search, Filter, Briefcase, Clock, MapPin, DollarSign, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type Filters = {
  skills: Set<string>;
  modality: "" | "remote" | "hybrid" | "on-site";
  duration: "" | "0-3m" | "4-6m" | "7-9m" | "10-12m" | ">12m";
  stipend: "" | "none" | "micro" | "modest";
  q: string;
};

const durationWeeksFromLabel = (label: string) => {
  if (label === "0-3m") return 12;
  if (label === "4-6m") return 20;
  if (label === "7-9m") return 32;
  if (label === "10-12m") return 48;
  if (label === ">12m") return 60;
  return 12;
};

export default function Projects() {
  const [list, setList] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    skills: new Set(),
    modality: "",
    duration: "",
    stipend: "",
    q: "",
  });
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetchActiveOpportunities()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let rows = (list || []).filter((p) => {
      if (filters.modality && p.modality !== filters.modality) return false;
      if (filters.stipend) {
        if (filters.stipend === "none") {
          if (p.stipend !== "none" && p.stipend !== "unpaid") return false;
        } else if (filters.stipend === "micro") {
          if (p.stipend !== "micro" && p.stipend !== "stipend") return false;
        } else if (filters.stipend === "modest") {
          if (p.stipend !== "modest" && p.stipend !== "paid") return false;
        } else if (p.stipend !== filters.stipend) {
          return false;
        }
      }
      if (filters.duration) {
        const w = durationWeeksFromLabel(p.duration);
        const inRange = (min: number, max: number) => w >= min && w <= max;
        if (filters.duration === "0-3m" && !inRange(0, 12)) return false;
        if (filters.duration === "4-6m" && !inRange(13, 24)) return false;
        if (filters.duration === "7-9m" && !inRange(25, 36)) return false;
        if (filters.duration === "10-12m" && !inRange(37, 52)) return false;
        if (filters.duration === ">12m" && !(w >= 53)) return false;
      }
      if (filters.skills.size) {
        const hasAny = Array.from(filters.skills).some((s) =>
          (p.skills || []).includes(s),
        );
        if (!hasAny) return false;
      }
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const match = `${p.title} ${(p.skills || []).join(" ")}`
          .toLowerCase()
          .includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (sort === "newest")
      rows = rows.sort(
        (a, b) => +new Date(b.created_at || b.updated_at || 0) - +new Date(a.created_at || a.updated_at || 0),
      );
    if (sort === "shortest")
      rows = rows.sort((a, b) => durationWeeksFromLabel(a.duration) - durationWeeksFromLabel(b.duration));
    return rows;
  }, [filters, sort, list]);

  const clearAll = () => {
    setFilters((f) => ({
      ...f,
      skills: new Set(),
      modality: "",
      duration: "",
      stipend: "",
      q: "",
    }));
    trackEvent("project_filter", { type: "clear_all" });
  };

  return (
    <Layout>
      <Seo
        title="Opportunities — NxteVia"
        description="Browse structured, verifiable opportunities across the globe."
        canonical={window.location.href}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 transition-colors duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-blob"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-blob animation-delay-2000"
          />
        </div>

        <section className="container py-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                  Opportunities <Sparkles className="h-6 w-6 text-yellow-500" />
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
                  Discover projects that match your skills and career goals.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">Sort by:</span>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent focus:ring-0 text-sm font-medium text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="shortest">Shortest Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by title or skill..."
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  className="pl-9 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                <Select
                  value={filters.modality}
                  onValueChange={(v) => setFilters({ ...filters, modality: v === "all" ? "" : (v as any) })}
                >
                  <SelectTrigger className="w-[130px] bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <MapPin className="h-3.5 w-3.5 mr-2 text-slate-500 dark:text-slate-400" />
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Mode</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="on-site">On-site</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.duration}
                  onValueChange={(v) => setFilters({ ...filters, duration: v === "all" ? "" : (v as any) })}
                >
                  <SelectTrigger className="w-[140px] bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <Clock className="h-3.5 w-3.5 mr-2 text-slate-500 dark:text-slate-400" />
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Duration</SelectItem>
                    <SelectItem value="0-3m">0-3 months</SelectItem>
                    <SelectItem value="4-6m">4-6 months</SelectItem>
                    <SelectItem value="7-9m">7-9 months</SelectItem>
                    <SelectItem value="10-12m">10-12 months</SelectItem>
                    <SelectItem value=">12m">&gt; 12 months</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.stipend}
                  onValueChange={(v) => setFilters({ ...filters, stipend: v === "all" ? "" : (v as any) })}
                >
                  <SelectTrigger className="w-[130px] bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <DollarSign className="h-3.5 w-3.5 mr-2 text-slate-500 dark:text-slate-400" />
                    <SelectValue placeholder="Stipend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Pay</SelectItem>
                    <SelectItem value="none">Unpaid</SelectItem>
                    <SelectItem value="micro">Small Stipend</SelectItem>
                    <SelectItem value="modest">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-auto min-w-[200px]">
                <SkillsCombobox
                  selected={Array.from(filters.skills)}
                  onChange={(arr) => setFilters((f) => ({ ...f, skills: new Set(arr) }))}
                  placeholder="Filter by skills..."
                />
              </div>

              {(filters.q || filters.modality || filters.duration || filters.stipend || filters.skills.size > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear
                </Button>
              )}
            </div>
          </motion.div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/40 dark:bg-slate-800/40 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700"
            >
              <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
                <Filter className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No opportunities found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              <Button onClick={clearAll} variant="outline" className="mt-6">
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((p, index) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className="group relative h-full flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden hover:-translate-y-1"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <CardHeader className="space-y-3 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "mb-2 capitalize font-medium",
                                p.modality === 'remote' ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50" :
                                  p.modality === 'hybrid' ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50" :
                                    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50"
                              )}
                            >
                              {p.modality}
                            </Badge>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary dark:group-hover:text-white dark:hover:text-white dark:group-hover:text-primary dark:group-hover:text-white dark:hover:text-white transition-colors">
                              {p.title}
                            </CardTitle>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm">
                            <Clock className="h-3.5 w-3.5" />
                            {p.duration}
                          </div>
                          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm">
                            <Briefcase className="h-3.5 w-3.5" />
                            {p.hours} hrs/week
                          </div>
                          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm">
                            <DollarSign className="h-3.5 w-3.5" />
                            {p.stipend === "none" || p.stipend === "unpaid" ? "Unpaid" : p.stipend === "micro" ? "Stipend" : "Paid"}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col pt-0">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(p.skills || []).slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 backdrop-blur-sm"
                              >
                                {s}
                              </span>
                            ))}
                            {(p.skills?.length || 0) > 4 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                +{p.skills!.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                          <Button asChild className="w-full group-hover:bg-primary transition-all shadow-sm group-hover:shadow-primary/25" size="lg">
                            <Link to={`/seekers/opportunities/${encodeURIComponent(p.id)}`} className="flex items-center justify-center gap-2">
                              View Details
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
